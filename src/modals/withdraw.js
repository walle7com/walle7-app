var numbers = require('../utils/numbers');
var settings = require('../utils/settings');
var bitshares = require('../utils/bitshares');
var app = require('../app');

var kjua = require('kjua');
var {Apis} = require('bitsharesjs-ws');
var {TransactionBuilder, TransactionHelper, Aes} = require('bitsharesjs');
require('@beetapp/beet-js');

var beetApp;


module.exports = {
	main: async function(arg) {
	    console.log('main');

	    if (Object.keys(settings.balances).length == 0) {
		await app.changeView('multi-view-modal-show', {
		    modalName: 'modalWithdrawCoins',
		    viewName: 'firstdeposit'
		});
		
		return false;
	    }

	    $('#modalWithdrawCoins [data-coin-search]').unbind('keyup.mwallets').bind('keyup.mwallets', function() {
		var value = $(this).val().toLowerCase();

		$('#modalWithdrawCoins [data-coins-list] li').filter(function() {
		    $(this).toggle(
			$(this).find('[data-symbol]').text().toLowerCase().indexOf(value) > -1 ||
			$(this).find('[data-name]').text().toLowerCase().indexOf(value) > -1
		    );
		});
	    
		$('#modalWithdrawCoins [data-coin-search-empty]').toggle(
		    !$('#modalWithdrawCoins [data-coins-list] li:visible').length
		);
		//$('#coin-search-unsupported').toggle(!value.length);
		$('#modalWithdrawCoins .areaClear').toggleClass('active', value.length > 0);
	    });

	    $('#modalWithdrawCoins .areaClear').unbind('click.mwallets').bind('click.mwallets', function() {
		$('#modalWithdrawCoins [data-coin-search]').val('');
		$('#modalWithdrawCoins [data-coin-search]').trigger('keyup');
	    });

	    $('#modalWithdrawCoins [data-coins-list]').empty();

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
		//console.log(b.usdAmount - a.usdAmount);
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

		var div = $('#modalWithdrawCoins [data-coin-template] > li').clone();

		for (var k in data) {
		    div.find('[data-' + k + ']').text(data[k]);
		}

		div.attr('data-modal-arg', asset.id);
		div.addClass('c-' + asset.id);
	    
		div.appendTo('#modalWithdrawCoins [data-coins-list]');
	    }

	    app.setHandlers();

	    $('#modalWithdrawCoins [data-coin-search]').val('');
	    $('#modalWithdrawCoins [data-coin-search]').trigger('keyup');
	},
	
	selectWallet: async function(arg) {
	    console.log('selectWallet');
	    
	    var sortedWalletsBalances = [];
	    for (var id in settings.assets[arg].wallets) {
		var btsId = settings.assets[arg].wallets[id].btsId;

		sortedWalletsBalances.push({
		    amount: settings.balances[arg] && settings.balances[arg].wallets[btsId]
			? settings.balances[arg].wallets[btsId].amount
			: 0,
		    id: id
		});
	    }

	    if (sortedWalletsBalances.length == 1) {
		await app.changeView('multi-view-modal-show', {
		    modalName: 'modalWithdrawCoins',
		    viewName: 'withdraw'
		}, JSON.stringify({
		    assetId: arg,
		    walletId: sortedWalletsBalances[0].id
		}));
		
		return false;
	    }

	    sortedWalletsBalances.sort(function(a, b) {
		return b.amount - a.amount;
    	    });

	    $('#modalWithdrawCoins [data-wallets]').empty();
	    $('#modalWithdrawCoins [data-symbol]').text(settings.assets[arg].symbol);
	
	    for (var wallet of sortedWalletsBalances) {
		if (wallet.amount == 0) {
		    continue;
		}
		
		var div = $('#modalWithdrawCoins [data-wallet-template] > li').clone();
		var usdAmount = numbers.shortenNumber(wallet.amount * settings.pulse[arg].pulse.price);
		wallet.amount = numbers.shortenNumber(wallet.amount);

		div.attr('data-modal-arg', JSON.stringify({
		    assetId: arg,
		    walletId: wallet.id
		}));
		div.find('[data-name]').text(settings.exchanges[wallet.id].name);
		div.find('[data-amount]').text(wallet.amount);
		div.find('[data-usd-amount]').text(usdAmount);
	    
		div.appendTo('#modalWithdrawCoins [data-wallets]');
	    }

	    app.setHandlers();
	},

	maintenance: async function(arg) {
	    arg = JSON.parse(arg);
	    
	    var asset = settings.assets[arg.assetId];	    

	    $('#modalWithdrawCoins [data-asset-symbol]').text(asset.symbol);
	    $('#modalWithdrawCoins [data-gateway-news]').attr('href', settings.exchanges[arg.walletId].news);
	    $('#modalWithdrawCoins [data-gateway]').text(settings.exchanges[arg.walletId].name);
	    $('#modalWithdrawCoins [data-gateway]').attr('href', settings.exchanges[arg.walletId].website);
	    $('#modalWithdrawCoins [data-gateway-support]').attr('href', settings.exchanges[arg.walletId].support);
	},

	withdraw: async function(arg) {
try{
	    arg = JSON.parse(arg);
	    console.log(arg);

	    var asset = settings.assets[arg.assetId];
	    var btsId = settings.assets[arg.assetId].wallets[arg.walletId].btsId;

	    var data = {
		'name': asset.name,
		'symbol': asset.symbol,
		'fee-symbol': asset.symbol
	    }

	    $('#modalWithdrawCoins [data-id]')
		.removeClass()
		.addClass('c-' + arg.assetId);

	    $('#modalWithdrawCoins [data-valid-address]').removeClass('active');
	    $('#modalWithdrawCoins [data-invalid-address]').removeClass('active');

	    if (settings.balances[arg.assetId] && settings.balances[arg.assetId].wallets[btsId]) {
		data['balance'] = numbers.toFixed(settings.balances[arg.assetId].wallets[btsId].amount);
		data['usd-balance'] = numbers.shortenNumber(settings.balances[arg.assetId].wallets[btsId].amount * settings.pulse[arg.assetId].pulse.price);
	    } else {
		data['balance'] = 0;
		data['usd-balance'] = 0;
	    }

	    $('#modalWithdrawCoins [data-amount-input]').unbind('keyup.wdraw').bind('keyup.wdraw', function() {
		$('#modalWithdrawCoins [data-usd-amount]').text(
		    numbers.floatify($(this).val() * settings.pulse[arg.assetId].pulse.price, 2)
		);
	    });

	    if (!arg.edit) {
		$('#modalWithdrawCoins [data-amount-input]').val('');
		$('#modalWithdrawCoins [data-address-input]').val('');
		$('#modalWithdrawCoins [data-amount-input]').trigger('keyup');
	    }

	    $('#modalWithdrawCoins [data-min-amount]').unbind('click.wdraw').bind('click.wdraw', function() {
		$('#modalWithdrawCoins [data-amount-input]').val(
		    $('#modalWithdrawCoins [data-min-amount]').text()
		);
		
		$('#modalWithdrawCoins [data-amount-input]').trigger('keyup');
	    });

	    $('#modalWithdrawCoins [data-max-amount]').unbind('click.wdraw').bind('click.wdraw', function() {
		$('#modalWithdrawCoins [data-amount-input]').val(
		    $('#modalWithdrawCoins [data-max-amount]').text()
		);
		
		$('#modalWithdrawCoins [data-amount-input]').trigger('keyup');
	    });

	    $('#modalWithdrawCoins [data-view="withdraw"] [data-modal-arg]').attr('data-modal-arg', JSON.stringify(arg));
	    $('#modalWithdrawCoins [data-view="confirm"] [data-modal-arg]').attr('data-modal-arg', JSON.stringify(arg));

	    $('#modalWithdrawCoins [data-amount-input]').unbind('input.wdraw').bind('input.wdraw', function(e) {
		var p = settings.assets[arg.assetId].wallets[arg.walletId].btsPrecision;
        	var t = new RegExp("^((\\s*|[1-9][0-9]*\\.?[0-9]{0," +
            	    p + "})|(0|(0\\.)[0-9]{0," + p + "}))$").test(e.target.value);

		var s = e.target.value.split('.');

		var m = parseFloat($('#modalWithdrawCoins [data-max-amount]').text());

		if (!t || parseFloat(e.target.value) > m ||
		    s.length > 1 && s[1].length > settings.assets[arg.assetId].wallets[arg.walletId].btsPrecision) {
		    $('#modalWithdrawCoins [data-amount-input]').val(v);
		}
	    });

	    var v;
	    $('#modalWithdrawCoins [data-amount-input]').unbind('keypress.wdraw').bind('keypress.wdraw', function(e) {
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

	    var fees = await Apis.instance().db_api().exec('get_objects', [['2.0.0']]);
	    var cer = await Apis.instance().db_api().exec('lookup_asset_symbols', [[btsId]]);
	    var userAcc = await Apis.instance().db_api().exec('get_full_accounts', [[settings.user.id], true]);
	    console.log(cer);

	    var fee = cer[0].options.core_exchange_rate.quote.amount /
		cer[0].options.core_exchange_rate.base.amount;

	    // BTS assets
	    if (asset.wallets[1]) {
		fee = (fees[0].parameters.current_fees.parameters[0][1].fee) *
		    fee / 10 ** cer[0].precision;
		fee = fee.toFixed(cer[0].precision);

		data['min-amount'] = 0.00001;

		if (settings.balances[arg.assetId] && settings.balances[arg.assetId].wallets[btsId]) {
		    data['max-amount'] = numbers.floatify(settings.balances[arg.assetId].wallets[btsId].amount, 5);
		} else {
		    data['max-amount'] = 0;
		}
		
		data['fee-symbol'] = settings.assets[9].symbol;
		data['service-fee'] = numbers.floatify(fees[0].parameters.current_fees.parameters[0][1].fee / 10 ** 5, 5);
		data['usd-service-fee'] = numbers.floatify(data['service-fee'] *
		    settings.pulse[9].pulse.price, 2);

		$('#modalWithdrawCoins [data-address-input]').unbind('blur.wdraw').bind('blur.wdraw', async function() {
		    var address = $(this).val()
		    var r = await Apis.instance().db_api().exec("lookup_accounts", [address, 50]);

		    var account = r.find(
			function(a) {
			    if (a[0] === address) {
				return true;
			    }
			    return false;
			}
		    );

		    if (!!account) {
			$('#modalWithdrawCoins [data-invalid-address]').removeClass('active');
			$('#modalWithdrawCoins [data-valid-address]').addClass('active');
		    } else {
			$('#modalWithdrawCoins [data-valid-address]').removeClass('active');
			$('#modalWithdrawCoins [data-invalid-address]').addClass('active');
		    }
		});
	    } else {
		fee = (fees[0].parameters.current_fees.parameters[0][1].fee +
		    fees[0].parameters.current_fees.parameters[0][1].price_per_kbyte * 0.2) *
		    fee / 10 ** cer[0].precision;
		fee = fee.toFixed(cer[0].precision);

		if (!!bitshares.availableGateways[app.gws[arg.walletId].ID].isSimple) {
		    var backedCoins = await bitshares.fetchCoinsSimple(app.gws[arg.walletId]);
		} else {
		    var backedCoins = await bitshares.fetchCoins(app.gws[arg.walletId]);
		}

		var backingAsset = null;
		for (var item of backedCoins) {
		    var backingCoin = item.backingCoinType || item.backingCoin;

		    if (backingCoin.toLowerCase() == asset.wallets[arg.walletId].btsSymbol.split('.')[1].toLowerCase()) {
			backingAsset = item;
			break;
		    }
		}
		console.log(backingAsset);

		if (!backingAsset.isAvailable) {
		    await app.changeView('multi-view-modal-show', {
			modalName: 'modalWithdrawCoins',
			viewName: 'maintenance'
		    }, JSON.stringify(arg));
		
		    return false;
		}
		
		var minDeposit = 0;
		if (!!backingAsset) {
		    if (!!backingAsset.minAmount && !!backingAsset.precision) {
			minDeposit = backingAsset.minAmount / 10 ** backingAsset.precision;
		    } else if (!!backingAsset.gateFee) {
			minDeposit = parseFloat(backingAsset.gateFee);
		    }
		}


		var serviceFee = numbers.floatify(minDeposit, 5);
		data['min-amount'] = serviceFee;

		if (settings.balances[arg.assetId] && settings.balances[arg.assetId].wallets[btsId]) {
		    data['max-amount'] = numbers.floatify(settings.balances[arg.assetId].wallets[btsId].amount - serviceFee, 5);
		} else {
		    data['max-amount'] = 0;
		}
		data['service-fee'] = serviceFee;
		data['usd-service-fee'] = numbers.floatify(serviceFee * settings.pulse[arg.assetId].pulse.price, 2);
		
		$('#modalWithdrawCoins [data-address-input]').unbind('blur.wdraw').bind('blur.wdraw', async function() {
		    var r = await bitshares.validateAddress({
			gw: app.gws[arg.walletId],
			walletType: backingAsset.walletType,
			address: $('#modalWithdrawCoins [data-address-input]').val()
		    });

		    if (!!r) {
			$('#modalWithdrawCoins [data-invalid-address]').removeClass('active');
			$('#modalWithdrawCoins [data-valid-address]').addClass('active');
		    } else {
			$('#modalWithdrawCoins [data-valid-address]').removeClass('active');
			$('#modalWithdrawCoins [data-invalid-address]').addClass('active');
		    }
		    console.log(r);
		});
	    }


	    for (var k in data) {
		$('#modalWithdrawCoins [data-' + k + ']').text(data[k]);
	    }

	    if (data.balance <= data['service-fee']) {
		await app.changeView('multi-view-modal-show', {
		    modalName: 'modalWithdrawCoins',
		    viewName: 'insufficient'
		});

		return false;
	    }
}catch(e){console.log(e);}
	    
	    this.prepareTransaction = async (trx, key) => {
try{
		// BTS assets
		if (asset.wallets[1]) {
		    var dexAcc = await Apis.instance().db_api().exec('get_full_accounts', [[$('#modalWithdrawCoins [data-address-input]').val()], true]);

		    var op = {
			fee: {
			    amount: fees[0].parameters.current_fees.parameters[0][1].fee,
			    asset_id: '1.3.0'
			},
			from: userAcc[0][1].account.id,
			to: dexAcc[0][1].account.id,
			amount: {
			    amount: (parseFloat($('#modalWithdrawCoins [data-amount-input]').val()) * 10 ** asset.wallets[arg.walletId].btsPrecision).toFixed(),
			    asset_id: btsId
			}
		    };
		} else {
		    var dexAcc = await Apis.instance().db_api().exec('get_full_accounts', [[backingAsset.intermediateAccount], true]);

		    console.log('gate fee: ' + backingAsset.gateFee);

		    var op = {
			fee: {
			    amount: fees[0].parameters.current_fees.parameters[0][1].fee + (fees[0].parameters.current_fees.parameters[0][1].price_per_kbyte * 0.2),
			    asset_id: '1.3.0'
			},
			from: userAcc[0][1].account.id,
			to: dexAcc[0][1].account.id,
			amount: {
			    amount: ((parseFloat($('#modalWithdrawCoins [data-amount-input]').val()) + parseFloat(backingAsset.gateFee)) * 10 ** asset.wallets[arg.walletId].btsPrecision).toFixed(),
			    asset_id: btsId
			},
			memo: {
			    from: userAcc[0][1].account.options.memo_key,
			    to: dexAcc[0][1].account.options.memo_key,
			    nonce:  TransactionHelper.unique_nonce_uint64(),
			    message: (arg.walletId == '3' ? asset.wallets[arg.walletId].btsSymbol.toLowerCase() : asset.symbol.toLowerCase()) +
				':' + $('#modalWithdrawCoins [data-address-input]').val()
			}
		    };

		    console.log(op.memo.message);

		    if (typeof key != 'string') {
			var m = Aes.encrypt_with_checksum(
        		    key,
            		    op.memo.to,
            		    op.memo.nonce,
            		    op.memo.message
        		);
	
			op.memo.message = m;
			console.log(m.toString('hex'));
		    }
		}
		console.log(op);

		trx.add_type_operation('transfer', op);
		trx.add_signer(key);

		return trx;
}catch(e) {console.log(e);}
	    }
	},

	verify: async function(arg) {
	    console.log(arg);

	    arg = JSON.parse(arg);

	    $('#modalWithdrawCoins [data-address-copy-button]')
		.unbind('click.withdraw')
		.bind('click.withdraw', copyAddress);

	    function copyAddress() {
		$('#modalWithdrawCoins [data-address-copy-button]').addClass('active');
		setTimeout(function() {
		    $('#modalWithdrawCoins [data-address-copy-button]').removeClass('active');
		}, 2000);

		$('#modalWithdrawCoins [data-address-input2]').focus();
		$('#modalWithdrawCoins [data-address-input2]').select();

		try {
	    	    document.execCommand('copy');
	    	    window.getSelection().removeAllRanges();
		} catch (e) { }
	    }

	    var el = kjua({
		text: $('#modalWithdrawCoins [data-address-input2]').val(),
		size: 210,
		fill: '#000',
		background: '#fff'
	    });

	    $('#modalWithdrawCoins [data-address-input2]').val(
		$('#modalWithdrawCoins [data-address-input]').val()
	    );

	    $('#modalWithdrawCoins [data-address-qr]').attr('src', el.src);

	    $('#modalWithdrawCoins [data-amount]').text(
		$('#modalWithdrawCoins [data-amount-input]').val()
	    );

	    $('#modalWithdrawCoins [data-address]').text(
		$('#modalWithdrawCoins [data-address-input]').val()
	    );

	    $('#modalWithdrawCoins [data-explorer]').attr('href',
		settings.assets[arg.assetId].info.explorer[0]
	    );

	    arg.edit = true;
	    $('#modalWithdrawCoins [data-view-show2="withdraw"]').attr('data-modal-arg', JSON.stringify(arg));
	    $('#modalWithdrawCoins [data-view-show2="confirm"]').attr('data-modal-arg', JSON.stringify(arg));
	},

	confirm: async function(arg) {
	    console.log(arg);

	    arg = JSON.parse(arg);

	    $('#modalWithdrawCoins [data-password-error]').removeClass('active');
	    $('#modalWithdrawCoins [data-password-input]').val('');

	    $('#modalWithdrawCoins [data-user]').text(settings.user.name);

	    var prepareTransaction = this.prepareTransaction;

	    $('#modalWithdrawCoins [data-withdraw-button]').unbind('click.wdraw').bind('click.wdraw', async function() {
		var r = await Apis.instance().db_api().exec('get_account_by_name', [settings.user.name]);

		if (!r) {
		    $('#modalWithdrawCoins [data-password-error]').addClass('active');
		    return;
		}

		var activeKey = app.generateKeyFromPassword(settings.user.name, 'active', $('#modalWithdrawCoins [data-password-input]').val());
		//var memoKey = app.generateKeyFromPassword(settings.user.name, 'memo', $('#modalWithdrawCoins [data-password-input]').val());

		if (activeKey.pubKey != r.active.key_auths[0][0]) {
		    $('#modalWithdrawCoins [data-password-error]').addClass('active');
		    return;
		}

		$('#modalWithdrawCoins [data-password-input]').val('');

		try {
		    $('#modalWithdrawCoins .preloader').addClass('active');

		    var trx = await prepareTransaction(new TransactionBuilder(), activeKey.privKey);
		    console.log(trx);

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
			modalName: 'modalWithdrawCoins',
			viewName: 'success'
		    });
		
		    return false;
		} catch (e) {
		    console.log(e);

		    await app.changeView('multi-view-modal-show', {
			modalName: 'modalWithdrawCoins',
			viewName: 'fail'
		    });
		
		    return false;
		}
	    });
	},

	beet: async function(arg) {
	    var prepareTransaction = this.prepareTransaction;

		$('#modalWithdrawCoins [data-beet-send-button]').unbind('click.wdraw').bind('click.wdraw', async function() {

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
		    $('#modalWithdrawCoins .preloader').addClass('active');

		    //await app.wait(3000);
		    //console.log(trx);
		    var r = await trx.broadcast();
		    console.log(r);

		    await app.updateBalances();
		    app.renderBalances();
	    
		    await app.updateHistory();
		    app.renderHistory();
	    
		    await app.modalHandler({modalName: 'modalCoin'}, arg.assetId);
	    
		    app.setHandlers();

		    await app.changeView('multi-view-modal-show', {
			modalName: 'modalWithdrawCoins',
			viewName: 'success'
		    });
		
		    return false;
		} catch (e) {
		    console.log(e);

		    await app.changeView('multi-view-modal-show', {
			modalName: 'modalWithdrawCoins',
			viewName: 'fail'
		    });
		
		    return false;
		}
		});
	}
}
