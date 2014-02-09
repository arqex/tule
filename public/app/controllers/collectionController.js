"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'views/collectionView',
	'views/mainView',
	'models/mdispenser'
];

define(deps, function($,_,Backbone, CollectionViews, mainView, Dispenser){
	return {
		list: function(type, page){
			var mcollection = Dispenser.getMCollection(type);

			mcollection.query({}).then(function(results, options){
				var view = new CollectionViews.CollectionView({
					collection: results,
					fields: [
						'message',
						{action: 'edit', href: "#", icon: 'pencil'},
						{action: 'remove', href: "#", icon: 'times'}
					]
				});
				view.on('click:edit', function(docView){
					docView.open();
				});
				view.on('click:remove', function(docView){
					if(confirm('Are you sure to delete this document?'))
						docView.model.destroy({
							wait: true,
							success: function(){
								console.log('Document deleted');
								//me.collection.trigger('destroy');
							},
							error: function(){
								console.log('Document NOT deleted');
							}
						});
					return false;
				});
				view.on('click:message', function(docView){
					docView.open();
				});
				view.render();
				mainView.loadView(view);
				mainView.setTitle(type + ' collection');
				console.log('controller loaded! ' + type);
			});
		}
	};
});