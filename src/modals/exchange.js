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


	    $('#modalExchangeCoins [data-sell-coin-button], #modalExchangeCoins [data-sell-id]')
		.removeClass()
		.addClass('c-' + arg.sell.assetId)
		.attr('data-modal-arg', JSON.stringify(arg));

	    $('#modalExchangeCoins [data-buy-coin-button], #modalExchangeCoins [data-buy-id')
		.removeClass()
		.addClass('c-' + arg.buy.assetId)
		.attr('data-modal-arg', JSON.stringify({
		    sell: arg.sell
		}));

	    $('#modalExchangeCoins [data-sell-id]')
		.removeClass()
		.addClass('c-' + arg.sell.assetId);

	    $('#modalExchangeCoins [data-buy-id')
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

	    var buyAmountInput = $('#modalExchangeCoins [data-buy-amount-input]');
	    /*buyAmount.unbind('keyup.wex').bind('keyup.wex', function() {
		$('#modalExchangeCoin [data-usd-buy-amount]').text(
		    numbers.floatify($(this).val() * settings.pulse[arg.buy.assetId].pulse.price, 2));
	    });*/

	    var sellAmountInput = $('#modalExchangeCoins [data-sell-amount-input]');


	    var fee = cer[0].options.core_exchange_rate.quote.amount /
		cer[0].options.core_exchange_rate.base.amount;
	    fee = (fees[0].parameters.current_fees.parameters[1][1].fee
	        //+   fees[0].parameters.current_fees.parameters[0][1].price_per_kbyte * 0.2
	        ) * fee / 10 ** cer[0].precision;
	    fee = fee.toFixed(cer[0].precision);
	    console.log('fee: ' + fee);

	    if (data['sell-wallet-balance'] <= fee) {
		await app.changeView('multi-view-modal-show', {
		    modalName: 'modalExchangeCoins',
		    viewName: 'insufficient'
		});

		return false;
	    }

	    if (arg.sell.assetId == 9 || arg.buy.assetId == 9) {
		var ticker = await Apis.instance().db_api().exec('get_limit_orders', [sellBtsId, buyBtsId, 100]);
	    } else {
		try {
		    var ticker = await Apis.instance().db_api().exec('get_limit_orders', [sellBtsId, '1.3.0', 100]);
		    //console.log(ticker);
		    var ticker2 = await Apis.instance().db_api().exec('get_limit_orders', ['1.3.0', buyBtsId, 100]);
		    //console.log(ticker2);

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
		var sellAmount = (parseFloat(sell.amount) * 10 ** sell.asset.precision).toFixed();
		var sum = 0;

		for (var pricePos = 0; pricePos < ticker.length; pricePos++) {
		    sum += ticker[pricePos].for_sale;

		    if (sum >= sellAmount) {
			break;
		    }
		}

		var sellPrice = ticker[pricePos].sell_price.quote.amount / ticker[pricePos].sell_price.base.amount;
		var buyPrice = ticker[pricePos].sell_price.base.amount / ticker[pricePos].sell_price.quote.amount;

		if (sell.asset.id == 9) {
		    buyAmount = (sellAmount - 1 - fees[0].parameters.current_fees.parameters[1][1].fee) * sellPrice;
		} else {
		    buyAmount = sellAmount * sellPrice - 1 - fees[0].parameters.current_fees.parameters[1][1].fee;
		}

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

	    /*buyAmountInput.unbind('keyup.wex').bind('keyup.wex', function() {
		$('#modalExchangeCoins [data-usd-buy-amount]').text(
		    numbers.floatify($(this).val() * settings.pulse[arg.buy.assetId].pulse.price, 2)
		);

		if ($(this).val().length) {
		    var sellPrice = ticker[0].sell_price.base.amount / ticker[0].sell_price.quote.amount;
		    var buyPrice = ticker2[0].sell_price.base.amount / ticker2[0].sell_price.quote.amount;
		    var buyAmount = parseFloat(buyAmountInput.val()) * 10 ** buyAsset.wallets[arg.buy.walletId].btsPrecision * buyPrice;

		    sellAmountInput.val(
			numbers.floatify(((buyAmount - 1 - 578) / buyPrice - 1) / 10 ** sellAsset.wallets[arg.buy.walletId].btsPrecision, 6)
		    );
		} else {
		    sellAmountInput.val('');
		}
	    
		$('#modalExchangeCoins [data-usd-sell-amount]').text(
		    numbers.floatify(sellAmountInput.val() * settings.pulse[arg.sell.assetId].pulse.price, 2)
		);
	    });*/

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

	    $('#modalExchangeCoins [data-view="exchange"] [data-max-amount]').unbind('click.wex').bind('click.wex', function() {
		sellAmountInput.val(
		    $('#modalExchangeCoins [data-view="exchange"] [data-max-amount]').text()
		);
		
		sellAmountInput.trigger('keyup');
	    });

	    this.prepareTransaction = async (trx, key) => {
try {
		if (arg.buy.assetId == 9) {
		    var op = {
			fee: {
			    amount: fee * 10 ** cer[0].precision + 1,
			    asset_id: sellBtsId
			},
			seller: userAcc[0][1].account.id,
			amount_to_sell: {
			    amount: sellAmount,
			    asset_id: sellBtsId
			},
			min_to_receive: {
			    amount: (buyAmount * buyPrice).toFixed() - 1,
			    asset_id: '1.3.0'
			},
			expiration: '2099-09-18T23:00:00',
			fill_or_kill: true
		    };

		    console.log(op);
		    trx.add_type_operation('limit_order_create', op);
		} else if (arg.sell.assetId == 9) {
		    var op = {
			fee: {
			    amount: fees[0].parameters.current_fees.parameters[1][1].fee,
			    asset_id: '1.3.0'
			},
			seller: userAcc[0][1].account.id,
			amount_to_sell: {
			    amount: sellAmount,
			    asset_id: '1.3.0'
			},
			min_to_receive: {
			    amount: (buyAmount * sellPrice).toFixed() - 1,
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
			    amount: fee * 10 ** cer[0].precision + 1,
			    asset_id: sellBtsId
			},
			seller: userAcc[0][1].account.id,
			amount_to_sell: {
			    amount: sellAmount,
			    asset_id: sellBtsId
			},
			min_to_receive: {
			    amount: (buyAmount * buyPrice).toFixed() - 1,
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
			    amount: sellAmount2,
			    asset_id: '1.3.0'
			},
			min_to_receive: {
			    amount: (buyAmount2 * sellPrice2).toFixed() - 1,
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