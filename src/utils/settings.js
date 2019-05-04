var CryptoJS = require('crypto-js');

var _userData = {};
var _pin = null;

function get(name, nullValue) {
  if (typeof _userData[name] == 'undefined') {
    _userData[name] = nullValue;
  }

  return _userData[name];
}

function set(name, val) {
  _userData[name] = val;
  save();
}

function load(key) {
  var bytes = CryptoJS.AES.decrypt(localStorage['userData'], key);

  try {
    _userData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    _pin = key;

    return true;
  } catch(e) {
    return false;
  }
}

function save() {
  localStorage['userData'] = CryptoJS.AES.encrypt(JSON.stringify(_userData), _pin);
}

function reset() {
  _userData = {};
  _pin = null;

  delete localStorage['userData'];
}

module.exports = {
  set balances(val) {
    set('balances', val);
  },
  get balances() {
    return get('balances', null);
  },

  set user(val) {
    _userData['user'] = val;
    //set('user', val);
  },
  get user() {
    return get('user', null);
  },

  set assets(val) {
    set('assets', val);
  },
  get assets() {
    return get('assets', {});
  },

  set wallets(val) {
    set('wallets', val);
  },
  get wallets() {
    return get('wallets', {});
  },

  set exchanges(val) {
    set('exchanges', val);
  },
  get exchanges() {
    return get('exchanges', {});
  },

  set totalBalances(val) {
    set('totalBalances', val);
  },
  get totalBalances() {
    return get('totalBalances', null);
  },

  set history(val) {
    set('history', val);
  },
  get history() {
    return get('history', []);
  },

  set pulse(val) {
    set('pulse', val);
  },
  get pulse() {
    return get('pulse', {});
  },

  set pin(val) {
    _pin = val;
  },

  load: load,
  save: save,
  reset: reset,
}