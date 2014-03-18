define(['jquery', 'underscore', 'backbone'], function($,_,Backbone){
	return {
		routes: {
			'(/)': 'homeController#index',
			'collections/list/:id(/page/:page)': 'collectionController#list',
			'config': 'configController#main',
			'plugins': 'pluginController#main',
			'*path': 'homeController#notfound'
		}
	};
});