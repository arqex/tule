// Config * Hack, this should be an enviroment variable
process.env.NODE_CONFIG_DIR = __dirname + '/server/config';
var config = require('config');
if(!config.mon.settingsCollection){
	console.error('\r\n*** There is not a collection name for the settings. ***');
	process.exit(1);
}

//Start express
var express = require('express');
var app = express();

//Start Mongo
app.db = require('mongojs')(config.mongo);
app.db.runCommand({ping:1}, function(err, res){
	//Die if mongo is not available
	if(err){
		console.error('\r\n*** Mongodb connection error ***');
		process.exit(1);
	}

	//Create the settings collection if it doesn't exist
	app.db.collection(config.mon.settingsCollection).findOne(function(err, result){
		if(err){
			var collectionName = config.mon.settingsCollection,
				settings = app.db.collection(collectionName);
			settings.insert({name: 'globals', value: {settingsCollection: collectionName}});
			settings.createIndex({name: 1}, {unique:true});
			console.log("Settings created: " + collectionName);
		}
	});
});

var http = require('http');
var server = http.createServer(app);
var _u = require('underscore');

app.use(express.static('public'), {maxAge: 0});
app.use(express.bodyParser());
app.use(express.methodOverride());

//Templates
var UTA = require('underscore-template-additions'),
	templates = new UTA()
;
app.set('views', config.path.views);
app.engine('html', templates.forExpress());

//Add routes
_u.each(config.routes, function(controllerData, routeData){
	var opts = controllerData.split('::'),
		routeOpts = routeData.split('::'),
		route = routeOpts.length == 2 ? routeOpts[1] : routeOpts[0],
		method = routeOpts.length == 2 ? routeOpts[0] : 'get',
		file = require(config.path.controllers + '/' + opts[0]),
		func = opts[1],
		controller = func ? file[func] : file
	;
	console.log(method + ' ' + opts[0] + ' ' + opts[1]);
	app[method](route, controller);
});

server.listen(3000);
console.log('Listening on port 3000');


