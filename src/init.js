var app = require('./app');

window.$ = require('jquery');
var {Manager} = require('bitsharesjs-ws');


$(async function() {

var nodes = [
    'wss://api.bts.ai',
    'wss://api.bts.mobi/ws',
    'wss://api.btsgo.net/ws',
    'wss://api.dex.trading/',
    'wss://atlanta.us.api.bitshares.org/ws',
    'wss://bitshares.openledger.info/ws',
    'wss://bts.proxyhosts.info/wss',
    'wss://btsfullnode.bangzi.info/ws',
    'wss://btsws.roelandp.nl/ws',
    'wss://chicago.us.api.bitshares.org/ws',
    'wss://dallas.us.api.bitshares.org/ws',
    'wss://eu.nodes.bitshares.ws',
    'wss://kc-us-dex.xeldal.com/ws',
    'wss://kimziv.com/ws',
    'wss://losangeles.us.api.bitshares.org/ws',
    'wss://miami.us.api.bitshares.org/ws',
    'wss://na.openledger.info/ws',
    'wss://new-york.us.api.bitshares.org/ws',
    'wss://openledger.hk/ws',
    'wss://seattle.us.api.bitshares.org/ws',
    'wss://sg.nodes.bitshares.ws',
    'wss://siliconvalley.us.api.bitshares.org/ws',
    'wss://toronto.ca.api.bitshares.org/ws',
    'wss://toronto2.ca.api.bitshares.org/ws'
];

var nodeUrl = nodes[nodes.length * Math.random() | 0];
//var nodeUrl = 'wss://ap-southeast-1.bts.crypto-bridge.org';

var _connectionManager = new Manager({
    url: nodeUrl,
    urls: nodes,
    autoFallback: true,
    closeCb: async () => {
	console.log('reconnecting');
	//await Apis.reset(_connectionManager.url, true, undefined);
	//console.log('connected');
    },
    urlChangeCallback: url => {
	console.log("fallback to new url:", url);
	//nodeUrl = url;
    }
});

console.log('connecting');
await _connectionManager.connectWithFallback(true);
console.log('connected');


if (app.isTouchDevice()) {
    $('body').addClass('touch');
} else {
    $('body').addClass('notouch');
}

if (/Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)) {
    $('body').addClass('webkit');
}

if (/iPhone/.test(navigator.userAgent) || /iPad/.test(navigator.userAgent)) {
    $('body').addClass('ios');
}

if (/OS X/.test(navigator.userAgent) && /Electron/.test(navigator.userAgent)) {
    $('body').addClass('osx');
}

if (/Windows NT/.test(navigator.userAgent) ||
    /X11/.test(navigator.userAgent) ||
    /Macintosh/.test(navigator.userAgent)) {
    $('body').addClass('desktop');
}

setTimeout(function() {
    $('.preloader').removeClass('active');
}, 600);

if (typeof localStorage['userData'] != 'undefined') {
    app.changeView('view-show', 'screenPin');
} else {
    app.changeView('view-show', 'screenOnboarding');
}

app.setHandlers();

});