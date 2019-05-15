var settings = require('./utils/settings');
var numbers = require('./utils/numbers');

var {Apis} = require('bitsharesjs-ws');
var {PrivateKey} = require('bitsharesjs');


var currentView;

var gws = {
    '2': {
	BASE: "https://ol-api1.openledger.info/api/v0/ol/support",
	COINS_LIST: "/coins",
	ACTIVE_WALLETS: "/active-wallets",
	TRADING_PAIRS: "/trading-pairs",
	DEPOSIT_LIMIT: "/deposit-limits",
	ESTIMATE_OUTPUT: "/estimate-output-amount",
	ESTIMATE_INPUT: "/estimate-input-amount",
	PREFIX: 'OPEN.'
    },

    '3': {
	BASE: "https://api.crypto-bridge.org/api/v1",
	COINS_LIST: "/coins",
	ACTIVE_WALLETS: "/wallets",
	MARKETS: "/markets",
	TRADING_PAIRS: "/trading-pairs",
	PREFIX: 'BRIDGE.'
    },

    '4': {
	BASE: "https://api.gdex.io/adjust",
	COINS_LIST: "/coins",
	ACTIVE_WALLETS: "/active-wallets",
	TRADING_PAIRS: "/trading-pairs",
	PREFIX: 'GDEX.'
    }
}

module.exports = {
    changeView: changeView,
    setHandlers: setHandlers,

    updateHistory: updateHistory,
    renderHistory: renderHistory,

    updateBalances: updateBalances,
    renderBalances: renderBalances,

    generateKeyFromPassword: generateKeyFromPassword,
    modalHandlers: modalHandlers,

    setInactiveTimer: setInactiveTimer,
    modalHandler: modalHandler,
    isTouchDevice: isTouchDevice,
    gws: gws
}


async function wait(ms) {
  await new Promise(resolve => setTimeout(() => resolve(), ms));
}

var modalHandlers = {
    modalExchangeCoins: require('./modals/exchange'),
    modalWithdrawCoins: require('./modals/withdraw'),
    modalDepositCoins: require('./modals/deposit'),
    modalWallets: require('./modals/wallets'),
    modalCoin: require('./modals/coin'),
    modalTransactionExchange: require('./modals/transactionExchange'),
    modalTransactionTransfer: require('./modals/transactionTransfer')
}

var viewHandlers = {
    screenOnboarding: require('./screens/onboarding'),
    screenLogin: require('./screens/login'),
    screenSignup: require('./screens/signup'),
    screenSignupVerify: require('./screens/signupVerify'),
    screenPin: require('./screens/pin'),
    screenApp: require('./screens/app')
}


function modalHandler(name, arg) {
    if (name.viewName) {
	modalHandlers[name.modalName][name.viewName](arg);
    } else {
	modalHandlers[name.modalName](arg);
    }
}

    async function changeView(action, name, arg) {
	switch (action) {
	    case 'view-show':
		console.log(currentView + ' --> ' + name + '(' + (arg ? arg : '') + ')');
		clearInterval(inactiveTimer);

		if (viewHandlers[name]) {
		    viewHandlers[name]();
		}
	    
		$('#' + name).addClass('active');
		$('#' + currentView)
		    .removeClass('active')
		    .find('.screenModal.active, .screenModalFull.active, .screenModalDynamic.active')
		    .removeClass('active');

		currentView = name;
		break;
	
	    case 'modal-show':
		console.log(currentView + ' --> ' + name + '(' + (arg ? arg : '') + ')');

		//$('#' + currentView + ' #' + name + ' input').val('');

		$('#' + currentView + ' #' + name).addClass('active');
                $('#' + currentView + ' #' + name + ' .content').scrollTop(0);

		if (name == 'modalWallets' && $('#' + currentView + ' #modalCoin').hasClass('active')) {
		    $('#' + currentView + ' #modalCoin')
			.removeClass('active')
			.addClass('inactive');

		    setTimeout(() => {
			$('#' + currentView + ' #modalCoin').removeClass('inactive');
		    }, 800);
		}

		if (modalHandlers[name]) {
		    $('#' + currentView + ' #' + name + ' .modal-active').remove();
		
		    $('#' + currentView + ' #' + name + ' .header').after(
			$('#' + currentView + ' #modalPreloader .modal-active')
			    .clone()
			    .addClass('active')
		    );
		    
		    try {
			await modalHandlers[name](arg);
		    } catch(e) { }
		    
		    // hide preloader
		    $('#' + currentView + ' #' + name + ' .modal-active').removeClass('active');
		}
		break;
	
	    case 'multi-view-modal-show':
		console.log(currentView + ' --> ' + JSON.stringify(name) + '(' + (arg ? arg : '') + ')');

		//$('#' + currentView + ' #' + name.modalName + ' [data-view="' + name.viewName + '"] input').val('');

		$('#' + currentView + ' #' + name.modalName).addClass('active');

		$('#' + currentView + ' #' + name.modalName + ' [data-view]').hide();
		$('#' + currentView + ' #' + name.modalName + ' [data-view="' + name.viewName + '"]').show();

                $('#' + currentView + ' #' + name.modalName + ' .content').scrollTop(0);

		//if (modalHandlers[name.modalName] && modalHandlers[name.modalName][name.viewName]) {
		    $('#' + currentView + ' #' + name.modalName + ' .modal-active').remove();
		
		    $('#' + currentView + ' #' + name.modalName + ' .header').after(
			$('#' + currentView + ' #modalPreloader .modal-active')
			    .clone()
			    .addClass('active')
		    );
		    
		    try {
			if (await modalHandlers[name.modalName][name.viewName](arg) === false) {
			    return;
			}
		    } catch(e) { }
		    
		    $('#' + currentView + ' #' + name.modalName + ' [data-title]').html(
			$('#' + currentView + ' #' + name.modalName + ' [data-view="' + name.viewName + '"] [data-view-title]').html()
		    );

		    // hide preloader
		    $('#' + currentView + ' #' + name.modalName + ' .modal-active').removeClass('active');
		//}
		break;
	
	    case 'modal-hide':
		$('#' + currentView + ' #' + name)
		    .removeClass('active')
		    .addClass('inactive');
		
		setTimeout(() => {
		    $('#' + currentView + ' #' + name).removeClass('inactive');
		}, 800);
		break;
	}
    }

function setHandlers() {
    $('a,div,li').unbind('click.a').bind('click.a', function(e) {
	lastActiveTime = +new Date();

	if ($(this).data('view-show')) {
	    changeView('view-show', $(this).data('view-show'));
	    return false;
	}

	if ($(this).data('modal-show')) {
	    changeView('modal-show', $(this).data('modal-show'), $(this).attr('data-modal-arg'));
	    return false;
	}

	if ($(this).data('multi-view-modal-show')) {
	    changeView('multi-view-modal-show', {
		modalName: $(this).data('multi-view-modal-show'),
		viewName: $(this).data('view-show2')
	    }, $(this).attr('data-modal-arg'));
	    return false;
	}

	if ($(this).data('modal-hide')) {
	    changeView('modal-hide', $(this).data('modal-hide'));
	    return false;
	}

	//return false;
	//e.preventDefault();
    });
}

var lastActiveTime = 0;
var inactiveTimer = null;

function inactiveTimerHandler() {
    if (+new Date() - lastActiveTime >= 15 * 1000 * 60) {
	changeView('view-show', 'screenPin');
    }
};

function setInactiveTimer() {
    lastActiveTime = +new Date();
    inactiveTimer = setInterval(inactiveTimerHandler, 1 * 1000);
}

function generateKeyFromPassword(accountName, role, password) {
    let seed = accountName + role + password;
    let privKey = PrivateKey.fromSeed(seed);
    let pubKey = privKey.toPublicKey().toString('BTS');

    return {privKey, pubKey};
}

	async function updateHistory() {
	    var hst = await Apis.instance().history_api().exec('get_account_history', [settings.user.id, '1.11.0', 100, '1.11.0']);
	    var blocks = [];
	
	    settings.history = [];
	    for (var item of hst) {
		if (item.op[0] != 0 && item.op[0] != 4) {
		    continue;
		}
	    
		var op = {
		    id: item.id,
		    blockNum: item.block_num
		}
		var op1;
	    
		blocks.push(item.block_num);

		switch (item.op[0]) {
		    case 0:
			if (!settings.wallets[item.op[1].amount.asset_id]) {
			    continue;
			}

			if (item.op[1].from == settings.user.id) {
			    op.type = 0;
			} else {
			    op.type = 1;
			}
			op.amount = item.op[1].amount.amount;
			op.assetId = item.op[1].amount.asset_id;
			op.trxInBlock = item.trx_in_block;
			op.virtualOp = item.virtual_op;
			op.to = item.op[1].to;
			op.from = item.op[1].from;
		    
			if (settings.wallets[item.op[1].fee.asset_id]) {
			    op.fee = item.op[1].fee.amount / 10 ** settings.wallets[item.op[1].fee.asset_id].precision;
			    op.feeAssetId = item.op[1].fee.asset_id;
			} else {
			    op.fee = 0;
			}

			break;
		
		    case 4:
			if (!settings.wallets[item.op[1].pays.asset_id] ||
			    !settings.wallets[item.op[1].receives.asset_id]) {
			    continue;
			}

			op.type = 4;
			op.pays = {
			    amount: item.op[1].pays.amount,
			    assetId: item.op[1].pays.asset_id
			};
			op.receives = {
			    amount: item.op[1].receives.amount,
			    assetId: item.op[1].receives.asset_id
			};
			op.accountId = item.op[1].account_id;
			op.trxInBlock = item.trx_in_block;
			op.virtualOp = item.virtual_op;
			op.orderId = item.op[1].order_id;

			if (settings.wallets[item.op[1].fee.asset_id]) {
			    op.fee = item.op[1].fee.amount / 10 ** settings.wallets[item.op[1].fee.asset_id].precision;
			    op.feeAssetId = item.op[1].fee.asset_id;
			} else {
			    op.fee = 0;
			}

			break;
	        }
	    
		settings.history.push(op);
	    }
	
	    var _blocks = await Apis.instance().db_api().exec('get_block_header_batch', [blocks]);
	    var blocks = {};
	    for (var block of _blocks) {
		blocks[block[0]] = block[1].timestamp;
	    }
	
	    for (var op of settings.history) {
		var assetId = null;
	    
		switch (op.type) {
		    case 0:
		    case 1:
			if (!settings.wallets[op.assetId]) {
			    continue;
			}
		    
			op.amount = op.amount / 10 ** settings.wallets[op.assetId].btsPrecision;
			break;

		    case 4:
			if (!settings.wallets[op.pays.assetId]) {
			    continue;
			}

			if (!settings.wallets[op.receives.assetId]) {
			    continue;
			}
		    
			op.pays.amount = op.pays.amount / 10 ** settings.wallets[op.pays.assetId].btsPrecision;
			op.receives.amount = op.receives.amount / 10 ** settings.wallets[op.receives.assetId].btsPrecision;
			break;
		}
	    
		/*if (!settings.wallets[op.assetId]) {
		    continue;
	        }*/
	    
		//op.amount = op.amount / 10 ** settings.wallets[op.assetId].btsPrecision;
		op.timestamp = blocks[op.blockNum];
	    
		var date = new Date(blocks[op.blockNum]);
		const monthNames = ["January", "February", "March", "April", "May", "June",
	    	    "July", "August", "September", "October", "November", "December"
		];
	    
		op.date = date.getDate() + ' ' + monthNames[date.getMonth()];
		op.time = (`0${date.getHours()}`).slice(-2) + ':' + (`0${date.getMinutes()}`).slice(-2);
	    }
	
	    settings.history.sort(function(a, b) {
		return b.blockNum - a.blockNum;
	    });

	    settings.history = JSON.parse(JSON.stringify(settings.history));
	}

    function renderHistory() {
	$('#history-items').empty();
	
	var dates = {};
	for (var item of settings.history) {
	    if (!item.date) {
		continue;
	    }
	    
	    dates[item.date] = 1;
	}

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
			    'amount': (item.type == 1 ? '+' : '-') + numbers.floatify(item.amount, 5),
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
	    }
	    
	    itemsDiv.appendTo('#history-items');
	    
	    if (c++ == 0) {
		$('#invest-banner')
		    .clone()
		    .appendTo('#history-items')
		    .show();
	    }
	}
    }

    async function updateBalances() {
	var usdSum = 0;
	//var sum = 0;
	var balances = {};

	var r = await Apis.instance().db_api().exec('get_account_balances', [settings.user.id, []]);

	for (var coin of r) {
	    if (coin.amount == 0) {
		continue;
	    }

	    if (!settings.wallets[coin.asset_id]) {
		continue;
	    }
	    
	    var assetId = settings.wallets[coin.asset_id].assetId;
	    var precision = settings.wallets[coin.asset_id].btsPrecision;
	    
	    if (!balances[assetId]) {
		balances[assetId] = {
		    amount: 0,
		    usdAmount: 0,
		    wallets: { }
		};
	    }

	    /*if (coin.asset_id == '1.3.0') {
		balances[assetId].btsAmount = coin.amount / 10 ** precision;
	    } else {
		var tr = await Apis.instance().db_api().exec('get_ticker', ['BTS', coin.asset_id]);

		balances[assetId].btsAmount += numbers.floatify(balances[assetId].btsAmount + (coin.amount / 10 ** precision) * tr.latest);
	    }*/

	    coin.amount /= 10 ** precision;
	    balances[assetId].amount = numbers.floatify(balances[assetId].amount + coin.amount, 10);
	    balances[assetId].usdAmount = numbers.floatify(balances[assetId].amount * settings.pulse[assetId].pulse.price, 10);
	    balances[assetId].wallets[coin.asset_id] = {
		amount: coin.amount
	    }
	    
	    //sum = numbers.floatify(sum + balances[assetId].btsAmount, 10);
	    usdSum = numbers.floatify(usdSum + coin.amount * settings.pulse[assetId].pulse.price, 10)
	    
	}
	
	/*settings.totalBalances = {
	    bts: sum,
	    btc: sum * rates.BTC,
	    usd: sum * rates.USD,
	    eur: sum * rates.EUR,
	    cny: sum * rates.CNY
	};*/

	settings.totalBalances = {
	    btc: numbers.floatify(usdSum / settings.pulse[1].pulse.price, 5),
	    usd: numbers.floatify(usdSum, 0)
	};

	settings.balances = balances;
	
	console.log('update balances end');
    }

    function renderBalances() {
	var i = 0;

	$('#coins-list').empty();

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
	    if (i++ >= 20) {
		break;
	    }

	    if (sortedAssets[0].amount > 0 && asset.amount == 0) {
		break;
	    }

	    var amount = numbers.shortenNumber(asset.amount);
	    var usdAmount = numbers.shortenNumber(asset.usdAmount);

	    var data = {
	        name: settings.assets[asset.id].name,
	        symbol: settings.assets[asset.id].symbol,
	        amount: amount,
	        'usd-amount': usdAmount || (amount > 0 ? 0 : 'V: ' + numbers.formatNumber(asset.volume24h))
	    };

	    var div = $('#coins-list-template > li').clone();

	    for (var k in data) {
		div.find('[data-' + k + ']').text(data[k]);
	    }

	    div.attr('data-modal-arg', asset.id);
	    div.addClass('c-' + asset.id);
	    
	    div.appendTo('#coins-list');
	}

	$('#balance-btc').text(settings.totalBalances.btc);
	$('#balance-usd').text(settings.totalBalances.usd);

    }


function isTouchDevice() {
  var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
  var mq = function(query) {
    return window.matchMedia(query).matches;
  }

  if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
    return true;
  }

  // include the 'heartz' as a way to have a non matching MQ to help terminate the join
  // https://git.io/vznFH
  var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
  return mq(query);
}