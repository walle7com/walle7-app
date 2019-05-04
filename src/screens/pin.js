var settings = require('../utils/settings');
var app = require('../app');


module.exports = function() {
	var state = '';
	var enterCode = '';
        var firstPin;

	if (typeof localStorage['userData'] != 'undefined') {
	    setState('input', '&nbsp;');
	} else {
	    setState('create', 'Create a Pin code');
	}

	function setState(s, text) {
	    state = s;
	    enterCode = '';
	    $('.pincodeBox p').html(text);
	    $('.numberfields a').removeClass('active');
	}

	$('.clean').unbind('click.pin').bind('click.pin', function() {
	    if (!enterCode.length) {
		return;
	    }

	    enterCode = enterCode.slice(0, -1);
	    $('.numberfields a:eq(' + enterCode.length + ')').removeClass('active');
	});

	$('.numbers .digit').unbind('touchstart.pin click.pin').bind('touchstart.pin click.pin', function(e) {
	    e.stopPropagation();
	    e.preventDefault();

	    digitClickHandler($(this).text().toString());
	});

	function digitClickHandler(value) {
	    var clickedNumber = value;
	    enterCode = enterCode + clickedNumber;
	    var lengthCode = parseInt(enterCode.length);
	    lengthCode--;
	    $('.numberfields a:eq(' + lengthCode + ')').addClass('active');

	    if (lengthCode == 3) {
		switch (state) {
		    case 'input':
			if (settings.load(enterCode)) {
			    app.changeView('view-show', 'screenApp');
			} else {
			    setState('input', 'Wrong Pin, try again');
			    $('.numberfields').addClass('miss');
			    setTimeout(function() {
				$('.numberfields').removeClass('miss');
			    }, 500);

			}
			break;
		
		    case 'create':
			firstPin = enterCode;
			setState('create-repeat', 'Repeat a Pin code');
			break;
		
		    case 'create-repeat':
			if (firstPin != enterCode) {
			    // Wrong PIN!
			    $('.numberfields').addClass('miss');
			    enterCode = '';
			    setTimeout(function() {
				$('.numberfields a').removeClass('active');
			    }, 200);
			    setTimeout(function() {
				$('.numberfields').removeClass('miss');
			    }, 500);
			    setState('create', 'Pin codes do not match, try again');
			} else {
			    settings.pin = enterCode;
			    settings.save();

			    app.changeView('view-show', 'screenApp');
			}
			break;
		}
	    }
	}

	$('#pinShowLogin').unbind('click.pin').bind('click.pin', function() {
	    settings.reset();
	    app.changeView('view-show', 'screenLogin');
	});
}