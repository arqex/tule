"use strict";
var deps = [
	'jquery', 'underscore', 'backbone',
	'models/mdispenser',
	'views/configView',
	'views/mainView'
];

define(deps, function($,_,Backbone, Dispenser, ConfigView, mainView){
	return {
		main: function(type, page){
			var collections = Dispenser.getMCollectionList(),
				view = new ConfigView({collection: collections})
			;
			
			collections.fetch().then(function(){
				view.render();
				mainView.loadView(view);
				mainView.setTitle('Settings');				
			});

		}
	}
});