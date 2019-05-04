# Walle7 Client

Walle7 is a cross-platform user interface based on BitShares Blockchain for Windows, macOS, Linux, iOS, Android, and Web. It gives an opportunity to keep, receive, send and exchange assets in simple and secure way.

[![Hosted Web Preview](https://walle7.com/git/0.png)](https://walle7.com/app/ "Hosted Web Preview")

A small and quick framework manage the application. It implements the functionality:

* Storing data with AES encryption in LocalStorage of browser or application.
* WebSocket Secure connection to BitShares nodes and gateways. Reconnecting on timeouts or other network problems.
* Automatic locking the wallet after 15 minutes of inactivity and showing Pin code screen.
* Templates for HTML and CSS.
* Manage touch actions on devices and correct frontend mapping on supported platforms.
* Formatting digits for convenient display.
* Background updates for transaction history and balances after successful exchange or withdraw.
* Modal display logic and application screen management.

To create this application, we used [BitsharesJS](https://github.com/bitshares/bitsharesjs/) to perform operations with nodes and [jQuery](https://github.com/jquery/jquery/) to modify DOM objects. Platform support is provided by [Cordova](https://cordova.apache.org/) and [Electron](https://electronjs.org/), with additional native components. 

## Requirements for all builds

All builds require [npm](https://docs.npmjs.com/cli/install), in addition to other per-platform requirements. If you want to create desktop and mobile apps then after building the Web app copy files from the dist folder to cordova/www and electron/www

## Building the Web app

To build for web, run:

    npm run build

It will generate project files in dist directory. Just open index.html after it to run Walle7.

## Building the Android app

Additional requirements for Android:

* Android Studio
* Android SDK 23+

To build for android, run from cordova dist:

    cordova build android

Cordova will generate a new Android project in the platforms/android directory. Install the built apk by platforms/android/build/outputs/apk/app-debug.apk

## Apple iOS and macOS

Additional requirements for Apple:

* An Apple Developer Account.
* XCode 10+ ([download](https://developer.apple.com/xcode/))
* XCode command line tools

To build for iOS, run from cordova dist:

    cordova build ios

Cordova will generate a new iOS project in the platforms/ios directory. Open Walle7.xcworkspace in XCode to transfer the build to the device.

To build for macOS, run from electron dist:

    npx electron-builder --mac

Electron framework will generate unpacked app, dmg and zip files in dist directory.

## Windows

To build for Windows, run from electron dist:

    npx electron-builder --win

Electron framework will generate unpacked app and setup exe files in dist directory.

## Linux

To build for Linux, run from electron dist:

    npx electron-builder --linux

Electron framework will generate unpacked app and AppImage files in dist directory.

## Development plans
We are ready to adjust the vector of development of the application according to the ideas and suggestions of the community. The necessary things to make the application better:

* Perform safety analysis of data storage to increase security.
* Generate nicknames for more privacy, and use the backup phrase instead of a password on signup. Add multiple account management.
* Integrate more coins to the wallet including BitShares UIA and stable coins. Put assets info in a separate repository, so any contributor can add a new currency, recheck data and then pack it into the application update file.
* Add the ability to transfer any supported assets between users inside BitShares network.
* Add QR code scan for faster withdraw and the verification of the output address. Write an explanation of how the user can withdraw funds if the gateway is under maintenance.
* Improve exchange to the most profitable ways: AssetToSell → LowRateAsset1 → LowRateAsset2 → AssetToBuy.
* Integrate Coingecko and other exchange aggregators to show more accurate weighted average rates and maintain the relevance of information about coins popularity.
* Improve the English language in the interface with copywriters. Write the hint system with an explanation of how the app and BitShares network works.
* Legal support for creating an AppStore account, Google Play and code signing, as well as Terms of Use and other agreements.
* Logo for the project, branding guidelines, and illustrations.
* UI/UX designer for making an app more comfortable for using and a motion designer for animations.
* Optimize workflows, such as organizing tasks in Kanban using the Discord bot. Make the design process clear for all community: exporting from Sketch to Figma and further images preparation to all screen sizes of user devices.


## Code of Conduct
This repository has a [Code of Conduct](CODE_OF_CONDUCT.md) that should be followed by everyone.

## Contact us

Feel free to email us at [pub@walle7.com](mailto:pub@walle7.com) or better yet, [join our chat](https://walle7.com/chat/).

## License

Licensed under the [Mozilla Public License v2.0](LICENSE.md)