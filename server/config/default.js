var path = require('path'),
	basepath = path.join(__dirname, '../..'),
	baseUrl = '/',
	dbName = 'tule'
;

module.exports = {
	tule: {
		baseUrl: baseUrl,
		settingsCollection: 'tuleSettings'
	},
	dbName: dbName,
	mongo: 'mongodb://localhost:27017/' + dbName,
	navigation: '',
	path: {
		base: basepath,
		'public': basepath + '/public',
		'server': basepath + '/server',
		'controllers': basepath + '/server/controllers',
		'views': basepath + '/server/views',
		'util': basepath + '/server/util',
		'plugins': basepath + '/server/plugins',
		'modules': basepath + '/server/modules'
	}
};