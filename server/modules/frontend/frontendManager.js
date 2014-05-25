var config 	= require('config'),
	hooks 	= require(config.path.modules + '/hooks/hooksManager'),
	_ 		= require('underscore'),
	db 		= require(config.path.modules + '/db/dbManager').getInstance(),
	navData = 0
;

db.collection(config.mon.settingsCollection).findOne({name:'navData'}, function(err, settings){
	navData = settings;
});

module.exports = {
	init: function(app){
		console.log('FRONTSETTINGS');
		var hooks = app.hooks;
		hooks.addFilter('settings:front', function(settings){
			settings = _.extend(settings, {
				settingsCollection: 'monSettings',
				datatypes: ['array', 'boolean', 'float', 'integer', 'object', 'string', 'field', 'select'],
				datatypesPath: 'modules/datatypes/',
				routes: navData.routes
			});
			return settings;
		});
	}
};