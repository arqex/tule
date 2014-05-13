"use strict";

var deps = [
	'jquery', 'underscore', 'backbone', 'services',

	'./collectionViews',
	'./collectionModels',
	'text!./tpls/collectionControllerTpl.html',

	'modules/core/mainController',	
	'modules/core/coreTools',
	'modules/core/baseController',

	'modules/settings/settingsModels',
	'modules/alerts/alerts'
];

define(deps, function($,_,Backbone, Services, CollectionViews, CollectionModels, tplController, 
	mainController, Tools, BaseController, SettingsModels, Alerts){

	var createPagination = function(current, limit, total){
		var pagination = new CollectionViews.PaginationView({
			currentPage: Math.round(current),
			lastPage: Math.ceil(total / limit),
			limit: limit,
			skip: (current * limit) - limit
		});

		return pagination;
	};

	var createSearchTools = function(type){
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

		return newDocView; 
	};

	var createCollectionView = function(documents, fields, settings){
		var view = new CollectionViews.CollectionView({
			collection: documents,
			fields: fields,
			customFields: 1,
			docOptions: settings			
		});

		return view;
	};

	var CollectionController = BaseController.extend({
		controllerTpl: $(tplController).find('#collectionControllerTpl').html(),

		initialize: function(opts){
			this.subViews = {};
			this.regions = {};
			this.regionViews = {
				'.adderPlaceholder': 'adder',
				'.searchPlaceholder': 'search',
				'.paginationPlaceholder': 'pagination',
				'.itemsPlaceholder': 'items'
			};

			var me 	= this,
				deferred = $.Deferred()
			;	

			this.type 				= opts.args[0];
			this.params				= opts.args[2] || {};
			this.settingsService 	= Services.get('settings');
			this.collectionService 	= Services.get('collection').collection(this.type);
			this.querying 			= deferred.promise();

			this.settingsService.get(this.type).then(function(settings){
				// If there are conditions in the url execute the query
				if(me.params != undefined)
					me.params = Tools.createQuery(me.type, me.params);

				me.querying = me.collectionService.find(me.params).then(function(results, options){
					// Primitive vars
					var fields 		= settings.tableFields || [],
						documents 	= results.get('documents'),
						pagination 	= []
					;

					pagination.push(results.get('current'));
					pagination.push(results.get('limit'));
					pagination.push(results.get('total'));

					// Set up fields
					fields.push({action: 'edit', href: "#", icon: 'pencil'});
					fields.push({action: 'remove', href: "#", icon: 'times'});

					// Override
					me.tpl = me.controllerTpl;
					me.subViews['adder'] 		= createAdderView(me.type, results, settings);
					me.subViews['search'] 		= createSearchTools(me.type);
					me.subViews['pagination'] 	= createPagination(pagination[0], pagination[1], pagination[2]);
					me.subViews['items'] 		= createCollectionView(documents, fields, settings, me.type);
							
					if(me.subViews['adder'])
						me.runAdderListeners();
					if(me.subViews['search'])
						me.runSearchListeners();
					if(me.subViews['pagination'])
						me.runPaginationListeners();
					if(me.subViews['items'])
						me.runItemsListeners();

					me.querying = deferred.resolve();
				});
			});
		},

		runAdderListeners: function(){
			this.listenTo(this.subViews['adder'], 'createDoc', function(type, data){
				var me 	= this,
					doc = this.collectionService.getNew({type: type})
				;

				_.each(data, function(values, key){
					doc.set(key, values.value);
				});

				this.collectionService.save(doc).then(function(){
					Alerts.add({message:'Document saved correctly', autoclose:6000});	
					doc.url = encodeURI('/api/docs/' + me.type + '/' + doc.id);

					// Reset the form on DOM
					me.subViews['adder'].objectView = false;
					me.subViews['adder'].$el.find('.form').remove();
					me.subViews['adder'].close();

					// Add possible new property definitions
					$.post('/api/collection/' + me.type, {
						type: me.type,
						data: data
					});

					// Render collection view
					me.subViews['items'].collection.add(doc);
					me.subViews['pagination'].trigger('navigate', me.subViews['pagination'].lastPage);
				});
			}); // End of createDoc
		},

		runSearchListeners: function(){
			this.listenTo(this.subViews['search'], 'searchDoc', function(clauses){
				var me = this;
				this.params['clause'] = clauses;

				this.collectionService.find(this.params).then(function(results, options){
					var	customUrl 	= "",
						paramName 	= encodeURI("clause[]"),
						paramValue 	= ''
					;

					for(var i in clauses){
						paramValue = encodeURI(clauses[i]);
						customUrl += (paramName + "=" + paramValue);
						if(i < clauses.length - 1) 
							customUrl += "&";
					}

					Backbone.history.navigate("/collections/list/" + me.type + "?" + customUrl);

					me.subViews['pagination'].update(1, results.get('total'));
					me.subViews['items'].update(results.get('documents'));
					me.subViews['items'].render();
				});
			}); // End of searchDoc
		},

		runPaginationListeners: function(){
			this.listenTo(this.subViews['pagination'], 'navigate', function(page){
				var	limit 		= this.subViews['pagination'].limit,
					conditions 	= this.params || {},
					query 		= {},
					me 			= this
				;

				conditions.skip  = (page * limit) - limit;
				conditions.limit = limit;

				query = Tools.createQuery(this.type, conditions);

				this.collectionService.find(this.params).then(function(results, options){
					me.subViews['pagination'].currentPage 	= page;
					me.subViews['pagination'].distance 		= me.subViews['pagination'].lastPage - page;
					me.subViews['pagination'].lastPage 		= Math.ceil(results.get('total') / limit);
					me.subViews['pagination'].render();

					var customUrl = "skip=" + conditions.skip + "&limit=" + conditions.limit;
					if(query.clause){
						_.each(query.clause, function(clause){
							customUrl = customUrl + "&clause[]=" + clause;
						});						
					}

					customUrl = encodeURI(customUrl);
					Backbone.history.navigate("/collections/list/" + me.type + "?" + customUrl);
					
					me.subViews['items'].update(results.get('documents'));
					me.subViews['items'].render();
				});
			}); // Enf of navigate
		},

		runItemsListeners: function(){
			this.listenTo(this.subViews['items'], 'click:edit', function(docView){
				docView.open();
			}); // End of click edit

			this.listenTo(this.subViews['items'], 'click:remove', function(docView){
				var me = this;
				if(confirm('Are you sure to delete this document?'))
					docView.model.destroy({
						wait: true,
						success: function(){
							Alerts.alerter.add({message: 'Deletion completed', autoclose: 6000});
							me.subViews['items'].collection.remove(docView);
							me.subViews['pagination'].trigger('navigate', me.subViews['pagination'].currentPage);
						},
						error: function(){
							Alerts.alerter.add({message: 'There was an error deleting the document.', level: 'error'});
						}
					});
				return false;
			}); // End of click remove

			this.listenTo(this.subViews['items'], 'click:' + this.subViews['items'].fields[0], function(docView){
				docView.open();
			}); // End of click fields[0]

			this.listenTo(this.subViews['items'], 'saveDoc', function(data){
				$.post('/api/collection/'+this.type, {
					type: this.type,
					data: data
				});
			}); // End of saveDoc			
		}
	});


	return CollectionController;
});