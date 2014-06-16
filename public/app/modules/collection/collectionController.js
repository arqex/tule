"use strict";

var deps = [
	'jquery', 'underscore', 'backbone', 'services',

	'./collectionViews',
	'text!./tpls/collectionControllerTpl.html',

	'modules/core/coreTools',
	'baseController',
	'pageController',

	'modules/alerts/alerts'
];

define(deps, function($,_,Backbone, Services, CollectionViews, tplController,
	Tools, BaseController, PageController, Alerts){

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

	var createAdderView = function(type, settings){
		var newDocView = new CollectionViews.NewDocView({
			type: type,
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
		template: $(tplController).find('#collectionControllerTpl').html(),

		regionSelectors: {
			adder: '.adderPlaceholder',
			search: '.searchPlaceholder',
			pagination: '.paginationPlaceholder',
			items: '.itemsPlaceholder'
		},

		events: {
			'click .js-document-new': 'openNewDocumentForm',
			'click .js-collection-search': 'openSearchTools'
		},

		init: function(opts){
			this.subViews = {};

			var me 	= this;

			this.type 				= opts.args[0];
			this.params				= opts.args[2] || {};
			this.settingsService 	= Services.get('settings');
			this.collectionService 	= Services.get('collection').collection(this.type);

			this.settingsService.get(this.type)
				.then(function(metadata){
					me.collectionSettings = metadata.toJSON();
					me.initViews();
				})
				.fail(function(error){
					me.collectionSettings = {allowCustom: true};
					me.initViews();
				})
			;
		},

		initViews: function(){
			var me = this;

			// If there are conditions in the url execute the query
			if(typeof me.params !== 'undefined')
				me.params = Tools.createQuery(me.type, me.params);

			me.collectionService.find(me.params).then(function(results, options){
				// Primitive vars
				var settings 	= me.collectionSettings,
					fields 		= settings.tableFields || [],
					documents 	= results.get('documents')
				;

				// Set up fields
				fields.push({action: 'edit', href: "#", icon: 'pencil'});
				fields.push({action: 'remove', href: "#", icon: 'times'});

				me.subViews = {
					adder: createAdderView(me.type, settings),
					search: createSearchTools(me.type),
					pagination: createPagination(results.get('current'), results.get('limit'), results.get('total')),
					items: createCollectionView(documents, fields, settings, me.type)
				};

				if(me.subViews.adder)
					me.runAdderListeners();
				if(me.subViews.search)
					me.runSearchListeners();
				if(me.subViews.pagination)
					me.runPaginationListeners();
				if(me.subViews.items)
					me.runItemsListeners();

				//Update page title
				me.trigger('page:title:update', 'Collection ' + me.type);

				_.each(me.subViews, function(view, name){
					me.regions[name].show(view);
				});
			});
		},

		openNewDocumentForm: function(e){
			e.preventDefault();
			var me = this,
				controls = this.$('.collectionControls')
			;

			this.subViews.adder.open();
			this.listenToOnce(this.subViews.adder, 'closed', function(){
				controls.show();
				me.regions.adder.$el.hide();
			});
			controls.hide();
			this.regions.adder.$el.show();
		},

		openSearchTools: function(e){
			e.preventDefault();
			var me = this,
				controls = this.$('.collectionControls')
			;

			this.subViews.search.open();
			this.listenToOnce(this.subViews.search, 'closed', function(){
				controls.show();
				me.regions.search.$el.show();
			});
			controls.hide();
			this.regions.search.$el.show();
		},

		runAdderListeners: function(){
			this.listenTo(this.subViews['adder'], 'createDoc', function(type, data){
				var me 	= this,
					doc = this.collectionService.getNew(type)
				;

				_.each(data, function(values, key){
					doc.set(key, values.value);
				});

				this.collectionService.save(doc).then(function(){
					Alerts.add({message:'Document saved correctly', autoclose:6000});
					doc.url = encodeURI('/api/docs/' + me.type + '/' + doc.id);

					// Reset the form on DOM
					me.subViews.adder.close();

					// Add possible new property definitions
					$.post('/api/collection/', {
						type: me.type,
						data: data
					});

					//Navigate to the last page
					me.navigate(me.subViews.pagination.lastPage);
					me.once('navigationEnd', function(){
						me.subViews.items.docViews[doc.id].open();
					});
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
			this.listenTo(this.subViews.pagination, 'navigate', this.navigate);
		},

		navigate: function(page){
			var pagination = this.subViews.pagination,
				limit 		= pagination.limit,
				conditions 	= this.params || {},
				query 		= {},
				me 			= this
			;

			page = (page > pagination.lastPage) ? pagination.lastPage	: page;

			conditions.skip  = (page * limit) - limit;
			conditions.limit = limit;

			query = Tools.createQuery(this.type, conditions);

			this.collectionService.find(this.params).then(function(results, options){
				pagination.currentPage 	= page;
				pagination.distance 		= pagination.lastPage - page;
				pagination.lastPage 		= Math.ceil(results.get('total') / limit);
				pagination.render();

				var customUrl = "skip=" + conditions.skip + "&limit=" + conditions.limit;
				if(query.clause){
					_.each(query.clause, function(clause){
						customUrl = customUrl + "&clause[]=" + clause;
					});
				}

				customUrl = encodeURI(customUrl);
				Backbone.history.navigate("/collections/list/" + me.type + "?" + customUrl);

				me.subViews.items.update(results.get('documents'));
				me.subViews.items.render();

				me.trigger('navigationEnd');
			});
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

			this.listenTo(this.subViews['items'], 'saveDoc', _.bind(this.saveDoc, this)); // End of saveDoc
		},

		deleteDoc: function(docId){

		},
		saveDoc: function(doc, docView){
			var me = this;
			//Save the doc
			this.collectionService.save(doc).then(function(){
				Alerts.add({message:'Document saved correctly'});
				//Refresh
				docView.render();

				me.updateCollectionFields(docView);
			});
		},

		/**
		 * Get the fields data to update the field definitions.
		 * @param  {Object} docView The document view
		 * @return {undefined{}
		 */
		updateCollectionFields: function(docView){
			var fieldData = {};
			_.each(docView.objectView.subViews, function(field){
				fieldData[field.key] = {
					key: field.key,
					label: field.label || field.key,
					datatype: field.datatype
				};
			});

			Services.get('settings').updateCollectionFields(this.type, fieldData);

			console.log(docView);
		}
	});


	return PageController.extend({
		title: 'Collection',
		contentView: CollectionController
	});
});
