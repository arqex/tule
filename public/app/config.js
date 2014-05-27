define(['jquery', 'underscore', 'backbone'], function($,_,Backbone){
	return {
		routes: {
			'(/)': 'modules/core/homeController',
			'collections/list/:id(/page/:page)': 'modules/collection/collectionController',
			'settings': 'modules/settings/settingsController',
			'settings/navigation': 'modules/settings/settingsNavigation',
			'settings/collections': 'modules/settings/settingsController',
			'settings/general': 'modules/settings/settingsGeneral',
			'plugins': 'modules/plugins/pluginController',
			'*path': 'modules/core/404Controller'
		}
	};
});