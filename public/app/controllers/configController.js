"use strict";
var deps = [
	'jquery', 'underscore', 'backbone',
	'models/mdispenser',
	'views/collectionView',
	'views/mainView'
];

define(deps, function($,_,Backbone, Dispenser, Collection, mainView){
	return {
		main: function(type, page){
			var collections = Dispenser.getMCollectionList(),
				view
			;
			
			collections.fetch().then(function(){
				view = new Collection.CollectionView({
					collection: collections,
					fields: [
						'type',
						{action: 'browse', href:'#', icon:'eye'}						
					]
				});
				view.render();
				view.on('click:type', function(docView){
					docView.model.getSettings().then(function(){
						docView.open();
					});
				});
				view.on('click:browse', function(docView){
					Backbone.history.navigate('/collections/list/' + docView.model.get('type'), {trigger: true});
				});
				mainView.loadView(view);
				mainView.setTitle('Settings');				
			});

		}
	}
});