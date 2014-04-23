"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'views/collectionView',
	'views/mainView',
	'models/dispenser',
	'modules/alerts/alerts'
];

define(deps, function($,_,Backbone, CollectionViews, mainView, Dispenser, Alerts){
	return {
		list: function(type, page, query){
			var collection = Dispenser.getCollection(type);
			var settingsPromise = collection.getSettings();

			collection.query({}).then(function(results, options){
				settingsPromise.then(function(settings){

					var fields 		= settings.tableFields || [],
						documents 	= results.get('documents'),
						total 		= results.get('total'),
						current		= results.get('current'),
						limit 		= results.get('limit')
					;

					fields.push({action: 'edit', href: "#", icon: 'pencil'});
					fields.push({action: 'remove', href: "#", icon: 'times'});

					var searchTools = new CollectionViews.SearchTools({
						type: type
					});

					if(query != undefined){
						var collection = Dispenser.getCollection(type);
						var clauses = [];
						if(_.isString(query.clause))
							clauses.push(query.clause);
						else
							clauses = query.clause;

						collection.query({clause: clauses}).then(function(results){
							view.createDocViews(results);
							view.render();
						});
					}

					searchTools.on('searchDoc', function(clauses){
						var collection = Dispenser.getCollection(type);

						collection.query({clause: clauses}).then(function(results){
							var	customUrl = "",
								paramName = encodeURI("clause[]"),
								paramValue = ''
							;

							for(var i in clauses){
								paramValue = encodeURI(clauses[i]);
								customUrl += (paramName + "=" + paramValue + "&");
							}

							Backbone.history.navigate("/collections/list/" + type + "?" + customUrl);

							view.createDocViews(results);
							view.render();
						});
					});

					var pagination = new CollectionViews.PaginationView({
						currentPage: Math.round(current),
						lastPage: Math.round(total / limit)
					});

					pagination.render();

					var view = new CollectionViews.CollectionView({
						collection: documents,
						fields: fields,
						customFields: 1,
						docOptions: settings,
						paginationView: pagination
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

					view.on('saveDoc', function(data){
						$.post('/api/collection/'+type, {
							type: type,
							data: data
						});
					});

					view.createDocViews(documents);
					view.render();

					var newDocView = new CollectionViews.NewDocView({
						type: type,
						collection: results,
						collectionView: view,
						searchTools: searchTools,
						settings: settings
					});

					newDocView.on('createDoc', function(type, data){
						var me = this,
							doc = Dispenser.getDoc(type)
						;

						_.each(data, function(values, key){
							doc.set(key, values.value);
						});

						doc.save(null, {success: function(){
							Alerts.add({message:'Document saved correctly', autoclose:6000});	
							doc.url = encodeURI('/api/docs/' + me.type + '/' + doc.id);

							// Reset the form on DOM
							me.objectView = false;
							me.$el.find('.form').remove();
							me.close();

							// Add possible new property definitions
							$.post('/api/collection/'+me.type, {
								type: me.type,
								data: data
							});

							// Render collection view
							me.collection.add(doc);
							me.collectionView.createDocViews();
							me.collectionView.render();
						}});
					});

					newDocView.render();
					mainView.loadView(newDocView);
					mainView.setTitle(type + ' collection');
				});
			});

		}
	};
});