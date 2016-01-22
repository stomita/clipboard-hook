'use strict';

require('babel-core/register')({
  presets: ['es2015'],
  plugins: ['syntax-async-functions','transform-regenerator','espower']
});

require('babel-polyfill');

var port = process.env.PORT || 9000;

exports.config = {
  //
  onPrepare: function() {
    browser.ignoreSynchronization = true;
  },

  // location of your E2E test specs
  specs: [
    './test/*.spec.js'
  ],

  capabilities: {
    browserName: 'phantomjs',
    // browserName: 'chrome',
    'phantomjs.binary.path': require('phantomjs').path,
    'phantomjs.ghostdriver.cli.args': ['--loglevel=DEBUG']
  },

  // url where your app is running, relative URLs are prepending with this URL
  baseUrl: 'http://localhost:' + port + '/',

  // testing framework, jasmine is the default
  framework: 'mocha'
};
