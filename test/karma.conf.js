// Karma configuration
// Generated on Thu Jan 05 2017 17:20:57 GMT+0000 (UTC)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      '../public/libs/jquery/jquery.min.js',
      
      '../public/libs/bootstrap/bootstrap.min.js',
      
      '../public/libs/socket.io/socket.io-1.4.5.js',
      
      '../public/libs/angular/angular.min.js',
      '../public/libs/angular-sanitize/angular-sanitize.min.js',
      '../public/libs/angular-route/angular-route.min.js',
      '../public/libs/angular-animate/angular-animate.min.js',
      '../public/libs/angular-ui-notification/angular-ui-notification.min.js',
      '../public/libs/angular-scrollbar/ng-scrollbar.min.js',
      
      '../public/libs/angular-mocks/angular-mocks.js',
      
      '../public/app/js/app.js',
      '../public/app/js/configs/*.js',
      '../public/app/js/directives/*.js',
      '../public/app/js/filters/*.js',
      '../public/app/js/services/*.js',
      '../public/app/js/controllers/*.js',
      'unit/*.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
