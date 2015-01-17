/* jshint node: true */
'use strict';

// Start the config object
var config = require('./server/modules/config/configManager');

if(!config.tule.settingsCollection){
	console.error('\r\n*** There is not a collection name for the settings. ***');
	process.exit(1);
}

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
	var dbManager = require(config.path.modules + '/db/dbManager.js');
	dbManager.init(app).then(function(){
		log.debug('DATABASE OK!');
		var http = require('http');
		var server = http.createServer(app);
		var _u = require('underscore');


		//Settings manager
		var settingsManager = require(config.path.modules + '/settings/settingsManager.js');
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
		return middlewareManager.init( app )
			.then( function(){

				//Init routes
				log.debug('Pre routes');
				var routeManager = require(config.path.modules + '/routes/routeManager.js');
				routeManager.init(app);
				log.debug('ROUTES OK!');

				server.listen( config.portNumber, config.ipAddress );
				log.info('Listening on port ' + config.portNumber);
			})
		;
	})
	.catch( function( err ){
		console.log( 'Error initializing DB');
		log.error( err.stack );
		throw err;
	});

}).catch(function(err){
	console.log( 'Error initializing PLUGINS');
	log.error( err.stack );
	throw err;
});
