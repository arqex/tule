"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'views/collectionView',
	'views/mainView',
	'models/dispenser',
	'modules/alerts/alerts'
];

define(deps, function($,_,Backbone, CollectionViews, mainView, Dispenser, Alerts){
	var updateView = function(view, documents, pagination){
		view.pagination = pagination;
		view.createDocViews(documents);
		view.render();
	};

	var createQuery = function(type, query){
		var collection = Dispenser.getCollection(type),
			conditions = {}
		;

		if(query.clause){
			var clauses = [];
			if(_.isString(query.clause))
				clauses.push(query.clause);
			else
				clauses = query.clause;
			conditions['clause'] = clauses;
		}

		if(query.limit != null && query.skip != null){
			conditions['limit'] = query.limit;
			conditions['skip'] = query.skip;
		}				

		return conditions;
	};

	var getURLParam = function (name) {
		name = RegExp ('[?&]' + name.replace (/([[\]])/, '\\$1') + '=([^&#]*)');
		return (window.location.href.match (name) || ['', ''])[1];
	};

	var createPagination = function(type, current, limit, total, collection, view){
		var pagination = new CollectionViews.PaginationView({
			currentPage: Math.round(current),
			lastPage: Math.ceil(total / limit),
			limit: limit,
			skip: (current * limit) - limit
		});

		pagination.on('navigate', function(page){
			var clauses = getURLParam('clause%5B%5D');

			this.conditions = {
					skip: (page * limit) - limit,
					limit: limit,
					clause: decodeURI(clauses)
			}

			var	query = createQuery(type, this.conditions),
				me = this
			;

			collection.query(query).then(function(results, options){
				pagination.currentPage = page;
				pagination.distance = pagination.lastPage - page;
				pagination.lastPage = Math.ceil(results.get('total') / limit);
				pagination.render();

				var customUrl = "skip=" + me.conditions.skip + "&limit=" + me.conditions.limit;
				if(clauses)
					customUrl = customUrl + "&clause%5B%5D=" + clauses;

				Backbone.history.navigate("/collections/list/" + type + "?" + customUrl);
				updateView(view, results.get('documents'), pagination);
			});
		});

		return pagination;
	};

	var createSearchTools = function(type, view){
		var searchTools = new CollectionViews.SearchTools({
			type: type
		});
		return searchTools;
	};

	var createAdderView = function(type, results, settings){
		var newDocView = new CollectionViews.NewDocView({
			type: type,
			collection: results,
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

		return newDocView;
	};

	var createCollectionView = function(documents, fields, settings){
		var view = new CollectionViews.CollectionView({
			collection: documents,
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

		view.on('saveDoc', function(data){
			$.post('/api/collection/'+type, {
				type: type,
				data: data
			});
		});

		view.createDocViews(documents);

		return view;
	};


	return {
		list: function(type, page, query){			
			var collection = Dispenser.getCollection(type);
			var settingsPromise = collection.getSettings();

			// If there are conditions in the url execute the query
			if(query != undefined)
				query = createQuery(type, query);

			collection.query(query).then(function(results, options){
				settingsPromise.then(function(settings){
					// Primitive vars
					var fields 		= settings.tableFields || [],
						documents 	= results.get('documents'),
						total 		= results.get('total'),
						current		= results.get('current'),
						limit 		= results.get('limit')
					;

					// Set up fields
					fields.push({action: 'edit', href: "#", icon: 'pencil'});
					fields.push({action: 'remove', href: "#", icon: 'times'});

					// Complex vars
					var collectionView 	= createCollectionView(documents, fields, settings, type),
						pagination 		= createPagination(type, current, limit, total, collection, collectionView),
						searchTools 	= createSearchTools(type, collectionView),
						newDocView		= createAdderView(type, results, settings)						
					;


					// SuperView set up
					pagination.render();
					searchTools.render();
					newDocView.render();
					collectionView.render();


					// Create the SuperView
					var superView = new CollectionViews.SuperView({
						type: type,
						adderView: newDocView,
						searchView: searchTools,
						paginationView: pagination,
						collectionView: collectionView
					});

					superView.on('o', function(type){
						console.log(type);
					});

					// Render the set
					superView.render();
					mainView.loadView(superView);
					mainView.setTitle(type + ' collection');
				});
			});
		}
	};
});