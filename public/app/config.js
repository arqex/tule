define(['jquery', 'underscore', 'backbone'], function($,_,Backbone){
	return {
		routes: {
			'(/)': 'modules/core/homeController#index',
			'collections/list/:id(/page/:page)': 'modules/collection/collectionController#controller',
			'config': 'modules/settings/settingsController#main',
			'plugins': 'modules/plugins/pluginController#main',
			'*path': 'modules/core/homeController#notfound'
		}
	};
});