var numbers = require('../utils/numbers');
var settings = require('../utils/settings');
var app = require('../app');


module.exports = async function(arg) {
	if (!arg) {
	    return;
	}
try{
	var coin = settings.assets[arg];
	if (!coin) {console.log(coin);
	    return;
	}

	var btsSum = 0;

	var price = settings.pulse[arg].pulse.price.toString().split('.');

	var change24 = settings.pulse[arg].pulse.change_24h + '%';
	if (change24.charAt(0) != '-') {
	    change24 = '+' + change24;
	}

	var cap = numbers.formatNumber(settings.pulse[arg].pulse.market_cap);

	var data = {
	    name: coin.name,
	    symbol: coin.symbol,
	    'website-name': new URL(settings.assets[arg].info.website).hostname,
	    'supply': cap,
	    'asset-type': settings.assets[arg].info.category,
	    'algorithm': settings.assets[arg].info.algorithm,
	    'proof-type': settings.assets[arg].info.proofType,
	    
	    'pulse-price0': price[0],
	    'pulse-price1': price.length > 1 ? '.' + price[1] : '',
	    'pulse-change': change24,
	    'pulse-cap': cap,
	    'pulse-volume': numbers.formatNumber(settings.pulse[arg].pulse.volume_24h)
	}

	for (var k in data) {
	    $('#modalCoin [data-' + k + ']').text(data[k]);
	}

	$('#modalCoin [data-pulse-change]')
	    .removeClass()
	    .addClass(change24.charAt(0) == '-' ? 'text-red': 'text-green');

	if (settings.assets[arg].info.mineable) {
	    $('#modalCoin [data-not-mineable]').css('display', 'none');
	    $('#modalCoin [data-mineable]').css('display', 'block');
	    
	    if (settings.assets[arg].info.fullyPremined == 1) {
		$('#modalCoin [data-type-premined]').css('display', 'block');

		$('#modalCoin [data-type-mineable]').css('display', 'none');
		$('#modalCoin [data-type-not-mineable]').css('display', 'none');
	    } else {
		$('#modalCoin [data-type-premined]').css('display', 'none');
	    
		$('#modalCoin [data-type-mineable]').css('display', 'block');
		$('#modalCoin [data-type-not-mineable]').css('display', 'none');
	    }
	} else {
	    $('#modalCoin [data-not-mineable]').css('display', 'block');
	    $('#modalCoin [data-mineable]').css('display', 'none');
	    
	    $('#modalCoin [data-type-mineable]').css('display', 'none');
	    $('#modalCoin [data-type-not-mineable]').css('display', 'none');
	    $('#modalCoin [data-type-premined]').css('display', 'block');
	}

	$('#modalCoin [data-website-card]')
	    .removeClass()
	    .addClass('card shadow c-' + arg);

	var github = $('#modalCoin [data-github]');
	if (settings.assets[arg].info.sourceCode.length) {
	    github.find('[data-href]').attr('href', settings.assets[arg].info.sourceCode[0]);
	    github.css('display', 'block');
	} else {
	    github.css('display', 'none');
	}

	$('#modalCoin [data-website]').attr('href', settings.assets[arg].info.website);
	var socialLinks = $('#modalCoin [data-social-links]');
	socialLinks.find('.card').css('display', 'none');

	for (k in settings.assets[arg].info) {
	    switch (k) {
		case 'twitter':
		case 'bitcointalk':
		case 'reddit':
		case 'telegram':
		case 'discord':
		case 'medium':
		    socialLinks.find('.ic-' + k)
			.css('display', 'block')
			.find('a')
			.attr('href', settings.assets[arg].info[k]);
		    break;
	    }
	}


	$('#modalCoin [data-id]')
	    .removeClass().addClass('positionCoin c-' + arg);

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

	sortedWalletsBalances.sort(function(a, b) {
	    return b.amount - a.amount;
	});

	$('#gw-coin-balances-list').empty();
	var firstWallet = null;
	
	for (var wallet of sortedWalletsBalances) {
	    var div = $('#gw-coin-balance-template > li').clone();
	    if (!firstWallet) {
		firstWallet = div;
	    }

	    var usdAmount = wallet.amount * settings.pulse[arg].pulse.price;
	    if (usdAmount < 1) {
		usdAmount = numbers.toFixed(numbers.floatify(usdAmount, 12));
	    } else {
		usdAmount = numbers.toFixed(numbers.floatify(usdAmount, 8));
	    }

	    div.attr('data-wallet-id', wallet.id);
	    div.find('[data-name]').text(settings.exchanges[wallet.id].name);
	    div.find('[data-amount]').text(numbers.toFixed(wallet.amount));
	    div.find('[data-usd-amount]').text(usdAmount);
	    
	    div.appendTo('#gw-coin-balances-list');
	}

	$('#gw-coin-balances-list li').unbind('click.mcoin').bind('click.mcoin', function() {
	    $('#gw-coin-balances-list li [data-actions]').remove();
	    
	    var item = $(this);
	    if ($('#gw-coin-balances-list li.active').is(item)) {
		item.toggleClass('active');
	    } else {
		$('#gw-coin-balances-list li.active').removeClass('active');
		item.addClass('active');

		var a = $('#gw-coin-actions-template > div').clone();
		a.appendTo(item);
	    }
	    
	    item.find('[data-modal-arg]').attr('data-modal-arg', JSON.stringify({
		assetId: arg,
		walletId: item.attr('data-wallet-id')
	    }));

	    item.find('[data-buy-arg]').attr('data-modal-arg', JSON.stringify({
		assetId: arg,
		walletId: item.attr('data-wallet-id'),
		buy: {
		    assetId: arg,
		    walletId: item.attr('data-wallet-id')
		},
		sell: { }
	    }));

	    item.find('[data-sell-arg]').attr('data-modal-arg', JSON.stringify({
		assetId: arg,
		walletId: item.attr('data-wallet-id'),
		sell: {
		    assetId: arg,
		    walletId: item.attr('data-wallet-id')
		},
		buy: { }
	    }));

	    app.setHandlers();
	});

	if (firstWallet) {
	    firstWallet.click();
	}

	var dates = {};
	for (var item of settings.history) {
	    if (!item.date) {
		continue;
	    }
	    
	    var f = false;
	    loop:
	    for (var w in settings.assets[arg].wallets) {
		switch (item.type) {
		    case 0:
		    case 1:
			if (settings.assets[arg].wallets[w].btsId == item.assetId) {
			    f = true;
			    break loop;
			}
			break;
		
		    case 4:
			if (settings.assets[arg].wallets[w].btsId == item.pays.assetId ||
			    settings.assets[arg].wallets[w].btsId == item.receives.assetId) {
			    f = true;
			    break loop;
			}
			break;
		}
	    }
	    
	    if (!f) {
		continue;
	    }
	    
	    dates[item.date] = 1;
	}

	$('#coin-history-items').empty();

	var c = 0;
	for (var date in dates) {
	    var itemsDiv = $('<ul class="items items-2 ic-20i">');
	    var dateDiv = $('#history-date-template > div').clone();
	    dateDiv.find('p').text(date);
	    dateDiv.appendTo(itemsDiv);
	    
	    for (var item of settings.history) {
		if (item.date != date) {
		    continue;
		}

		var f = false;
		loop:
		for (var w in settings.assets[arg].wallets) {
		    switch (item.type) {
			case 0:
			case 1:
			    if (settings.assets[arg].wallets[w].btsId == item.assetId) {
				f = true;
				break loop;
			    }
			    break;
		
			case 4:
			    if (settings.assets[arg].wallets[w].btsId == item.pays.assetId ||
				settings.assets[arg].wallets[w].btsId == item.receives.assetId) {
				f = true;
				break loop;
			    }
			    break;
		    }
		}

		if (!f) {
		    continue;
		}

		switch (item.type) {
		    case 0:
		    case 1:
			var itemDiv = $('#history-transfer-item-template > li').clone();

			itemDiv.attr('data-modal-show', 'modalTransactionTransfer');
			itemDiv.removeClass().addClass(item.type == 1 ? 'ic-received' : 'ic-sent');
			itemDiv.find('[data-type]').text(item.type == 1 ? 'Received' : 'Sent');
			itemDiv.find('[data-amount]').removeClass().addClass(item.type == 1 ? 'text-green' : 'text-red');

			var data = {
			    'name': settings.assets[settings.wallets[item.assetId].assetId].name,
			    'amount': (item.type == 1 ? '+' : '-') + numbers.shortenNumber(item.amount),
			    'symbol': settings.assets[settings.wallets[item.assetId].assetId].symbol,
			    'time': item.time
			};
			break;
		
		    case 4:
			var itemDiv = $('#history-exchange-item-template > li').clone();
			itemDiv.attr('data-modal-show', 'modalTransactionExchange');

			var data = {
			    'send-amount': '-' + numbers.shortenNumber(item.pays.amount),
			    'send-symbol': settings.assets[settings.wallets[item.pays.assetId].assetId].symbol,
			    'receive-amount': '+' + numbers.shortenNumber(item.receives.amount),
			    'receive-symbol': settings.assets[settings.wallets[item.receives.assetId].assetId].symbol,
			    'time': item.time
			};
			break;
		}

		for (var k in data) {
		    $(itemDiv).find('[data-' + k + ']').text(data[k]);
		}

		itemDiv.attr('data-modal-arg', item.id);
		itemDiv.appendTo(itemsDiv);
		c++;
	    }
	    
	    itemsDiv.appendTo('#coin-history-items');
	}

	if (!c) {
	    $('#coin-history-empty').show();
	    $('#coin-history-items').hide();
	} else {
	    $('#coin-history-empty').hide();
	    $('#coin-history-items').show();
	}

	app.setHandlers();
}catch(e){console.log(e);}
    }