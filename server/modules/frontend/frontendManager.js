var config = require('config'),
	_ = require('underscore')
;

module.exports = {
	init: function(app){
		console.log('FRONTSETTINGS');
		var hooks = app.hooks;
		hooks.addFilter('settings:front', function(settings){
			settings = _.extend(settings, {
				settingsCollection: 'monSettings',
				datatypes: ['array', 'boolean', 'float', 'integer', 'object', 'string', 'field', 'select'],
				datatypesPath: 'modules/datatypes/',
				routes:[
					{text: 'Collection', url: '/collections/list/test'},
					{text: 'Config', url: '/config'}
				]
			});
			return settings;
		});
	}
};