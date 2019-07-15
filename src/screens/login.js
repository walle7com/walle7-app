var settings = require('../utils/settings');
var app = require('../app');

var {Apis} = require('bitsharesjs-ws');


module.exports = function() {
	$('#loginButton').unbind('click.login').bind('click.login', async function() {
	    $('#login-error').removeClass('active');
	    //$('#password-error').removeClass('active');

	    var r = await Apis.instance().db_api().exec('get_account_by_name', [$('#loginUsername').val()]);
		
	    if (!r) {
		$('#login-error').addClass('active');
	        return;
	    }

	    settings.user = {
		id: r.id,
		name: r.name
	    };
	    $('#loginUsername').val('');
	    app.changeView('view-show', 'screenPin');
	});
}