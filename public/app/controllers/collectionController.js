"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'views/collectionView',
	'views/mainView',
	'models/mdispenser',
	'modules/alerts/alerts'
];

define(deps, function($,_,Backbone, CollectionViews, mainView, Dispenser, Alerts){
	return {
		list: function(type, page){
			var mcollection = Dispenser.getMCollection(type);
			var settingsPromise = mcollection.getSettings();

			mcollection.query({}).then(function(results, options){
				settingsPromise.then(function(settings){
					var fields = settings.tableFields || [];
					fields.push({action: 'edit', href: "#", icon: 'pencil'});
					fields.push({action: 'remove', href: "#", icon: 'times'});

					var view = new CollectionViews.CollectionView({
						collection: results,
						fields: fields,
						customFields: 1,
						docOptions: settings
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
									Alerts.alerter.add({message: 'Deletion completed', autoclose: 6000});
								},
								error: function(){
									console.log('Document NOT deleted');
									Alerts.alerter.add({message: 'There was an error deleting the document.', level: 'error'});
								}
							});
						return false;
					});
					
					view.on('click:' + fields[0], function(docView){
						docView.open();
					});

					view.render();

					var newDocView = new CollectionViews.NewDocView({
						type: type,
						collection: results,					
						collectionView: view,
						settings: settings
					});
							
					newDocView.render();
					mainView.loadView(newDocView);
					mainView.setTitle(type + ' collection');					
				});
			});

		}
	};
});