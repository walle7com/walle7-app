var settings = require('../utils/settings');

module.exports = function(arg) {
	console.log(arg);
	if (!arg) {
	    return;
	}
	
	var trx = null;
	for (var op of settings.history) {
	    if (op.id == arg) {
		trx = op;
		break;
	    }
	}
	
	if (!trx) {
	    return;
	}
	
	console.log(trx);
	
	var data = {
	    'id': trx.id,
	    'date': new Date(trx.timestamp).toUTCString(),
	    'amount-sent': trx.pays.amount + ' ' + settings.assets[settings.wallets[trx.pays.assetId].assetId].symbol,
	    'amount-received': trx.receives.amount + ' ' + settings.assets[settings.wallets[trx.receives.assetId].assetId].symbol,
	    'fee': trx.fee ? trx.fee + ' ' + settings.assets[settings.wallets[trx.feeAssetId].assetId].symbol : 0,
	    'account-id': trx.accountId,
	    'order-id': trx.orderId,
	    'block': trx.blockNum,
	    'trx-in-block': trx.trxInBlock,
	    'virtual-op': trx.virtualOp
	};
	
	for (var k in data) {
	    $('#modalTransactionExchange [data-' + k + ']').text(data[k]);
	}
}