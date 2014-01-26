var path = require('path'),
	basepath = path.join(__dirname, '../..'),
	monBaseUrl = '/'
;

module.exports = {
	mon: {
		baseUrl: monBaseUrl,
		settingsCollection: 'monSettings'
	},
	mongo: 'mongodb://localhost:27017/quinielo',
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