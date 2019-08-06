var numbers = require('../utils/numbers');
var settings = require('../utils/settings');
var app = require('../app');

var {Apis} = require('bitsharesjs-ws');
var {TransactionBuilder} = require('bitsharesjs');
require('@beetapp/beet-js');

var beetApp;

module.exports = {
	main: async function(arg) {
	    console.log('main');

	    if (Object.keys(settings.balances).length == 0) {
		await app.changeView('multi-view-modal-show', {
		    modalName: 'modalExchangeCoins',
		    viewName: 'firstdeposit'
		});
		
		return false;
	    }

	    if (arg) {
		arg = JSON.parse(arg);
	    } else {
		arg = {
		    sell: { },
		    buy: { }
		}
	    }

	    $('#modalExchangeCoins [data-coin-search]').unbind('keyup.mwallets').bind('keyup.mwallets', function() {
		var value = $(this).val().toLowerCase();

		$('#modalExchangeCoins [data-sell-coins-list] li').filter(function() {
		    $(this).toggle(
			$(this).find('[data-symbol]').text().toLowerCase().indexOf(value) > -1 ||
			$(this).find('[data-name]').text().toLowerCase().indexOf(value) > -1
		    );
		});
	    
		$('#modalExchangeCoins [data-coin-search-empty]').toggle(
		    !$('#modalExchangeCoins [data-sell-coins-list] li:visible').length
		);
		//$('#coin-search-unsupported').toggle(!value.length);
		$('#modalExchangeCoins .areaClear').toggleClass('active', value.length > 0);
	    });

	    $('#modalExchangeCoins .areaClear').unbind('click.mwallets').bind('click.mwallets', function() {
		$('#modalExchangeCoins [data-coin-search]').val('');
		$('#modalExchangeCoins [data-coin-search]').trigger('keyup');
	    });

	    $('#modalExchangeCoins [data-sell-coins-list]').empty();

	    var sortedAssets = [];
	    for (var assetId in settings.assets) {
		sortedAssets.push({
		    usdAmount: settings.balances[assetId]
			? settings.balances[assetId].usdAmount
			: 0,
		    amount: settings.balances[assetId]
			? settings.balances[assetId].amount
			: 0,
		    volume24h: settings.pulse[assetId].pulse.volume_24h,
		    id: assetId
		});
	    }

	    sortedAssets.sort(function(a, b) {
		return b.usdAmount - a.usdAmount || b.volume24h - a.volume24h;
	    });

	    for (var asset of sortedAssets) {
		var amount = numbers.shortenNumber(asset.amount);
		var usdAmount = numbers.shortenNumber(asset.usdAmount);

		if (amount == 0) {
		    continue;
		}

		var data = {
		    name: settings.assets[asset.id].name,
	    	    symbol: settings.assets[asset.id].symbol,
	    	    amount: amount,
	    	    'usd-amount': usdAmount
		};

		var div = $('#modalExchangeCoins [data-sell-coin-template] > li').clone();

		for (var k in data) {
		    div.find('[data-' + k + ']').text(data[k]);
		}

		arg.sell = {
		    assetId: asset.id
		}
		div.attr('data-modal-arg', JSON.stringify(arg));
		div.addClass('c-' + asset.id);
	    
		div.appendTo('#modalExchangeCoins [data-sell-coins-list]');
	    }

	    app.setHandlers();

	    $('#modalExchangeCoins [data-coin-search]').val('');
	    $('#modalExchangeCoins [data-coin-search]').trigger('keyup');
	},
	
	selectSellWallet: async function(arg) {
	    console.log('selectSellWallet');
	    
	    arg = JSON.parse(arg);

	    var sortedWalletsBalances = [];
	    for (var id in settings.assets[arg.sell.assetId].wallets) {
		var btsId = settings.assets[arg.sell.assetId].wallets[id].btsId;

		sortedWalletsBalances.push({
		    amount: settings.balances[arg.sell.assetId] && settings.balances[arg.sell.assetId].wallets[btsId]
			? settings.balances[arg.sell.assetId].wallets[btsId].amount
			: 0,
		    id: id
		});
	    }

	    if (sortedWalletsBalances.length == 1) {
		arg.sell.walletId = sortedWalletsBalances[0].id;

		await app.changeView('multi-view-modal-show', {
		    modalName: 'modalExchangeCoins',
		    viewName: 'selectBuyCoin'
		}, JSON.stringify(arg));
		
		return false;
	    }

	    sortedWalletsBalances.sort(function(a, b) {
		return b.amount - a.amount;
    	    });

	    $('#modalExchangeCoins [data-sell-wallets]').empty();
	    $('#modalExchangeCoins [data-symbol]').text(settings.assets[arg.sell.assetId].symbol);
	
	    for (var wallet of sortedWalletsBalances) {
		if (wallet.amount == 0) {
		    continue;
		}
		
		var div = $('#modalExchangeCoins [data-sell-wallet-template] > li').clone();
		var usdAmount = numbers.shortenNumber(wallet.amount * settings.pulse[arg.sell.assetId].pulse.price);
		wallet.amount = numbers.shortenNumber(wallet.amount);

		arg.sell.walletId = wallet.id;
		div.attr('data-modal-arg', JSON.stringify(arg));
		div.find('[data-name]').text(settings.exchanges[wallet.id].name);
		div.find('[data-amount]').text(wallet.amount);
		div.find('[data-usd-amount]').text(usdAmount);
	    
		div.appendTo('#modalExchangeCoins [data-sell-wallets]');
	    }

	    app.setHandlers();
	},

	selectBuyCoin: async function(arg) {
	    console.log('selectBuyCoin');

	    arg = JSON.parse(arg);

	    if (arg.buy.assetId) {
		await app.changeView('multi-view-modal-show', {
		    modalName: 'modalExchangeCoins',
		    viewName: 'exchange'
		}, JSON.stringify(arg));

		return false;
	    }

	    $('#modalExchangeCoins [data-coin-search]').unbind('keyup.mwallets').bind('keyup.mwallets', function() {
		var value = $(this).val().toLowerCase();

		$('#modalExchangeCoins [data-buy-coins-list] li').filter(function() {
		    $(this).toggle(
			$(this).find('[data-symbol]').text().toLowerCase().indexOf(value) > -1 ||
			$(this).find('[data-name]').text().toLowerCase().indexOf(value) > -1
		    );
		});
	    
		$('#modalExchangeCoins [data-coin-search-empty]').toggle(
		    !$('#modalExchangeCoins [data-buy-coins-list] li:visible').length
		);
		//$('#coin-search-unsupported').toggle(!value.length);
		$('#modalExchangeCoins .areaClear').toggleClass('active', value.length > 0);
	    });

	    $('#modalExchangeCoins .areaClear').unbind('click.mwallets').bind('click.mwallets', function() {
		$('#modalExchangeCoins [data-coin-search]').val('');
		$('#modalExchangeCoins [data-coin-search]').trigger('keyup');
	    });

	    $('#modalExchangeCoins [data-buy-coins-list]').empty();

	    var sortedAssets = [];
	    for (var assetId in settings.assets) {
		sortedAssets.push({
		    usdAmount: settings.balances[assetId]
			? settings.balances[assetId].usdAmount
			: 0,
		    amount: settings.balances[assetId]
			? settings.balances[assetId].amount
			: 0,
		    volume24h: settings.pulse[assetId].pulse.volume_24h,
		    id: assetId
		});
	    }

	    sortedAssets.sort(function(a, b) {
		return b.usdAmount - a.usdAmount || b.volume24h - a.volume24h;
	    });

	    for (var asset of sortedAssets) {
		var amount = numbers.shortenNumber(asset.amount);
		var usdAmount = numbers.shortenNumber(asset.usdAmount);

		var data = {
		    name: settings.assets[asset.id].name,
	    	    symbol: settings.assets[asset.id].symbol,
	    	    amount: amount,
	    	    'usd-amount': usdAmount || 'V: ' + numbers.formatNumber(asset.volume24h)
		};

		var div = $('#modalExchangeCoins [data-buy-coin-template] > li').clone();

		for (var k in data) {
		    div.find('[data-' + k + ']').text(data[k]);
		}

		arg.buy.assetId = asset.id;
		div.attr('data-modal-arg', JSON.stringify(arg));
		div.addClass('c-' + asset.id);
	    
		div.appendTo('#modalExchangeCoins [data-buy-coins-list]');
	    }

	    app.setHandlers();
	    
	    $('#modalExchangeCoins [data-coin-search]').val('');
	    $('#modalExchangeCoins [data-coin-search]').trigger('keyup');
	},
	
	selectBuyWallet: async function(arg) {
	    console.log('selectBuyWallet');

	    arg = JSON.parse(arg);

	    var sortedWalletsBalances = [];
	    for (var id in settings.assets[arg.buy.assetId].wallets) {
		var btsId = settings.assets[arg.buy.assetId].wallets[id].btsId;

		sortedWalletsBalances.push({
		    amount: settings.balances[arg.buy.assetId] && settings.balances[arg.buy.assetId].wallets[btsId]
			? settings.balances[arg.buy.assetId].wallets[btsId].amount
			: 0,
		    id: id
		});
	    }

	    if (sortedWalletsBalances.length == 1) {
		arg.buy.walletId = sortedWalletsBalances[0].id;

		await app.changeView('multi-view-modal-show', {
		    modalName: 'modalExchangeCoins',
		    viewName: 'exchange'
		}, JSON.stringify(arg));
		
		return false;
	    }

	    sortedWalletsBalances.sort(function(a, b) {
		return b.amount - a.amount;
    	    });

	    $('#modalExchangeCoins [data-buy-wallets]').empty();
	    $('#modalExchangeCoins [data-symbol]').text(settings.assets[arg.buy.assetId].symbol);
	
	    for (var wallet of sortedWalletsBalances) {
		var div = $('#modalExchangeCoins [data-buy-wallet-template] > li').clone();
		var usdAmount = numbers.shortenNumber(wallet.amount * settings.pulse[arg.buy.assetId].pulse.price);
		wallet.amount = numbers.shortenNumber(wallet.amount);

		arg.buy.walletId = wallet.id;
		div.attr('data-modal-arg', JSON.stringify(arg));
		div.find('[data-name]').text(settings.exchanges[wallet.id].name);
		div.find('[data-amount]').text(wallet.amount);
		div.find('[data-usd-amount]').text(usdAmount);
	    
		div.appendTo('#modalExchangeCoins [data-buy-wallets]');
	    }

	    app.setHandlers();
	},

	exchange: async function(arg) {
	    console.log('exchange');
	    console.log(arg);

	    arg = JSON.parse(arg);

	    var buyAsset = settings.assets[arg.buy.assetId];
	    var buyBtsId = buyAsset.wallets[arg.buy.walletId].btsId;

	    var sellAsset = settings.assets[arg.sell.assetId];
	    var sellBtsId = sellAsset.wallets[arg.sell.walletId].btsId;

	    var fees = await Apis.instance().db_api().exec('get_objects', [['2.0.0']]);
	    var cer = await Apis.instance().db_api().exec('lookup_asset_symbols', [[sellBtsId]]);
	    var userAcc = await Apis.instance().db_api().exec('get_full_accounts', [[settings.user.id], true]);

	    var data = {
		'buy-name': buyAsset.name,
		'buy-symbol': buyAsset.symbol,
		'buy-wallet-name': settings.exchanges[arg.buy.walletId].name,
		'sell-name': sellAsset.name,
		'sell-symbol': sellAsset.symbol,
		'sell-wallet-name': settings.exchanges[arg.sell.walletId].name,
	    }


	    $('#modalExchangeCoins [data-sell-id]')
		.removeClass()
		.addClass('c-' + arg.sell.assetId);

	    $('#modalExchangeCoins [data-buy-id]')
		.removeClass()
		.addClass('c-' + arg.buy.assetId);

	    if (settings.balances[arg.buy.assetId] && settings.balances[arg.buy.assetId].wallets[buyBtsId]) {
		data['buy-wallet-balance'] = settings.balances[arg.buy.assetId].wallets[buyBtsId].amount;
	    } else {
		data['buy-wallet-balance'] = 0;
	    }

	    if (settings.balances[arg.sell.assetId] && settings.balances[arg.sell.assetId].wallets[sellBtsId]) {
		data['sell-wallet-balance'] = settings.balances[arg.sell.assetId].wallets[sellBtsId].amount;
		data['sell-wallet-usd-balance'] = numbers.floatify(data['sell-wallet-balance'] * settings.pulse[arg.buy.assetId].pulse.price, 2);
	    } else {
		data['sell-wallet-balance'] = 0;
		data['sell-wallet-usd-balance'] = 0;
	    }

	    data['service-fee'] = fees[0].parameters.current_fees.parameters[1][1].fee / 10 ** cer[0].precision;
	    data['service-fee-symbol'] = 'BTS';
	    data['usd-service-fee'] = numbers.floatify(data['service-fee'] * settings.pulse[9].pulse.price, 5);

	    for (var k in data) {
		$('#modalExchangeCoins [data-' + k + ']').text(data[k]);
	    }

	    $('#modalExchangeCoins [data-view="fail"] [data-back-button]').attr('data-modal-arg', JSON.stringify(arg));
	    $('#modalExchangeCoins [data-view="exchange"] [data-modal-arg]').attr('data-modal-arg', JSON.stringify(arg));
	    $('#modalExchangeCoins [data-view="confirm"] [data-modal-arg]').attr('data-modal-arg', JSON.stringify(arg));

	    $('#modalExchangeCoins [data-sell-coin-button], #modalExchangeCoins [data-sell-id]')
		.removeClass()
		.addClass('c-' + arg.sell.assetId)
		.attr('data-modal-arg', JSON.stringify(arg));

	    $('#modalExchangeCoins [data-buy-coin-button], #modalExchangeCoins [data-buy-id]')
		.removeClass()
		.addClass('c-' + arg.buy.assetId)
		.attr('data-modal-arg', JSON.stringify({
		    sell: arg.sell
		}));

	    var buyAmountInput = $('#modalExchangeCoins [data-buy-amount-input]');
	    var sellAmountInput = $('#modalExchangeCoins [data-sell-amount-input]');


	    if (data['sell-wallet-balance'] == 0) {
		await app.changeView('multi-view-modal-show', {
		    modalName: 'modalExchangeCoins',
		    viewName: 'insufficient'
		});

		return false;
	    }

	    // bts
	    if (arg.sell.assetId == 9 || arg.buy.assetId == 9) {
		var ticker = await Apis.instance().db_api().exec('get_limit_orders', [buyBtsId, sellBtsId, 100]);
		console.log(ticker);

		    var i = 0;
		    var endPos = 0;
		    while (i < ticker.length) {
			if (ticker[i].sell_price.base.asset_id == sellBtsId) {
			    endPos = i-1;
			    break;
			}
			i++;
		    }
		    console.log('endPos: ', endPos);
	    } else {
		try {
		    var ticker = await Apis.instance().db_api().exec('get_limit_orders', ['1.3.0', sellBtsId, 100]);
		    console.log(ticker);
		    var ticker2 = await Apis.instance().db_api().exec('get_limit_orders', [buyBtsId, '1.3.0', 100]);
		    console.log(ticker2);

		    var i = 0;
		    var endPos = 0;
		    while (i < ticker.length) {
			if (ticker[i].sell_price.base.asset_id == sellBtsId) {
			    endPos = i-1;
			    break;
			}
			i++;
		    }
		    console.log('endPos: ', endPos);


		    var i = 0;
		    var endPos2 = 0;
		    while (i < ticker2.length) {
			if (ticker2[i].sell_price.base.asset_id == '1.3.0') {
			    endPos2 = i-1;
			    break;
			}
			i++;
		    }

		    console.log('endPos2: ', endPos2);
		} catch(e) {console.log(e);}
	    }

	    var pricePos = 0;

	    var sellAmount = 0;
	    var sellPrice = 0;

	    var buyAmount = 0;
	    var buyPrice = 0;

	    var sellAmount2 = 0;
	    var sellPrice2 = 0;

	    var buyAmount2 = 0;
	    var buyPrice2 = 0;

	    function getAmounts(sell, ticker) {
		var sellAmount = Math.trunc(parseFloat(sell.amount) * 10 ** sell.asset.precision);
		var sum = 0;

		for (var pricePos = 0; pricePos <= endPos; pricePos++) {
		    sum += ticker[pricePos].for_sale / ticker[pricePos].sell_price.base.amount * ticker[pricePos].sell_price.quote.amount;

		    if (sum >= sellAmount) {
			break;
		    }
		}

		pricePos = pricePos > 0 ? (pricePos >= ticker.length ? ticker.length - 1 : pricePos-1) : 0;

		var sellPrice = ticker[pricePos].sell_price.quote.amount / ticker[pricePos].sell_price.base.amount;
		var buyPrice = ticker[pricePos].sell_price.base.amount / ticker[pricePos].sell_price.quote.amount;

		buyAmount = Math.trunc(sellAmount * buyPrice);

		return {
		    sell: {
			amount: sellAmount,
			price: sellPrice
		    },
		    buy: {
			amount: buyAmount,
			price: buyPrice
		    }
		}
	    }

	    sellAmountInput.unbind('input.wex').bind('input.wex', function(e) {
		var p = sellAsset.wallets[arg.sell.walletId].btsPrecision;
        	var t = new RegExp("^((\\s*|[1-9][0-9]*\\.?[0-9]{0," +
            	    p + "})|(0|(0\\.)[0-9]{0," + p + "}))$").test(e.target.value);

		var s = e.target.value.split('.');

		var m = parseFloat($('#modalExchangeCoins [data-max-amount]').text());

		if (!t || parseFloat(e.target.value) > m ||
		    s.length > 1 && s[1].length > sellAsset.wallets[arg.sell.walletId].btsPrecision) {
		    sellAmountInput.val(v);
		}
	    });

	    var v;
	    sellAmountInput.unbind('keypress.wex').bind('keypress.wex', function(e) {
		if (!/^[0-9\.]$/.test(e.key)) {
		    return false;
		}

		if (e.key == '.' && e.target.value == '') {
		    e.target.value = '0';
		}
		
		v = e.target.value;
		var m = v.match(/\./g);
		var p = m ? m.length : 0;
		
		if (e.key == '.' && p > 1) {
		    return false;
		}
	    });

	    sellAmountInput.unbind('keyup.wex').bind('keyup.wex', function() {
		if ($(this).val().length) {
		    var amounts = getAmounts({
			amount: sellAmountInput.val(),
			asset: {
			    id: arg.sell.assetId,
			    precision: sellAsset.wallets[arg.sell.walletId].btsPrecision
			}
		    }, ticker);

		    sellAmount = amounts.sell.amount;
		    sellPrice = amounts.sell.price;

		    buyAmount = amounts.buy.amount;
		    buyPrice = amounts.buy.price;

		    if (arg.sell.assetId != 9 && arg.buy.assetId != 9) {
			var amounts2 = getAmounts({
			    amount: amounts.buy.amount / 10 ** settings.assets[9].wallets[1].btsPrecision,
			    asset: {
				id: 9,
				precision: settings.assets[9].wallets[1].btsPrecision
			    }
			}, ticker2);

			sellAmount2 = amounts2.sell.amount;
			sellPrice2 = amounts2.sell.price;

			buyAmount2 = amounts2.buy.amount;
			buyPrice2 = amounts2.buy.price;
		    }

		    buyAmountInput.val(
			numbers.floatify(buyAmount / 10 ** buyAsset.wallets[arg.buy.walletId].btsPrecision,
			    buyAsset.wallets[arg.buy.walletId].btsPrecision)
		    );
		} else {
		    buyAmountInput.val('');
		}

		$('#modalExchangeCoins [data-sell-amount]').text(
		    sellAmountInput.val()
		);

		$('#modalExchangeCoins [data-usd-sell-amount]').text(
		    numbers.floatify($(this).val() * settings.pulse[arg.sell.assetId].pulse.price, 2)
		);


		$('#modalExchangeCoins [data-buy-amount]').text(
		    buyAmountInput.val()
		);

		$('#modalExchangeCoins [data-usd-buy-amount]').text(
		    numbers.floatify(buyAmountInput.val() * settings.pulse[arg.buy.assetId].pulse.price, 2)
		);
	    });

try{
	    if (arg.sell.assetId == 9 || arg.buy.assetId == 9) {
		var lRate = ((settings.pulse[arg.sell.assetId].pulse.price / settings.pulse[arg.buy.assetId].pulse.price) * 
    		    (10 ** buyAsset.wallets[arg.buy.walletId].btsPrecision / 10 ** sellAsset.wallets[arg.sell.walletId].btsPrecision) * 0.9);

		//console.log('lRate: '+ lRate);

    		var maxRate = ((settings.pulse[arg.sell.assetId].pulse.price / settings.pulse[arg.buy.assetId].pulse.price) * 
    		    (10 ** buyAsset.wallets[arg.buy.walletId].btsPrecision / 10 ** sellAsset.wallets[arg.sell.walletId].btsPrecision) * 0.5);

		//console.log('maxRate: '+ maxRate);

		var lSum = 0;
		for (var pricePos = 0; pricePos <= endPos; pricePos++) {
		    var t = ticker[pricePos].sell_price.base.amount / ticker[pricePos].sell_price.quote.amount;
		    if (t < lRate) {	
			//console.log('lPos: ',pricePos > 0 ? pricePos - 1 : 0);
			break;
		    }

		    lSum += ticker[pricePos].for_sale / ticker[pricePos].sell_price.base.amount * ticker[pricePos].sell_price.quote.amount;
		}
		//console.log('lSum: ' + lSum);

		var mSum = 0;
		for (var pricePos = 0; pricePos <= endPos; pricePos++) {
		    var t = ticker[pricePos].sell_price.base.amount / ticker[pricePos].sell_price.quote.amount;
		    if (t < maxRate) {	
			//console.log('maxPos: ',pricePos > 0 ? pricePos - 1 : 0);
			break;
		    }

		    mSum += ticker[pricePos].for_sale / ticker[pricePos].sell_price.base.amount * ticker[pricePos].sell_price.quote.amount;
		}
		//console.log('mSum: ' + mSum);

		//console.log('maxPos: ',pricePos-1);

		var liquidAmount = numbers.toFixedTrunc(lSum / 10 ** sellAsset.wallets[arg.sell.walletId].btsPrecision, 2);
		var maxAmount = numbers.toFixedTrunc(mSum / 10 ** sellAsset.wallets[arg.sell.walletId].btsPrecision, 2);
	    } else {
		var lRate = ((settings.pulse[arg.sell.assetId].pulse.price / settings.pulse[9].pulse.price) * 
    		    (10 ** 5 / 10 ** sellAsset.wallets[arg.sell.walletId].btsPrecision) * 0.9);

		//console.log('lRate: '+ lRate);

		var lRate2 = ((settings.pulse[9].pulse.price / settings.pulse[arg.buy.assetId].pulse.price) * 
    		    (10 ** buyAsset.wallets[arg.buy.walletId].btsPrecision / 10 ** 5) * 0.9);

		//console.log('lRate2: '+ lRate2);

		var maxRate = ((settings.pulse[arg.sell.assetId].pulse.price / settings.pulse[9].pulse.price) * 
		    (10 ** 5 / 10 ** sellAsset.wallets[arg.sell.walletId].btsPrecision) * 0.5);

		//console.log('maxRate: '+ maxRate);

		var maxRate2 = ((settings.pulse[9].pulse.price / settings.pulse[arg.buy.assetId].pulse.price) * 
    		    (10 ** buyAsset.wallets[arg.buy.walletId].btsPrecision / 10 ** 5) * 0.5);

		//console.log('maxRate2: '+ maxRate2);

		var lSum1 = 0;
		var lPos = 0;
		for (var pricePos = 0; pricePos <= endPos; pricePos++) {
		    var t = ticker[pricePos].sell_price.base.amount / ticker[pricePos].sell_price.quote.amount;
		    if (t < lRate) {	
			//console.log('lPos: ',pricePos > 0 ? pricePos - 1 : 0);
			lPos = pricePos > 0 ? pricePos - 1 : 0;
			break;
		    }

		    lSum1 += ticker[pricePos].for_sale / ticker[pricePos].sell_price.base.amount * ticker[pricePos].sell_price.quote.amount;
		}
		//console.log('lSum1: ' + lSum1);

		var lSum2 = 0;
		var lPos2 = 0;
		for (var pricePos = 0; pricePos <= endPos2; pricePos++) {
		    var t = ticker2[pricePos].sell_price.base.amount / ticker2[pricePos].sell_price.quote.amount;
		    if (t < lRate2) {	
			//console.log('lPos2: ',pricePos > 0 ? pricePos - 1 : 0);
			lPos2 = pricePos > 0 ? pricePos - 1 : 0;
			break;
		    }

		    lSum2 += ticker2[pricePos].for_sale / ticker2[pricePos].sell_price.base.amount * ticker2[pricePos].sell_price.quote.amount;
		}
		//console.log('lSum2: ' + lSum2);


		var mSum1 = 0;
		var mPos = 0;
		for (var pricePos = 0; pricePos <= endPos; pricePos++) {
		    var t = ticker[pricePos].sell_price.base.amount / ticker[pricePos].sell_price.quote.amount;
		    if (t < maxRate) {	
			mPos = pricePos > 0 ? pricePos + 1 == ticker.length ? pricePos : pricePos + 1 : 0;
			break;
		    }

		    mSum1 += ticker[pricePos].for_sale / ticker[pricePos].sell_price.base.amount * ticker[pricePos].sell_price.quote.amount;
		}
		//console.log('mSum1: ' + mSum1);
		var pricePosMSum1 = pricePos - 1;
		//console.log('pricePosMSum1: ' + pricePosMSum1);

		//console.log('maxPos: ',pricePos - 1);

		var mSum2 = 0;
		var mPos2 = 0;
		for (var pricePos = 0; pricePos <= endPos2; pricePos++) {
		    var t = ticker2[pricePos].sell_price.base.amount / ticker2[pricePos].sell_price.quote.amount;
		    if (t < maxRate2) {	
			mPos2 = pricePos > 0 ? pricePos + 1 == ticker.length ? pricePos : pricePos + 1 : 0;
			break;
		    }

		    mSum2 += ticker2[pricePos].for_sale / ticker2[pricePos].sell_price.base.amount * ticker2[pricePos].sell_price.quote.amount;
		}
		//console.log('mSum2: ' + mSum2);

		//console.log('maxPos2: ',pricePos - 1);

		var lSum = lSum2 / (ticker[lPos].sell_price.base.amount / ticker[lPos].sell_price.quote.amount)
		var liquidAmount = numbers.toFixedTrunc((lSum > lSum1 ? lSum1 : lSum) / 10 ** sellAsset.wallets[arg.sell.walletId].btsPrecision, 2);

		var mSum = mSum2 / (ticker[mPos].sell_price.base.amount / ticker[mPos].sell_price.quote.amount)
		var maxAmount = numbers.toFixedTrunc((mSum > mSum1 ? mSum1 : mSum) / 10 ** sellAsset.wallets[arg.sell.walletId].btsPrecision, 2);
	    }
}catch(e){console.log(e)}

	    
	    $('#modalExchangeCoins [data-min-amount]').text(
		numbers.floatify(0.01 / settings.pulse[arg.sell.assetId].pulse.price, sellAsset.wallets[arg.sell.walletId].btsPrecision)
	    );

	    $('#modalExchangeCoins [data-liquid-amount]').text(
		liquidAmount
	    );

	    $('#modalExchangeCoins [data-max-amount]').text(
		maxAmount
	    );

	    $('#modalExchangeCoins [data-liquidity-box]').removeClass('active');
	    $('#modalExchangeCoins [data-liquidity-warn]').removeClass('active');
	    $('#modalExchangeCoins [data-max-box]').removeClass('active');

	    if (liquidAmount > 0) {
		if (data['sell-wallet-balance'] <= liquidAmount) {
		    $('#modalExchangeCoins [data-max-box]').addClass('active');
		    $('#modalExchangeCoins [data-max-amount]').text(data['sell-wallet-balance']);
		} else if (data['sell-wallet-balance'] > liquidAmount && data['sell-wallet-balance'] < maxAmount) {
		    $('#modalExchangeCoins [data-liquidity-box]').addClass('active');
		    $('#modalExchangeCoins [data-max-amount]').text(data['sell-wallet-balance']);
		} else {
		    $('#modalExchangeCoins [data-liquidity-box]').addClass('active');
		}
	    } else {
		$('#modalExchangeCoins [data-liquidity-warn]').addClass('active');
		$('#modalExchangeCoins [data-max-amount]').text(data['sell-wallet-balance']);
	    }

	    if (maxAmount == 0) {
		await app.changeView('multi-view-modal-show', {
		    modalName: 'modalExchangeCoins',
		    viewName: 'illiquid'
		}, JSON.stringify(arg));
		
		return false;
	    }

	    sellAmountInput.val('');
	    sellAmountInput.trigger('keyup');

	    buyAmountInput.val('');
	    buyAmountInput.trigger('keyup');

	    $('#modalExchangeCoins [data-view="exchange"] [data-min-amount]').unbind('click.wex').bind('click.wex', function() {
		sellAmountInput.val(
		    $('#modalExchangeCoins [data-view="exchange"] [data-min-amount]').text()
		);
		
		sellAmountInput.trigger('keyup');
	    });

	    $('#modalExchangeCoins [data-view="exchange"] [data-liquid-amount]').unbind('click.wex').bind('click.wex', function() {
		sellAmountInput.val(
		    $('#modalExchangeCoins [data-view="exchange"] [data-liquid-amount]').text()
		);
		
		sellAmountInput.trigger('keyup');
	    });

	    $('#modalExchangeCoins [data-view="exchange"] [data-max-amount]').unbind('click.wex').bind('click.wex', function() {
		sellAmountInput.val(
		    $('#modalExchangeCoins [data-view="exchange"] [data-max-amount]').text()
		);
		
		sellAmountInput.trigger('keyup');
	    });

	    this.prepareTransaction = async (trx, key) => {
try {
		if (arg.buy.assetId == 9 || arg.sell.assetId == 9) {
		    var op = {
			fee: {
			    amount: fees[0].parameters.current_fees.parameters[1][1].fee,
			    asset_id: '1.3.0'
			},
			seller: userAcc[0][1].account.id,
			amount_to_sell: {
			    amount: sellAmount,
			    asset_id: sellBtsId
			},
			min_to_receive: {
			    amount: buyAmount - 1,
			    asset_id: buyBtsId
			},
			expiration: '2099-09-18T23:00:00',
			fill_or_kill: true
		    };

		    console.log(op);
		    trx.add_type_operation('limit_order_create', op);
		} else {
		    var op = {
			fee: {
			    amount: fees[0].parameters.current_fees.parameters[1][1].fee,
			    asset_id: '1.3.0'
			},
			seller: userAcc[0][1].account.id,
			amount_to_sell: {
			    amount: sellAmount,
			    asset_id: sellBtsId
			},
			min_to_receive: {
			    amount: sellAmount2 - 1,
			    asset_id: '1.3.0'
			},
			expiration: '2099-09-18T23:00:00',
			fill_or_kill: true
		    };

		    var op1 = {
			fee: {
			    amount: fees[0].parameters.current_fees.parameters[1][1].fee,
			    asset_id: '1.3.0'
			},
			seller: userAcc[0][1].account.id,
			amount_to_sell: {
			    amount: sellAmount2 - 1,
			    asset_id: '1.3.0'
			},
			min_to_receive: {
			    amount: buyAmount2 - 1,
			    asset_id: buyBtsId
			},
			expiration: '2099-09-18T23:00:00',
			fill_or_kill: true
		    };

		    console.log(op);
		    console.log(op1);

		    trx.add_type_operation('limit_order_create', op);
		    trx.add_type_operation('limit_order_create', op1);
		}

		trx.add_signer(key);

		return trx;
} catch(e) {console.log(e);}
	    }
	},

	confirm: async function(arg) {
	    console.log(arg);

	    arg = JSON.parse(arg);

	    $('#modalExchangeCoins [data-password-error]').removeClass('active');
	    $('#modalExchangeCoins [data-password-input]').val('');

	    $('#modalExchangeCoins [data-user]').text(settings.user.name);

	    var prepareTransaction = this.prepareTransaction;

	    $('#modalExchangeCoins [data-exchange-button]').unbind('click.wex').bind('click.wex', async function() {
		var r = await Apis.instance().db_api().exec('get_account_by_name', [settings.user.name]);

		if (!r) {
		    $('#modalExchangeCoins [data-password-error]').addClass('active');
		    return;
		}

		var key = app.generateKeyFromPassword(settings.user.name, 'active', $('#modalExchangeCoins [data-password-input]').val());

		if (key.pubKey != r.active.key_auths[0][0]) {
		    $('#modalExchangeCoins [data-password-error]').addClass('active');
		    return;
		}

		$('#modalExchangeCoins [data-password-input]').val('');

		try {
		    $('#modalExchangeCoins .preloader').addClass('active');

		    var trx = await prepareTransaction(new TransactionBuilder(), key.privKey);
		    console.log(trx);

		    var r = await trx.broadcast();
		    console.log(r);

		    await app.updateBalances();
		    app.renderBalances();
	    
		    await app.updateHistory();
		    app.renderHistory();
	    
		    await app.modalHandler({modalName: 'modalCoin'}, arg.assetId);
	    
		    app.setHandlers();

		    await app.changeView('multi-view-modal-show', {
			modalName: 'modalExchangeCoins',
			viewName: 'success'
		    });
		
		    return false;
		} catch (e) {
		    console.log(e);

		    await app.changeView('multi-view-modal-show', {
			modalName: 'modalExchangeCoins',
			viewName: 'fail'
		    });
		
		    return false;
		}
	    });
	},

	beet: async function(arg) {
	    var prepareTransaction = this.prepareTransaction;

	    $('#modalExchangeCoins [data-beet-send-button]').unbind('click.wex').bind('click.wex', async function() {

		try {
		    if (!beetApp) {
			beetApp = await beet.get('Walle7', 'BTS');
			TransactionBuilder = beetApp.BTS.inject(TransactionBuilder);
		    }

		    var trx = await prepareTransaction(new TransactionBuilder(), 'inject_wif');
		    console.log(trx);

		} catch (e) {
		    console.log(e);
		    return false;
		}

		try {
		    $('#modalExchangeCoins .preloader').addClass('active');

		    //await app.wait(3000);
		    var r = await trx.broadcast();
		    console.log(r);

		    await app.updateBalances();
		    app.renderBalances();

		    await app.updateHistory();
		    app.renderHistory();

		    await app.modalHandler({modalName: 'modalCoin'}, arg.assetId);

		    app.setHandlers();

		    await app.changeView('multi-view-modal-show', {
			modalName: 'modalExchangeCoins',
			viewName: 'success'
		    });
		
		    return false;
		} catch (e) {
		    console.log(e);

		    await app.changeView('multi-view-modal-show', {
			modalName: 'modalExchangeCoins',
			viewName: 'fail'
		    });
		
		    return false;
		}
	    });
	}
}