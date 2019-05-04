var settings = require('../utils/settings');
var app = require('../app');

var {Apis} = require('bitsharesjs-ws');


module.exports = function() {
	$('#loginButton').unbind('click.login').bind('click.login', async function() {
	    $('#login-error').removeClass('active');
	    $('#password-error').removeClass('active');

	    var r = await Apis.instance().db_api().exec('get_account_by_name', [$('#loginUsername').val()]);
		
	    if (!r) {
		$('#login-error').addClass('active');
	        return;
	    }

	    var k = app.generateKeyFromPassword($('#loginUsername').val(), 'active', $('#loginPassword').val());

	    if (k.pubKey == r.active.key_auths[0][0]) {
		settings.user = {
		    id: r.id,
		    name: r.name,
		    password: $('#loginPassword').val()
		};

		$('#loginUsername').val('');
		$('#loginPassword').val('');

	        app.changeView('view-show', 'screenPin');
	    } else {
		$('#password-error').addClass('active');
	    }
	});
}