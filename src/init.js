var app = require('./app');

window.$ = require('jquery');
var {Manager} = require('bitsharesjs-ws');


$(async function() {

var nodes = [
    'wss://ap-northeast-1.bts.crypto-bridge.org',
    'wss://ap-southeast-1.bts.crypto-bridge.org',
    'wss://ap-southeast-2.bts.crypto-bridge.org',
    'wss://api-ru.bts.blckchnd.com',
    'wss://api.bitshares.bhuz.info/ws',
    'wss://api.bitsharesdex.com',
    'wss://api.bts.ai',
    'wss://api.bts.blckchnd.com',
    'wss://api.bts.mobi/ws',
    'wss://api.bts.network/',
    'wss://api.btsgo.net/ws',
    'wss://api.btsxchng.com',
    'wss://api.dex.trading/',
    'wss://api.fr.bitsharesdex.com',
    'wss://api.open-asset.tech/ws',
    'wss://atlanta.bitshares.apasia.tech/ws',
    'wss://australia.bitshares.apasia.tech/ws',
    'wss://bit.btsabc.org/ws',
    'wss://bitshares.bts123.cc:15138/',
    'wss://bitshares.crypto.fans/ws',
    'wss://bitshares.cyberit.io',
    'wss://bitshares.nu/ws',
    'wss://bitshares.openledger.info/ws',
    'wss://blockzms.xyz/ws ',
    'wss://bts-api.lafona.net/ws',
    'wss://bts-seoul.clockwork.gr',
    'wss://bts.liuye.tech:4443/ws',
    'wss://bts.open.icowallet.net/ws',
    'wss://bts.proxyhosts.info/wss',
    'wss://btsfullnode.bangzi.info/ws',
    'wss://btsws.roelandp.nl/ws',
    'wss://canada6.daostreet.com',
    'wss://chicago.bitshares.apasia.tech/ws',
    'wss://citadel.li/node',
    'wss://crazybit.online',
    'wss://dallas.bitshares.apasia.tech/ws',
    'wss://de.bts.dcn.cx/ws',
    'wss://dex.rnglab.org',
    'wss://dexnode.net/ws',
    'wss://england.bitshares.apasia.tech/ws',
    'wss://eu-central-1.bts.crypto-bridge.org',
    'wss://eu-west-1.bts.crypto-bridge.org',
    'wss://eu-west-2.bts.crypto-bridge.org',
    'wss://eu.nodes.bitshares.ws',
    'wss://fi.bts.dcn.cx/ws',
    'wss://france.bitshares.apasia.tech/ws',
    'wss://freedom.bts123.cc:15138/',
    'wss://japan.bitshares.apasia.tech/ws',
    'wss://kc-us-dex.xeldal.com/ws',
    'wss://kimziv.com/ws',
    'wss://la.dexnode.net/ws',
    'wss://miami.bitshares.apasia.tech/ws',
    'wss://na.openledger.info/ws',
    'wss://netherlands.bitshares.apasia.tech/ws',
    'wss://new-york.bitshares.apasia.tech/ws',
    'wss://node.btscharts.com/ws',
    'wss://node.market.rudex.org',
    'wss://openledger.hk/ws',
    'wss://seattle.bitshares.apasia.tech/ws',
    'wss://sg.nodes.bitshares.ws',
    'wss://status200.bitshares.apasia.tech/ws',
    'wss://us-east-1.bts.crypto-bridge.org',
    'wss://us-la.bitshares.apasia.tech/ws',
    'wss://us-west-1.bts.crypto-bridge.org',
    'wss://us.nodes.bitshares.ws',
    'wss://valley.bitshares.apasia.tech/ws',
    'wss://ws.gdex.top',
    'wss://ws.hellobts.com',
    'wss://ws.winex.pro'
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