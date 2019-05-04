var settings = require('../utils/settings');
var app = require('../app');

var {Apis} = require('bitsharesjs-ws');


module.exports = function() {
	$('#signupCopyInfo').unbind('click.signupVerify').bind('click.signupVerify', function() {
	    try {
		var range = document.createRange();
		range.selectNode(document.getElementsByClassName('boardCopy')[0]);
		window.getSelection().removeAllRanges();
		window.getSelection().addRange(range);
		document.execCommand('copy');
		window.getSelection().removeAllRanges();
	    } catch(e) {}
	});
	
	$('#createAccount').unbind('click.signupVerify').bind('click.signupVerify', async function() {
	    // signup
	    var ownerPubkey = app.generateKeyFromPassword($('#signupName').val(), 'owner', $('#signupPassword').val()).pubKey;
	    var activePubkey = app.generateKeyFromPassword($('#signupName').val(), 'active', $('#signupPassword').val()).pubKey;
	    var memoPubkey = app.generateKeyFromPassword($('#signupName').val(), 'memo', $('#signupPassword').val()).pubKey;

	    var r = await $.ajax({
		url: 'https://walle7.com/api/account-create',
		contentType: 'application/json',
		type: 'POST',
		data: JSON.stringify({
		    account: {
			name: $('#signupName').val(),
			owner_key: ownerPubkey,
			active_key: activePubkey,
			memo_key: memoPubkey
		    }
		}),
		dataType: 'json'
	    });
	    console.log(r);

	    var acc = await Apis.instance().db_api().exec('get_account_by_name', [$('#signupName').val()]);
	    console.log(acc);

	    if (activePubkey == acc.active.key_auths[0][0]) {
		settings.user = {
		    id: acc.id,
		    name: acc.name,
		    password: $('#signupPassword').val()
		}

		$('#signupName').val('');
		$('#signupPassword').val('');
		$('#signupPassword2').val('');
		$('#signupVerifyName').text('');
		$('#signupVerifyPassword').text('');

	    	app.changeView('view-show', 'screenPin');
	    }
	});
}