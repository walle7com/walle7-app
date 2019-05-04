var app = require('../app');

var {Apis} = require('bitsharesjs-ws');
var {ChainValidation, key} = require('bitsharesjs');


module.exports = function() {
	var accNameValid = false;
    
	var p = ("P" + key.get_random_key().toWif()).substr(0, 45);
	$('#signupPassword').val(p);

	$('.areaCopy').unbind('click.signup').bind('click.signup', function() {
	    copyPassword();

	    $('.areaCopy').addClass('active');
	    setTimeout(function() {
		$('.areaCopy').removeClass('active');
	    }, 2000);
	});

	$('.areaPaste').unbind('click.signup').bind('click.signup', function(e) {
	    copyPassword();

	    $('#signupPassword2').val($('#signupPassword').val());
	    $('#signupPassword2').removeClass('error');

	    $('.areaPaste').addClass('active');
	    setTimeout(function() {
		$('.areaPaste').removeClass('active');
	    }, 2000);
	});

	function copyPassword() {
	    /*try {
		var range = document.createRange();
		range.selectNode(document.getElementById('signupPassword'));
		window.getSelection().removeAllRanges();
		window.getSelection().addRange(range);
		document.execCommand('copy');
		window.getSelection().removeAllRanges();
	    } catch(e) {}*/

	    $('#signupPassword').focus();
	    $('#signupPassword').select();
	 
	    try {
	        document.execCommand('copy');
	    } catch (e) { }
	    
	    $('#signupPassword').blur();
	}

	$('#signupVerifyButton').unbind('click.signup').bind('click.signup', function() {
	    var formValid = accNameValid;
	    
	    if ($('#signupPassword').val() != $('#signupPassword2').val()) {
		formValid = false;
		$('#signupPassword2').addClass('error');
	    }
	    
	    if (!$('#signupAgreeFirst').is(':checked')) {
		formValid = false;
		$("label[for='signupAgreeFirst']").addClass('error');
	    }
	    
	    if (!$('#signupAgreeSecond').is(':checked')) {
		formValid = false;
		$("label[for='signupAgreeSecond']").addClass('error');
	    }
	
	    if (!formValid) {
		return;
	    }

	    $('#signupVerifyName').text($('#signupName').val());
	    $('#signupVerifyPassword').text($('#signupPassword').val());

	    app.changeView('view-show', 'screenSignupVerify');
	});

	$('#signupName').unbind('input.signup').bind('input.signup', async function(e) {
	    $('#screenSignup .placeholder').addClass('active');

            var accName = e.target.value.toLowerCase();
            accName = accName.match(/[a-z0-9\.-]+/);
            accName = accName ? accName[0] : null;

	    if (accName.indexOf('walle7-') !== 0) {
		accName = 'walle7-';
	    } 

	    $(this).val(accName);

	    var err = accName === ''
        	? ''
                : ChainValidation.is_account_name_error(accName);
            
            if (err) {
        	err = 'Invalid username!';
            }
            
            if (!err && !ChainValidation.is_cheap_name(accName)) {
        	//err = 'This is a premium name which is not supported by this faucet';
        	err = 'Already exists!';
            }

	    var r = await Apis.instance().db_api().exec("lookup_accounts", [accName, 50]);

	    let account = r.find(
		function(a) {
		    if (a[0] === accName) {
		        return true;
		    }
		    return false;
		}
	    );

	    if (account) {
		err = 'Already exists!';
	    }

	    if (err) {
		$('.formErrorText').text(err);
		$('.formErrorText').addClass('active');
		$('#signupName').addClass('error');
		    
		accNameValid = false;
	    } else {
		$('.formErrorText').removeClass('active');
		$('#signupName').removeClass('error');
		    
		accNameValid = true;
	    }
	});
	
	$('#signupPassword2').unbind('input.signup').bind('input.signup', function() {
	    if ($('#signupPassword').val() == $('#signupPassword2').val()) {
		$('#signupPassword2').removeClass('error');
	    }
	});
	
	$('#signupAgreeFirst, #signupAgreeSecond').unbind('click.signup').bind('click.signup', function() {
	    if ($(this).is(':checked')) {
		$("label[for='" + $(this).attr('id') + "']").removeClass('error');
	    }
	});

}