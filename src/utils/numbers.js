module.exports = {
    floatify: floatify,
    shortenNumber: shortenNumber,
    toFixed: toFixed,
    formatNumber: formatNumber,
    toFixedTrunc: toFixedTrunc
}

function floatify(number, d){
    return parseFloat((number).toFixed(d));
}

function shortenNumber(n) {
    n = floatify(n, 10);

    if (n > 1) {
	return floatify(n, 2).toString();
    }

    if (n >= 0.00001) {
	return floatify(n, 5).toString();
    }

    var r = toFixed(n).toString().split('.');
    if (r.length == 2 && r[1].length > 5) {
	var r2 = r[1].split('');
	r2.splice(r2.length - 1 - (r2.length - 4), r2.length - 4, '...');
	return r[0] + '.' + r2.join('');
    } else {
	return n;
    }
}

function toFixed(x) {
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.toString().split('e-')[1]);
    if (e) {
        x *= Math.pow(10,e-1);
        x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
    }
  } else {
    var e = parseInt(x.toString().split('+')[1]);
    if (e > 20) {
        e -= 20;
        x /= Math.pow(10,e);
        x += (new Array(e+1)).join('0');
    }
  }
  return x;
}

function toFixedTrunc(value, n) {
  const v = value.toString().split('.');
  if (n <= 0) return v[0];
  let f = v[1] || '';
  if (f.length > n) return `${v[0]}.${f.substr(0,n)}`;
  while (f.length < n) f += '0';
  return parseFloat(`${v[0]}.${f}`)
}

function formatNumber(num) {
    var numNames = ['K', 'M', 'B'];
    var numName = '';
    var i = 0;
    while (num > 1000) {
	num /= 1000;
	numName = numNames[i++];
    }
    num = num.toFixed(2);
    return num + ' ' + numName;
}