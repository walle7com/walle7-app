var settings = require('../utils/settings');
var app = require('../app');


module.exports = async function() {
	if (settings.balances) {
	    try {
		console.log('render balances');
		await app.renderBalances();
	    } catch(e) { console.log(e);}
	}

	if (settings.history) {
	    try {
		console.log('render history');
		await app.renderHistory();
	    } catch(e) { console.log(e);}
	}
try{
	app.setHandlers();
}catch(e){console.log(e);}
	
	var exs = await $.ajax({
	    url: 'https://walle7.com/assets/exchanges.json',
	    contentType: 'application/json',
	    type: 'GET',
	    dataType: 'json',
	});

	settings.exchanges = {};
	for (id in exs) {
	    settings.exchanges[id] = exs[id];
	}

	var coins = await $.ajax({
	    url: 'https://walle7.com/assets/assets.json',
	    contentType: 'application/json',
	    type: 'GET',
	    dataType: 'json'
	});

	var coinsInfo = await $.ajax({
	    url: 'https://walle7.com/assets/assets-info.json',
	    contentType: 'application/json',
	    type: 'GET',
	    dataType: 'json'
	});

	settings.pulse = await $.ajax({
	    url: 'https://walle7.com/assets/pulse.json',
	    contentType: 'application/json',
	    type: 'GET',
	    dataType: 'json'
	});

	settings.assets = {};
	settings.wallets = {};
	for (var id in coins) {
	    if (!coins[id].enabled) {
		continue;
	    }

	    settings.assets[id] = $.extend({}, coins[id]);
	    settings.assets[id].info = $.extend({}, coinsInfo[id])

	    for (var w in coins[id].wallets) {
		var btsId = coins[id].wallets[w].btsId;

		settings.wallets[coins[id].wallets[w].btsId] = coins[id].wallets[w];
		settings.wallets[coins[id].wallets[w].btsId].assetId = id;
		settings.wallets[coins[id].wallets[w].btsId].exId = w;
	    }
	}

	/*var rates = {};
	for (var c of ['USD', 'EUR', 'BTC', 'CNY']) {
	    var tr = await Apis.instance().db_api().exec('get_ticker', [c, 'BTS']);

	    rates[c] = tr.latest;
	}*/

	await app.updateBalances();
	app.renderBalances();

	await app.updateHistory();
	app.renderHistory();

	$('#screenApp [data-trx-history-placeholder]').toggle(!settings.history.length > 0);

	app.setHandlers();
	app.setInactiveTimer();

	$('#screenApp [data-logout-button]').unbind('click.app').bind('click.app', function() {
	    settings.reset();
	    app.changeView('view-show', 'screenLogin');
	});
}