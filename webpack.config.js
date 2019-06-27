const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin');


module.exports = {
    entry: {
	'bundle.css': [
	    path.resolve(__dirname, 'src/assets/css/fonts.css'),
	    path.resolve(__dirname, 'src/assets/css/load.css'),
	    path.resolve(__dirname, 'src/assets/css/core.css')
	],
	'bundle.js': [
	    '@babel/polyfill',
	    path.resolve(__dirname, 'src/init.js')
	],
    },

    output: {
	filename: '[name]',
	path: path.resolve(__dirname, 'dist'),
    },

    mode: 'development',
    devtool: 'inline-source-map',
    //mode: 'production',

    module: {
	rules: [{
	    test: /\.m?js$/,
	    exclude: /(node_modules)/,
	    use: {
		loader: 'babel-loader',
		options: {
		    presets: ['@babel/preset-env'],
		}
	    }
	}, {
	    test: /\.css$/,
	    use: ExtractTextPlugin.extract({
		fallback: 'style-loader',
		use: [{
		    loader: 'css-loader',
		    options: {
			url: false
		    }
		}]
	    })
	}]
    },
    plugins: [
	new ExtractTextPlugin('bundle.css'),
	new HtmlWebpackPlugin({
	    filename: 'index.html',
	    template: '!!ejs-webpack-loader!src/assets/html/index.html',
	    inject: false
	}),
	new CopyPlugin([{
	    from: 'src/assets/i',
	    to: 'i'
	}]),
    ]
}