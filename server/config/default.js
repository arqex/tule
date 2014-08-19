'use strict';

var path = require('path'),
	basepath = path.join(__dirname, '../..'),
	baseUrl = '/'
;

module.exports = {
	tule: {
		baseUrl: baseUrl,
		settingsCollection: 'tuleSettings',
		db: {
			driver: 'mongo',
			options: {
				url: 'mongodb://localhost:27017/tuleSettings'
			}
		}
	},

	db: {
		driver: 'mongo',
		options: {
			url: 'mongodb://localhost:27017/tule'
		}
	},

	portNumber: 3000,

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