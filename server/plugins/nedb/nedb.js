var config = require('config'),
	hooks = require(config.path.modules + '/hooks/hooksManager')
;

module.exports = {
	init: function(){
		console.log('First tule plugin initialization ever!');
		config.nedb = {
			dataPath: __dirname + '/data'
		};

		hooks.addFilter('db:driverpath', function(){
			return __dirname + 'nedbDriver';
		}
	}
};