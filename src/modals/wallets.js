var numbers = require('../utils/numbers');
var settings = require('../utils/settings');
var app = require('../app');

module.exports = function() {
	$('#coin-search').unbind('keyup.mwallets').bind('keyup.mwallets', function() {
	    var value = $(this).val().toLowerCase();

	    $('#all-coins-list li').filter(function() {
		$(this).toggle(
		    $(this).find('[data-symbol]').text().toLowerCase().indexOf(value) > -1 ||
		    $(this).find('[data-name]').text().toLowerCase().indexOf(value) > -1
		);
	    });
	    
	    $('#coin-search-empty').toggle(!$('#all-coins-list li:visible').length);
	    $('#coin-search-unsupported').toggle(!value.length);
	    $('#modalWallets .areaClear').toggleClass('active', value.length > 0);
	});

	$('#modalWallets .areaClear').unbind('click.mwallets').bind('click.mwallets', function() {
	    $('#coin-search').val('');
	    $('#coin-search').trigger('keyup');
	});

	$('#all-coins-list').empty();


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
	        'usd-amount': usdAmount || (amount > 0 ? 0 : 'V: ' + numbers.formatNumber(asset.volume24h))
	    };

	    var div = $('#all-coins-template > li').clone();

	    for (var k in data) {
		div.find('[data-' + k + ']').text(data[k]);
	    }

	    div.attr('data-modal-arg', asset.id);
	    div.addClass('c-' + asset.id);
	    
	    div.appendTo('#all-coins-list');
	}

	app.setHandlers();

	$('#coin-search').val('');
	$('#coin-search').trigger('keyup');
}