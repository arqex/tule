define(['jquery', 'underscore', 'backbone'], function($,_,Backbone){
	return {
		routes: {
			'(/)': 'modules/core/homeController',
			'collections/list/:id(/page/:page)': 'modules/collection/collectionController',
			'config': 'modules/settings/settingsController',
			'plugins': 'modules/plugins/pluginController',
			'*path': 'modules/core/homeController'
		}
	};
});