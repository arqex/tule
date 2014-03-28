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

//Start plugins
var pluginManager = require(config.path.modules + '/plugins/pluginManager.js');
pluginManager.init(app);
app.managers = {plugins: pluginManager};

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
		if(!result){
			var collectionName = config.mon.settingsCollection,
				settings = app.db.collection(collectionName)
			;
			settings.insert([
			{
				name: 'globals',
				value: {settingsCollection: collectionName},
				datatypes: ['array', 'boolean', 'float', 'integer', 'object', 'string'],
				datatypesPath: 'modules/datatypes/'
			},
			{
				name: 'navData',
				routes:[
					{text: 'Collection', url: '/collections/list/test'},
					{text: 'Config', url: '/config'},
					{text: 'Test', url: '', subItems:[
						{text: 'Sub Test A', url: '/test/subA'},
						{text: 'Sub Test B', url: '/test/subB'},
						{text: 'Sub Test C', url: '', subItems:[
							{text: 'Micro Test A', url: '/test/subC/microA'},
							{text: 'Micro Test B', url: '/test/subC/microB'}
						]}
					]}
				]
			}]);
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


//Init routes
var routeManager = require(config.path.modules + '/routes/routeManager.js');
routeManager.init(app);

server.listen(3000);
console.log('Listening on port 3000');