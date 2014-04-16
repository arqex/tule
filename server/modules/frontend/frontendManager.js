var config = require('config'),
	hooks = require(config.path.modules + '/hooks/hooksManager'),
	_ = require('underscore')
;

module.exports = {
	init: function(){
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