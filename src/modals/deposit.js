var numbers = require('../utils/numbers');
var settings = require('../utils/settings');
var bitshares = require('../utils/bitshares');
var app = require('../app');

var kjua = require('kjua');


module.exports = {
	main: async function(arg) {
	    console.log('main');

	    $('#modalDepositCoins [data-coin-search]').unbind('keyup.mwallets').bind('keyup.mwallets', function() {
		var value = $(this).val().toLowerCase();

		$('#modalDepositCoins [data-coins-list] li').filter(function() {
		    $(this).toggle(
			$(this).find('[data-symbol]').text().toLowerCase().indexOf(value) > -1 ||
			$(this).find('[data-name]').text().toLowerCase().indexOf(value) > -1
		    );
		});

		$('#modalDepositCoins [data-coin-search-empty]').toggle(!$('#modalDepositCoins [data-coins-list] li:visible').length);
		//$('#coin-search-unsupported').toggle(!value.length);
		$('#modalDepositCoins .areaClear').toggleClass('active', value.length > 0);
	    });

	    $('#modalDepositCoins .areaClear').unbind('click.mwallets').bind('click.mwallets', function() {
		$('#modalDepositCoins [data-coin-search]').val('');
		$('#modalDepositCoins [data-coin-search]').trigger('keyup');
	    });

	    $('#modalDepositCoins [data-coins-list]').empty();


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

		var div = $('#modalDepositCoins [data-coin-template] > li').clone();

		for (var k in data) {
		    div.find('[data-' + k + ']').text(data[k]);
		}

		div.attr('data-modal-arg', asset.id);
		div.addClass('c-' + asset.id);
	    
		div.appendTo('#modalDepositCoins [data-coins-list]');
	    }

	    app.setHandlers();

	    $('#modalDepositCoins [data-coin-search]').val('');
	    $('#modalDepositCoins [data-coin-search]').trigger('keyup');
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
		    modalName: 'modalDepositCoins',
		    viewName: 'deposit'
		}, JSON.stringify({
		    assetId: arg,
		    walletId: sortedWalletsBalances[0].id
		}));
		
		return false;
	    }

	    sortedWalletsBalances.sort(function(a, b) {
		return b.amount - a.amount;
    	    });

	    $('#modalDepositCoins [data-wallets]').empty();
	    $('#modalDepositCoins [data-symbol]').text(settings.assets[arg].symbol);
	
	    for (var wallet of sortedWalletsBalances) {
		var div = $('#modalDepositCoins [data-wallet-template] > li').clone();
		var usdAmount = numbers.shortenNumber(wallet.amount * settings.pulse[arg].pulse.price);
		wallet.amount = numbers.shortenNumber(wallet.amount);

		div.attr('data-modal-arg', JSON.stringify({
		    assetId: arg,
		    walletId: wallet.id
		}));
		div.find('[data-name]').text(settings.exchanges[wallet.id].name);
		div.find('[data-amount]').text(wallet.amount);
		div.find('[data-usd-amount]').text(usdAmount);
	    
		div.appendTo('#modalDepositCoins [data-wallets]');
	    }

	    app.setHandlers();
	},

	maintenance: async function(arg) {
	    arg = JSON.parse(arg);
	    
	    var asset = settings.assets[arg.assetId];	    

	    $('#modalDepositCoins [data-asset-symbol]').text(asset.symbol);
	    $('#modalDepositCoins [data-gateway-news]').attr('href', settings.exchanges[arg.walletId].news);
	    $('#modalDepositCoins [data-gateway]').text(settings.exchanges[arg.walletId].name);
	    $('#modalDepositCoins [data-gateway]').attr('href', settings.exchanges[arg.walletId].website);
	    $('#modalDepositCoins [data-gateway-support]').attr('href', settings.exchanges[arg.walletId].support);
	},

	deposit: async function(arg) {
	    console.log('deposit');
	    console.log(arg);
try {
	    arg = JSON.parse(arg);

	    $('#modalDepositCoins [data-address-copy-button]')
		.unbind('click.deposit')
		.bind('click.deposit', copyAddress);

	    function copyAddress() {
		$('#modalDepositCoins [data-address-copy-button]').addClass('active');
		setTimeout(function() {
		    $('#modalDepositCoins [data-address-copy-button]').removeClass('active');
		}, 2000);

		$('#modalDepositCoins [data-address-input]').focus();
		$('#modalDepositCoins [data-address-input]').select();

		try {
	    	    document.execCommand('copy');
	    	    window.getSelection().removeAllRanges();
		} catch (e) { }
	    }

	    var asset = settings.assets[arg.assetId];

	    var data = {
		'name': asset.name,
		'symbol': asset.symbol,
		'wallet-name': settings.exchanges[arg.walletId].name
	    }

	    for (var k in data) {
		$('#modalDepositCoins [data-' + k + ']').text(data[k]);
	    }

	    $('#modalDepositCoins [data-id]')
		.removeClass()
		.addClass('c-' + arg.assetId);

	    // BTS assets
	    if (asset.wallets[1]) {
		$('#modalDepositCoins [data-address-input]').val(settings.user.name);
		$('#modalDepositCoins [data-deposit-input-memo]').hide();
		$('#modalDepositCoins [data-explorer-link]').attr('href',
		    settings.assets[arg.assetId].info.explorer[0]);

    		$('#modalDepositCoins [data-min-amount]').text(0.00001);
    		$('#modalDepositCoins [data-min-usd-amount]').text(
    		    numbers.shortenNumber(0.00001 * settings.pulse[arg.assetId].pulse.price)
    		);

		var el = kjua({
		    text: settings.user.name,
		    size: 210,
		    fill: '#000',
		    background: '#fff'
		});

		$('#modalDepositCoins [data-address-qr]').attr('src', el.src);

		return true;
	    }


	    var allCoins = await $.ajax({
		url: app.gws[arg.walletId].BASE + app.gws[arg.walletId].COINS_LIST,
		contentType: 'application/json',
		dataType: 'json'
	    });

	    var tradingPairs = await $.ajax({
		url: app.gws[arg.walletId].BASE + app.gws[arg.walletId].TRADING_PAIRS,
		contentType: 'application/json',
		dataType: 'json'
	    });

	    var wallets = await $.ajax({
		url: app.gws[arg.walletId].BASE + app.gws[arg.walletId].ACTIVE_WALLETS,
		contentType: 'application/json',
		dataType: 'json'
	    });

	    var backedCoins = bitshares.getBackedCoins({
		allCoins: allCoins,
		tradingPairs: tradingPairs,
		backer: app.gws[arg.walletId].ID
	    }).filter(a => !!a.walletType);
        	backedCoins.forEach(a => {
            	    a.isAvailable = wallets.indexOf(a.walletType) !== -1;
            });

	    var backingAsset = null;
	    for (var item of backedCoins) {
		var backingCoin = item.backingCoinType || item.backingCoin;

		if (backingCoin.toUpperCase().indexOf('EOS.') !== -1) {
                    backingCoin = backingCoin.split('.')[1];
                }

		if (backingCoin.toLowerCase() == asset.wallets[arg.walletId].btsSymbol.split('.')[1].toLowerCase()) {
		    backingAsset = item;
		    break;
		}
	    }
	    console.log(backingAsset);

	    if (!backingAsset.isAvailable) {
		await app.changeView('multi-view-modal-show', {
		    modalName: 'modalDepositCoins',
		    viewName: 'maintenance'
		}, JSON.stringify(arg));
		
		return false;
	    }

	    var minDeposit = 0;
	    if (!!backingAsset) {
		if (!!backingAsset.minAmount && !!backingAsset.precision) {
		    minDeposit = backingAsset.minAmount / 10 ** backingAsset.precision;
		} else if (!!backingAsset.gateFee) {
		    minDeposit = backingAsset.gateFee * 2;
		}
	    }

	    var trade = await $.ajax({
		url: app.gws[arg.walletId].BASE + '/simple-api/initiate-trade',
		contentType: 'application/json',
		type: 'POST',
		data: JSON.stringify({
		    inputCoinType: arg.walletId == '3' ? asset.wallets[arg.walletId].btsSymbol.toLowerCase() : asset.symbol.toLowerCase(),
	    	    outputAddress: settings.user.name,
		    outputCoinType: asset.wallets[arg.walletId].btsSymbol.toLowerCase()
		}),
		dataType: 'json'
	    });

	    console.log(trade);


	    $('#modalDepositCoins [data-address-input]').val(trade.inputAddress);
	    $('#modalDepositCoins [data-memo-input]').val(trade.inputMemo);
	    $('#modalDepositCoins [data-explorer-link]').attr('href',
		settings.assets[arg.assetId].info.explorer[0]);

    	    $('#modalDepositCoins [data-min-amount]').text(minDeposit);
    	    $('#modalDepositCoins [data-min-usd-amount]').text(
    		numbers.shortenNumber(minDeposit * settings.pulse[arg.assetId].pulse.price)
    	    );

	    var el = kjua({
		text: trade.inputAddress,
		size: 210,
		fill: '#000',
		background: '#fff'
	    });
	
	    $('#modalDepositCoins [data-address-qr]').attr('src', el.src);

	    if (trade.inputMemo) {
		$('#modalDepositCoins [data-deposit-input-memo]').show();

		var el = kjua({
		    text: trade.inputMemo,
		    size: 210,
		    fill: '#000',
		    background: '#fff'
		});
	
		$('#modalDepositCoins [data-memo-qr]').attr('src', el.src);
	    } else {
		$('#modalDepositCoins [data-deposit-input-memo]').hide();
	    }
} catch(e){console.log(e);}
	}

}