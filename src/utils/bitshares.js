function allowedGateway(gateway) {
    return (
        [
            "OPEN",
            "RUDEX",
            "BRIDGE",
            "GDEX",
            "XBTSX",
            "SPARKDEX",
            "CITADEL"
        ].indexOf(gateway) >= 0
    );
}

const availableGateways = {
    OPEN: {
        id: "OPEN",
        name: "OPENLEDGER",
        //baseAPI: openledgerAPIs,
        isEnabled: allowedGateway("OPEN"),
        selected: false,
        options: {
            enabled: false,
            selected: false
        }
    },
    RUDEX: {
        id: "RUDEX",
        name: "RUDEX",
        //baseAPI: rudexAPIs,
        isEnabled: allowedGateway("RUDEX"),
        isSimple: true,
        selected: false,
        simpleAssetGateway: true,
        fixedMemo: {prepend: "dex:", append: ""},
        addressValidatorMethod: "POST",
        options: {
            enabled: false,
            selected: false
        }
    },
    SPARKDEX: {
        id: "SPARKDEX",
        name: "SPARKDEX",
        //baseAPI: bitsparkAPIs,
        isEnabled: allowedGateway("SPARKDEX"),
        selected: false,
        options: {
            enabled: false,
            selected: false
        }
    },
    BRIDGE: {
        id: "BRIDGE",
        name: "CRYPTO-BRIDGE",
        //baseAPI: cryptoBridgeAPIs,
        isEnabled: allowedGateway("BRIDGE"),
        selected: false,
        singleWallet: true, // Has no coresponging coinType == backingCoinType specific wallet
        addressValidatorAsset: true, // Address validator requires output_asset parameter
        useFullAssetName: true, // Adds <gateway>.<asset> to memo and address object
        intermediateAccount: "cryptobridge", // Fixed intermediateAccount
        options: {
            enabled: false,
            selected: false
        }
    },
    GDEX: {
        id: "GDEX",
        name: "GDEX",
        //baseAPI: gdex2APIs,
        isEnabled: allowedGateway("GDEX"),
        options: {
            enabled: false,
            selected: false
        }
    },
    XBTSX: {
        id: "XBTSX",
        name: "XBTSX",
        //baseAPI: xbtsxAPIs,
        isEnabled: allowedGateway("XBTSX"),
        isSimple: true,
        selected: false,
        simpleAssetGateway: false,
        addressValidatorMethod: "POST",
        options: {
            enabled: false,
            selected: false
        }
    },
    CITADEL: {
        id: "CITADEL",
        name: "CITADEL",
        //baseAPI: citadelAPIs,
        isEnabled: allowedGateway("CITADEL"),
        selected: false,
        assetWithdrawlAlias: {monero: "xmr"}, // if asset name doesn't equal to memo
        options: {
            enabled: false,
            selected: false
        }
    }
};

module.exports = {
    availableGateways: availableGateways,
    fetchCoins: fetchCoins,
    fetchCoinsSimple: fetchCoinsSimple,
    getDepositAddress: getDepositAddress,
    validateAddress: validateAddress,
    getIntermediateAccount: getIntermediateAccount
}

async function fetchCoins(gw) {
    var coins = await $.ajax({
	url: gw.BASE + gw.COINS_LIST,
	contentType: 'application/json',
	dataType: 'json'
    });

    var tradingPairs = await $.ajax({
	url: gw.BASE + gw.TRADING_PAIRS,
	contentType: 'application/json',
	dataType: 'json'
    });

    var wallets = await $.ajax({
	url: gw.BASE + gw.ACTIVE_WALLETS,
	contentType: 'application/json',
	dataType: 'json'
    });

    var backedCoins = getBackedCoins({
	allCoins: coins,
	tradingPairs: tradingPairs,
	backer: gw.ID
    }).filter(a => !!a.walletType);
    backedCoins.forEach(a => {
	a.isAvailable = wallets.indexOf(a.walletType) !== -1;
    });

    return backedCoins;
}

async function fetchCoinsSimple(gw) {
    var coins = await $.ajax({
	url: gw.BASE + gw.COINS_LIST,
	contentType: 'application/json',
	dataType: 'json'
    });

    coins.forEach(a => {
	a.isAvailable = true;
    });

    return coins;
}

function getBackedCoins({backer, allCoins, tradingPairs}) {
    let gatewayStatus = availableGateways[backer];
    let coins_by_type = {};

    // Backer has no coinType == backingCoinType but uses single wallet style
    if (!!gatewayStatus.singleWallet) {
        allCoins.forEach(
            coin_type => (coins_by_type[coin_type.backingCoinType] = coin_type)
        );
    }

    allCoins.forEach(
        coin_type => (coins_by_type[coin_type.coinType] = coin_type)
    );

    let allowed_outputs_by_input = {};
    tradingPairs.forEach(pair => {
        if (!allowed_outputs_by_input[pair.inputCoinType])
            allowed_outputs_by_input[pair.inputCoinType] = {};
        allowed_outputs_by_input[pair.inputCoinType][
            pair.outputCoinType
        ] = true;
    });

    let backedCoins = [];
    allCoins.forEach(inputCoin => {
        let outputCoin = coins_by_type[inputCoin.backingCoinType];
        if (
            inputCoin.walletSymbol.startsWith(backer + ".") &&
            inputCoin.backingCoinType &&
            outputCoin
        ) {
            let isDepositAllowed =
                allowed_outputs_by_input[inputCoin.backingCoinType] &&
                allowed_outputs_by_input[inputCoin.backingCoinType][
                    inputCoin.coinType
                ];
            let isWithdrawalAllowed =
                allowed_outputs_by_input[inputCoin.coinType] &&
                allowed_outputs_by_input[inputCoin.coinType][
                    inputCoin.backingCoinType
                ];

            backedCoins.push({
                name: outputCoin.name,
                intermediateAccount: !!gatewayStatus.intermediateAccount
                    ? gatewayStatus.intermediateAccount
                    : outputCoin.intermediateAccount,
                gateFee: outputCoin.gateFee || outputCoin.transactionFee,
                walletType: outputCoin.walletType,
                backingCoinType: !!gatewayStatus.singleWallet
                    ? inputCoin.backingCoinType.toUpperCase()
                    : outputCoin.walletSymbol,
                minAmount: outputCoin.minAmount || 0,
                maxAmount: outputCoin.maxAmount || 999999999,
                symbol: inputCoin.walletSymbol,
                supportsMemos: outputCoin.supportsOutputMemos,
                depositAllowed: isDepositAllowed,
                withdrawalAllowed: isWithdrawalAllowed
            });
        }
    });
    return backedCoins;
}

function getIntermediateAccount(coin, gw) {
    if (!coin) return undefined;
    else if (gw === "RUDEX") return coin.issuerId || coin.issuer;
    else return coin.intermediateAccount || coin.issuer;
}

async function getDepositAddress({walletType, inputCoinType, outputCoinType, outputAddress, gw}) {
    switch (gw.ID) {
	case 'RUDEX':
	    break;
	
	case 'XBTSX':
	    return getXbtsxDepositAddress({walletType, inputCoinType, outputCoinType, outputAddress, gw});
	
	default:
	    return getCommonDepositAddress({walletType, inputCoinType, outputCoinType, outputAddress, gw});
    }

}

async function getCommonDepositAddress({walletType, inputCoinType, outputCoinType, outputAddress, gw}) {
    return $.ajax({
	url: gw.BASE + '/simple-api/initiate-trade',
	contentType: 'application/json',
	type: 'POST',
	data: JSON.stringify({
	    inputCoinType: inputCoinType,
	    outputAddress: outputAddress,
	    outputCoinType: outputCoinType
	}),
	dataType: 'json'
    });
}

async function getXbtsxDepositAddress({walletType, inputCoinType, outputCoinType, outputAddress, gw}) {
    return $.ajax({
	url: gw.BASE + `/wallets/${walletType}/new-deposit-address`,
	contentType: 'application/json',
	type: 'POST',
	data: JSON.stringify({
	    inputCoinType: inputCoinType,
	    outputCoinType: outputCoinType,
	    outputAddress: outputAddress
	}),
	dataType: 'json'
    });
}

async function validateAddress({gw, walletType, address}) {
    switch (gw.ID) {
	case 'RUDEX':
	case 'XBTSX':
	    return _validateAddressSimple({
		url: gw.BASE,
		walletType: walletType,
		newAddress: address
	    });
	
	default:
	    return _validateAddress({
		url: gw.BASE,
		walletType: walletType,
		newAddress: address
	    });
    }
}

async function _validateAddressSimple({
    url,
    walletType,
    newAddress
}) {
    if (!newAddress) return new Promise(res => res());
    return fetch(url + "/wallets/" + walletType + "/check-address", {
        method: "post",
        headers: new Headers({
            Accept: "application/json",
            "Content-Type": "application/json"
        }),
        body: JSON.stringify({address: newAddress})
    })
        .then(reply => reply.json().then(json => json.isValid))
        .catch(err => {
            console.log("validate error:", err);
        });
}

async function _validateAddress({
    url,
    walletType,
    newAddress,
    output_coin_type = null,
    method = null
}) {
    if (!newAddress) return new Promise(res => res());

    if (!method || method == "GET") {
        url +=
            "/wallets/" +
            walletType +
            "/address-validator?address=" +
            encodeURIComponent(newAddress);
        if (output_coin_type) {
            url += "&outputCoinType=" + output_coin_type;
        }
        return fetch(url, {
            method: "get",
            headers: new Headers({
                Accept: "application/json",
                "Content-Type": "application/json"
            })
        })
            .then(reply => reply.json().then(json => json.isValid))
            .catch(err => {
                console.log("validate error:", err);
            });
    } else if (method == "POST") {
        return fetch(url + "/wallets/" + walletType + "/check-address", {
            method: "post",
            headers: new Headers({
                Accept: "application/json",
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({address: newAddress})
        })
            .then(reply => reply.json().then(json => json.isValid))
            .catch(err => {
                console.log("validate error:", err);
            });
    }
}