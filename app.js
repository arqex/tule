/* jshint node: true */
'use strict';

// Config * Hack, this should be an enviroment variable
process.env.NODE_CONFIG_DIR = __dirname + '/server/config';
var config = require('config');
if(!config.tule.settingsCollection){
	console.error('\r\n*** There is not a collection name for the settings. ***');
	process.exit(1);
}

// Add common modules require to the config file
require( config.path.server + '/config/modules');

// Logger set up, after this all the files can require('wiston')
// directly to get the configured logger.
var log = require(config.path.server + '/config/logger');

//Start express
var express = require('express');
var app = express();

//Start plugins
var pluginManager = require(config.path.modules + '/plugins/pluginManager.js');

pluginManager.init(app).then(function(){
	app.managers = {plugins: pluginManager};

	//Start database
	var dbManager = config.require( 'db' );
	dbManager.init(app).then(function(){
		log.debug('DATABASE OK!');
		var http = require('http');
		var server = http.createServer(app);
		var _u = require('underscore');


		//Settings manager
		var settingsManager = config.require('settings');
		settingsManager.init(app);
		log.debug('SETTINGS OK!');

		//Templates
		var UTA = require('underscore-template-additions'),
			templates = new UTA()
		;
		app.set('views', config.path.views);
		app.engine('html', templates.forExpress());

		//Init frontend settings
		log.debug('Pre frontend');
		var frontendManager = require(config.path.modules + '/frontend/frontendManager.js');
		log.debug('Init frontend');
		frontendManager.init(app);
		log.debug('FRONTEND OK!');


		// Middleware
		var middlewareManager = require( config.path.modules + '/middleware/middlewareManager');
		middlewareManager.init( app )
			.then( function(){

				//Init routes
				log.debug('Pre routes');
				var routeManager = require(config.path.modules + '/routes/routeManager.js');
				routeManager.init(app);
				log.debug('ROUTES OK!');

				server.listen(config.portNumber);
				log.info('Listening on port ' + config.portNumber);
			})
		;
	})
	.catch( function( err ){
		log.error( err.stack );
		throw err;
	});

}).catch(function(err){
	log.error( err.stack );
	throw err;
});
