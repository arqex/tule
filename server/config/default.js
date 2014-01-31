var path = require('path'),
	basepath = path.join(__dirname, '../..'),
	monBaseUrl = '/',
	dbName = 'mongo_on_node'
;

module.exports = {
	mon: {
		baseUrl: monBaseUrl,
		settingsCollection: 'monSettings'
	},
	dbName: dbName,
	mongo: 'mongodb://localhost:27017/' + dbName,
	routes: require('./routes')(monBaseUrl),
	navigation: require('./navigation'),
	path: {
		base: basepath,
		'public': basepath + '/public',
		'server': basepath + '/server',
		'controllers': basepath + '/server/controllers',
		'views': basepath + '/server/views'
	}
};