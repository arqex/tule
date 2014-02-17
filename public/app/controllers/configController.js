"use strict";
var deps = [
	'jquery', 'underscore', 'backbone',
	'models/mdispenser',
	'views/collectionView',
	'views/mainView'
];

define(deps, function($,_,Backbone, Dispenser, Collection, mainView){
	return {
		main: function(){
			var collections = Dispenser.getMCollectionList(),
				view
			;
			
			collections.fetch().then(function(){
				view = new Collection.CollectionView({
					collection: collections,
					fields: [
						'name',
						{action: 'browse', href:'#', icon:'eye'}						
					]
				});
				view.render();
				view.on('click:name', function(docView){
					docView.model.getSettings().then(function(){
						docView.open();
					});
				});
				view.on('click:browse', function(docView){
					Backbone.history.navigate('/collections/list/' + docView.model.get('name'), {trigger: true});
				});
				mainView.loadView(view);
				mainView.setTitle('Settings');				
			});

		}
	}
});