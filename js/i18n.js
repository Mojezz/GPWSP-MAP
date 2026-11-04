/*
 * Translations.
 *
 * Every word on the site lives in locales/<code>.json (for example locales/en.json).
 * Languages offered in the menu are listed in locales/languages.json.
 *
 * In the HTML, an element like <h2 data-i18n="layers.heading"></h2> is filled with the
 * text found at "layers" -> "heading" in the language file.
 *
 * The chosen language is kept only in the page address (for example ?lang=fr).
 * Nothing is saved on the visitor's device.
 */
(function () {
  'use strict';

  var DEFAULT_LANG = 'en';
  var strings = {};
  var fallback = {};
  var current = { code: DEFAULT_LANG, dir: 'ltr' };

  function lookup(obj, key) {
    return key.split('.').reduce(function (o, part) {
      return o && Object.prototype.hasOwnProperty.call(o, part) ? o[part] : undefined;
    }, obj);
  }

  /* t('popup.hourly_pay_value', { amount: '2.40' }) -> "2.40 USD per hour" */
  function t(key, vars) {
    var text = lookup(strings, key);
    if (typeof text !== 'string') text = lookup(fallback, key);
    if (typeof text !== 'string') return key; // a missing translation shows its key, so it is easy to spot
    return text.replace(/\{(\w+)\}/g, function (m, name) {
      return vars && vars[name] !== undefined ? String(vars[name]) : m;
    });
  }

  function formatNumber(n, options) {
    try {
      return new Intl.NumberFormat(current.code, options).format(n);
    } catch (e) {
      return String(n);
    }
  }

  function applyToPage() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.documentElement.lang = current.code;
    document.documentElement.dir = current.dir;
  }

  function fetchJson(url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('Could not load ' + url);
      return r.json();
    });
  }

  function pickLanguage(languages) {
    var codes = languages.map(function (l) { return l.code; });
    var fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl && codes.indexOf(fromUrl) !== -1) return fromUrl;
    var browser = (navigator.languages || [navigator.language || '']).map(function (l) {
      return String(l).toLowerCase().split('-')[0];
    });
    for (var i = 0; i < browser.length; i++) {
      if (codes.indexOf(browser[i]) !== -1) return browser[i];
    }
    return DEFAULT_LANG;
  }

  function buildLanguageMenu(languages) {
    var select = document.getElementById('language-select');
    if (!select) return;
    select.textContent = '';
    languages.forEach(function (l) {
      var opt = document.createElement('option');
      opt.value = l.code;
      opt.textContent = l.name;
      if (l.code === current.code) opt.selected = true;
      select.appendChild(opt);
    });
    select.hidden = languages.length < 2; // no menu needed while only English exists
    select.addEventListener('change', function () {
      var url = new URL(window.location.href);
      url.searchParams.set('lang', select.value);
      window.location.href = url.toString();
    });
  }

  function init() {
    return fetchJson('locales/languages.json').then(function (languages) {
      var code = pickLanguage(languages);
      var info = languages.filter(function (l) { return l.code === code; })[0];
      current = { code: code, dir: info && info.dir === 'rtl' ? 'rtl' : 'ltr' };
      return Promise.all([
        fetchJson('locales/' + DEFAULT_LANG + '.json'),
        code === DEFAULT_LANG ? null : fetchJson('locales/' + code + '.json')
      ]).then(function (res) {
        fallback = res[0];
        strings = res[1] || res[0];
        applyToPage();
        buildLanguageMenu(languages);
        return current;
      });
    });
  }

  window.I18N = {
    init: init,
    t: t,
    formatNumber: formatNumber,
    get dir() { return current.dir; }
  };
})();
