module.exports = function() {
    $('#sliderNextButton').unbind('click.slider').bind('click.slider', function() {
	slide('next');
    });

    var el = $('#screenOnboarding');
    el.on('touchstart', touchStart);
    el.on('touchend', swipeHandler, touchEnd);
    el.on('touchmove', touchMove);
    el.on('touchcancel', touchCancel);
}

function slide(dir) {
    switch (dir) {
	case 'left':
	    dir = 'next';
	    break;
	
	case 'right':
	    dir = 'prev';
	    break;
    }

    switch (dir) {
	case 'next':
	case 'prev':
	    if (!$('#slider .active')[dir]().length) {
		if (dir == 'next') {
		    $('#sliderSkipButton').click();
		}
		return;
	    }

	    $('#slider .active')
		.removeClass('active')
		[dir]()
		.addClass('active');

	    $('#screenOnboarding .footer .dots .active')
		.removeClass('active')
		[dir]()
		.addClass('active');

	    break;
    }

    
}

function swipeHandler(dir) {
    switch (dir) {
	case 'left':
	case 'right':
	    slide(dir);
	    break;
    }
}

var fingerCount = 0;
var startX = 0;
var startY = 0;
var curX = 0;
var curY = 0;
var deltaX = 0;
var deltaY = 0;
var horzDiff = 0;
var vertDiff = 0;
var minLength = 72;
var swipeLength = 0;
var swipeAngle = null;
var swipeDirection = null;


function touchStart(event, passedName) {
console.log('touchstart');
    //event.preventDefault();
    fingerCount = event.touches.length;
    if (fingerCount == 1) {
	startX = event.touches[0].pageX;
	startY = event.touches[0].pageY;
    } else {
	touchCancel(event);
    }
}

function touchMove(event) {
console.log('touchmove');
    //event.preventDefault();
    if (event.touches.length == 1) {
	curX = event.touches[0].pageX;
	curY = event.touches[0].pageY;
    } else {
	touchCancel(event);
    }
}

function touchEnd(event) {
console.log('touchend');
    //event.preventDefault();
    if (fingerCount == 1 && curX != 0) {
	swipeLength = Math.round(Math.sqrt(Math.pow(curX - startX,2) + Math.pow(curY - startY,2)));
	if (swipeLength >= minLength) {
	    caluculateAngle();
	    determineSwipeDirection();
	    if (event.data) {
		event.data(swipeDirection);
	    }
	    touchCancel(event);
	} else {
	    touchCancel(event);
	}
    } else {
	touchCancel(event);
    }
}

function touchCancel(event) {
    fingerCount = 0;
    startX = 0;
    startY = 0;
    curX = 0;
    curY = 0;
    deltaX = 0;
    deltaY = 0;
    horzDiff = 0;
    vertDiff = 0;
    swipeLength = 0;
    swipeAngle = null;
    swipeDirection = null;
}

function caluculateAngle() {
    var X = startX-curX;
    var Y = curY-startY;
    var Z = Math.round(Math.sqrt(Math.pow(X,2)+Math.pow(Y,2)));
    var r = Math.atan2(Y,X);
    swipeAngle = Math.round(r*180/Math.PI);
    if (swipeAngle < 0) {
	swipeAngle = 360 - Math.abs(swipeAngle);
    }
}

function determineSwipeDirection() {
    if ((swipeAngle <= 45) && (swipeAngle >= 0)) {
	swipeDirection = 'left';
    } else if ((swipeAngle <= 360) && (swipeAngle >= 315)) {
	swipeDirection = 'left';
    } else if ((swipeAngle >= 135) && (swipeAngle <= 225)) {
	swipeDirection = 'right';
    } else if ((swipeAngle > 45) && (swipeAngle < 135)) {
	swipeDirection = 'down';
    } else {
	swipeDirection = 'up';
    }
}

