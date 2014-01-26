define(['jquery', 'underscore', 'backbone'], function($,_,Backbone){
	return {
		routes: {
			'(/)': 'homeController#index',
			'collections/list/:id(/page/:page)': 'collectionController#list',
			'config': 'configController#main',
			'*path': 'homeController#notfound'
		}
	}
});