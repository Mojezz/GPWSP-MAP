/*
 * The map.
 *
 * Draws the world from our own country-outline file (no outside map servers),
 * then adds three layers that can be switched on and off:
 *   1. Crowdsourced data      -> data/sample-crowdsourced.geojson
 *   2. Public data overlays   -> data/sample-public-overlays.geojson
 *   3. Legislation            -> data/sample-legislation.json
 *
 * SAFETY: popups are built with textContent, never by inserting raw HTML.
 * That way, text inside a data file can never run as code in a visitor's browser.
 * Keep it this way when real data arrives.
 */
(function () {
  'use strict';

  var t = window.I18N.t;
  var fmt = window.I18N.formatNumber;

  /* Colours. Change them here and the map and the key both update. */
  var COLORS = {
    sea: '#cfe3ee',
    land: '#f4f1ea',
    border: '#9aa3ad',
    categories: {
      wages: '#15803d',
      deactivations: '#ea580c',
      company_relationships: '#7c3aed'
    },
    overlay: '#b45309',
    legislation: {
      protective_law: '#1d4ed8',
      draft_law: '#93c5fd',
      no_specific_law: '#d4d4d8',
      restrictive: '#7f1d1d'
    }
  };

  function fetchJson(url) {
    return fetch(url, { credentials: 'omit' }).then(function (r) {
      if (!r.ok) throw new Error('Could not load ' + url);
      return r.json();
    });
  }

  /* ---------- Popups ---------- */

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  function popupContent(title, rows) {
    var box = el('div', 'popup');
    box.appendChild(el('p', 'sample-badge', t('popup.sample_badge')));
    box.appendChild(el('h3', 'popup-title', title));
    var dl = el('dl');
    rows.forEach(function (row) {
      if (row[1] === undefined || row[1] === null || row[1] === '') return;
      dl.appendChild(el('dt', null, row[0]));
      dl.appendChild(el('dd', null, row[1]));
    });
    box.appendChild(dl);
    return box;
  }

  function crowdsourcedPopup(p) {
    var rows = [
      [t('popup.place'), p.place + ', ' + p.country],
      [t('popup.sector'), t('sectors.' + p.sector)],
      [t('popup.reports'), fmt(p.reports)]
    ];
    if (p.category === 'wages') {
      rows.push([t('popup.hourly_pay'), t('popup.hourly_pay_value', {
        amount: fmt(p.hourly_pay_usd, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      })]);
    } else if (p.category === 'deactivations') {
      rows.push([t('popup.deactivations'), fmt(p.deactivations)]);
    } else if (p.category === 'company_relationships') {
      rows.push([t('popup.relationship'), t('popup.relationship_value', {
        company: p.company,
        relationship: t('relationships.' + p.relationship),
        related: p.related_company
      })]);
    }
    return popupContent(t('categories.' + p.category), rows);
  }

  function overlayPopup(p) {
    return popupContent(t('overlays.' + p.overlay), [
      [t('popup.country'), p.country],
      [t('popup.value'), t('popup.value_people', { amount: fmt(p.value) })],
      [t('popup.source'), p.source]
    ]);
  }

  function legislationPopup(entry) {
    return popupContent(entry.country, [
      [t('popup.status'), t('legislation_status.' + entry.status)],
      [t('popup.law'), entry.law],
      [t('popup.since'), entry.since ? String(entry.since) : null]
    ]);
  }

  /* ---------- Key (legend) ---------- */

  function fillLegend(listId, items) {
    var list = document.getElementById(listId);
    list.textContent = '';
    items.forEach(function (item) {
      var li = el('li');
      var swatch = el('span', 'swatch ' + (item.shape || ''));
      swatch.style.setProperty('--swatch', item.color);
      li.appendChild(swatch);
      li.appendChild(el('span', null, item.label));
      list.appendChild(li);
    });
  }

  /* ---------- Layer panel (opens as a sheet on phones) ---------- */

  function setupPanel() {
    var panel = document.getElementById('layers-panel');
    var openBtn = document.getElementById('layers-button');
    var closeBtn = document.getElementById('layers-close');
    function setOpen(open) {
      panel.classList.toggle('open', open);
      openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) closeBtn.focus();
    }
    openBtn.addEventListener('click', function () { setOpen(!panel.classList.contains('open')); });
    closeBtn.addEventListener('click', function () { setOpen(false); openBtn.focus(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) { setOpen(false); openBtn.focus(); }
    });
  }

  function setupAbout() {
    var dialog = document.getElementById('about-dialog');
    document.getElementById('about-button').addEventListener('click', function () { dialog.showModal(); });
    document.getElementById('about-close').addEventListener('click', function () { dialog.close(); });
  }

  function bindToggle(map, inputId, layer) {
    var input = document.getElementById(inputId);
    function sync() {
      if (input.checked) layer.addTo(map); else map.removeLayer(layer);
    }
    input.addEventListener('change', sync);
    sync();
  }

  /* ---------- Build the map ---------- */

  function buildMap(world, crowd, overlays, legislation) {
    var map = L.map('map', {
      zoomSnap: 0.5,
      minZoom: 1,
      maxZoom: 6,              // country level only: no street detail, on purpose
      maxBounds: [[-75, -220], [88, 220]],
      maxBoundsViscosity: 0.8,
      worldCopyJump: false
    });
    map.attributionControl.setPrefix(false);
    map.attributionControl.addAttribution(t('map.attribution'));
    map.getContainer().style.background = COLORS.sea;

    /* Drawing order: countries, then legislation colours, then overlays, then points on top */
    map.createPane('legislation').style.zIndex = 410;
    map.createPane('overlays').style.zIndex = 420;
    map.createPane('points').style.zIndex = 430;

    L.geoJSON(world, {
      interactive: false,
      style: { color: COLORS.border, weight: 0.6, fillColor: COLORS.land, fillOpacity: 1 }
    }).addTo(map);

    var laws = legislation.countries || {};
    var legislationLayer = L.geoJSON(world, {
      pane: 'legislation',
      filter: function (f) { return Object.prototype.hasOwnProperty.call(laws, f.id); },
      style: function (f) {
        return {
          color: '#4b5563', weight: 0.8,
          fillColor: COLORS.legislation[laws[f.id].status] || '#ccc', fillOpacity: 0.75
        };
      },
      onEachFeature: function (f, layer) {
        layer.bindPopup(function () { return legislationPopup(laws[f.id]); });
      }
    });

    var overlayLayer = L.geoJSON(overlays, {
      pane: 'overlays',
      pointToLayer: function (f, latlng) {
        return L.circle(latlng, {
          pane: 'overlays',
          radius: (f.properties.radius_km || 300) * 1000,
          color: COLORS.overlay, weight: 2, dashArray: '6 6',
          fillColor: COLORS.overlay, fillOpacity: 0.15
        });
      },
      onEachFeature: function (f, layer) {
        layer.bindPopup(function () { return overlayPopup(f.properties); });
      }
    });

    var crowdLayer = L.geoJSON(crowd, {
      pane: 'points',
      pointToLayer: function (f, latlng) {
        return L.circleMarker(latlng, {
          pane: 'points',
          radius: 11, weight: 3, color: '#ffffff',
          fillColor: COLORS.categories[f.properties.category] || '#444', fillOpacity: 1
        });
      },
      onEachFeature: function (f, layer) {
        layer.bindPopup(function () { return crowdsourcedPopup(f.properties); });
      }
    });

    bindToggle(map, 'toggle-legislation', legislationLayer);
    bindToggle(map, 'toggle-overlays', overlayLayer);
    bindToggle(map, 'toggle-crowdsourced', crowdLayer);

    fillLegend('legend-crowdsourced', Object.keys(COLORS.categories).map(function (k) {
      return { color: COLORS.categories[k], label: t('categories.' + k), shape: 'dot' };
    }));
    fillLegend('legend-overlays', [
      { color: COLORS.overlay, label: t('overlays.platform_workforce_estimate'), shape: 'ring' }
    ]);
    fillLegend('legend-legislation', Object.keys(COLORS.legislation).map(function (k) {
      return { color: COLORS.legislation[k], label: t('legislation_status.' + k) };
    }));

    /* Starting view: whole world on big screens; on narrow phones, a closer view the visitor can drag */
    if (map.getSize().x < 600) {
      map.setView([12, 20], 1.5);
    } else {
      map.fitBounds([[-50, -150], [70, 160]]);
    }
    return map;
  }

  function showError() {
    document.getElementById('load-error').hidden = false;
  }

  setupPanel();
  setupAbout();

  window.I18N.init().then(function () {
    return Promise.all([
      fetchJson('data/world-countries.geojson'),
      fetchJson('data/sample-crowdsourced.geojson'),
      fetchJson('data/sample-public-overlays.geojson'),
      fetchJson('data/sample-legislation.json')
    ]);
  }).then(function (res) {
    window.GPWSP_MAP = buildMap(res[0], res[1], res[2], res[3]);
  }).catch(function (err) {
    showError();
    if (window.console) console.error(err);
  });
})();
