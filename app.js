// Config * Hack, this should be an enviroment variable
process.env.NODE_CONFIG_DIR = __dirname + '/server/config';

// define port through the terminal or environment variable
if (!process.env.PORT) process.env.PORT = process.argv[2] || 3000;

var config = require('config');
if(!config.mon.settingsCollection){
	console.error('\r\n*** There is not a collection name for the settings. ***');
	process.exit(1);
}

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
		console.log('DATABASE OK!');
		var http = require('http');
		var server = http.createServer(app);
		var _u = require('underscore');

		//Settings manager
		var settingsManager = require(config.path.modules + '/settings/settingsManager.js');
		settingsManager.init(app);
		console.log('SETTINGS OK!');

		//app.use(express.static('public'), {maxAge: 0});
		app.use(express.bodyParser());
		app.use(express.methodOverride());

		console.log(app.stack);

		//Templates
		var UTA = require('underscore-template-additions'),
			templates = new UTA()
		;
		app.set('views', config.path.views);
		app.engine('html', templates.forExpress());

		//Init routes
		console.log('Pre routes');
		var routeManager = require(config.path.modules + '/routes/routeManager.js');
		routeManager.init(app);
		console.log('ROUTES OK!');

		//Init frontend settings
		console.log('Pre frontend');
		var frontendManager = require(config.path.modules + '/frontend/frontendManager.js');
		frontendManager.init(app);
		console.log('FRONTEND OK!');

		server.listen(process.env.PORT);
		console.log('Listening on port ' + process.env.PORT);
	});

}).catch(function(err){
	throw err;
});
