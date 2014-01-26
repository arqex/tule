"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'views/collectionView',
	'views/mainView',
	'models/mdispenser'
];

define(deps, function($,_,Backbone, CollectionView, mainView, Dispenser){
	return {
		list: function(type, page){
			var mcollection = Dispenser.getMCollection(type);

			mcollection.query({}).then(function(results, options){
				var view = new CollectionView({collection: results, mcollection: mcollection});
				view.render();
				mainView.loadView(view);
				mainView.setTitle(type + ' collection');
				console.log('controller loaded! ' + type);
			});
		}
	};
});