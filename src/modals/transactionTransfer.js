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
	    id: trx.id,
	    date: new Date(trx.timestamp).toUTCString(),
	    amount: trx.amount + ' ' + settings.assets[settings.wallets[trx.assetId].assetId].symbol,
	    'op-type': trx.type == 0 ? 'sent': 'received',
	    fee: trx.fee ? trx.fee + ' ' + settings.assets[settings.wallets[trx.feeAssetId].assetId].symbol : 0,
	    from: trx.from,
	    to: trx.to,
	    block: trx.blockNum,
	    'trx-in-block': trx.trxInBlock,
	    'virtual-op': trx.virtualOp
	};
	
	for (var k in data) {
	    $('#modalTransactionTransfer [data-' + k + ']').text(data[k]);
	}
}