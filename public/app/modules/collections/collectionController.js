var deps = [
	'jquery', 'underscore', 'backbone', 'services',

	'./collectionViews',
	'text!./tpls/collectionViews.html',

	'baseController',
	'pageController',

	'alerts',
	'events',

	'./collectionModels'
];

define(deps, function($,_,Backbone, Services, CollectionViews, tplSource, BaseController, PageController, Alerts, Events, Models){

	"use strict";

	var templates = BaseController.prototype.extractTemplates(tplSource),
		// Here we will store the collection service when it is ready
		collections
	;

	var CollectionController = BaseController.extend({
		template: templates.main(),

		regionSelectors: {
			create: '.createRegion',
			search: '.searchRegion',
			pagination: '.paginationRegion',
			items: '.itemsRegion',
			count: '.countRegion'
		},

		events: {
			'click .js-doc-create': 'openCreateDoc',
			'click .js-collection-search': 'openSearch'
		},

		init: function(options){
			var me = this;

			this.collectionName = options.args[0];
			this.params = options.args[2] || {};

			this.initCollectionSettings()
				.then(function(){

					// Now we are sure the collection service is ready,
					// store a shorcut in the collections object
					me.service = Services.get('collection').collection(me.collectionName);

					// Use the current url parameters to fetch first items
					me.service.find(location.search.replace('?', ''))
						.then(function(query){
							me.currentQuery = query;
							me.guessHeaderFields();
						})
						.fail(function(error, emptyQuery){
							me.currentQuery = emptyQuery;
						})
						.always(function(){

							// init the views
							me.initViews();
						})
					;

					$('.js-pagetitle').text('Collection ' + me.collectionName);
				})
			;

		},

		initCollectionSettings: function(){
			var me = this,
				deferred = $.Deferred()
			;
			Events.once('service:ready:collection', function(){
				Services.get('collection')
					.getStats(me.collectionName)
						.then(function(stats){
							me.collectionSettings = stats.settings;
							deferred.resolve();
						})
						.fail(function(error){
							console.log(error);

							//There has been an error, so we apply default settings
							me.collectionSettings = {customProperties: true, collectionName: me.collectionName};
							deferred.resolve();
						})
				;
			});

			return deferred.promise();
		},

		guessHeaderFields: function() {
			if(this.collectionSettings.headerFields)
				return;

			var headerFields = [],
				docs = this.currentQuery.results
			;

			if(! docs.length)
				return;

			var doc = docs.at(0);

			if(doc.get('title'))
				headerFields.push('title');
			else if(doc.get('name'))
				headerFields.push('name');

			this.collectionSettings.headerFields = headerFields;
		},

		initViews: function(){
			var me = this;

			this.subViews = {
				items: this.createCollectionView(),
				create: this.createCreateView(),
				pagination: this.createPaginationView(),
				search: this.createSearchView(),
				count: this.createCountView()
			};

			_.each(this.subViews, function(view, key){
				me.regions[key].show(view);
			});
		},

		createCollectionView: function() {
			var collection = new CollectionViews.CollectionView({
				collection: this.currentQuery.results,
				collectionSettings: this.collectionSettings
			});

			this.listenTo(collection, 'saveDocument', this.saveDocument);
			this.listenTo(collection, 'click:remove', this.deleteDocument);
			this.listenTo(collection, 'clickField', this.editDocument);

			return collection;
		},

		createCreateView: function() {
			var createView = new CollectionViews.CreateView({
				collectionSettings: this.collectionSettings
			});

			this.listenTo(createView, 'createDoc', this.createDocument);
			this.listenTo(createView, 'cancel', this.closeCreateDoc);

			return createView;
		},

		createPaginationView: function() {
			var query = this.currentQuery,
				paginationView = new CollectionViews.PaginationView({
					currentDoc: query.modifiers.skip,
					pageSize: query.modifiers.limit,
					count: query.documentCount
				})
			;

			this.listenTo(paginationView, 'goto', function(page){
				var data = paginationView.model.toJSON(),
					modifiers = this.currentQuery.modifiers
				;

				if(page < 1 || page > data.lastPage)
					return Alerts.add({message: 'Can\'t go to the page number ' + page, level: 'error'});
				if(page == data.currentPage)
					return;

				modifiers.skip = modifiers.limit * (page - 1);

				this.doQuery(this.currentQuery.query, modifiers);
			});

			return paginationView;
		},

		createSearchView: function() {
			var searchView = new CollectionViews.SearchView({query: this.currentQuery.query});

			this.listenTo(searchView, 'searchCancel', this.closeSearch);
			this.listenTo(searchView, 'searchOk', this.doQuery);

			return searchView;
		},

		createCountView: function() {
			var countView = new CollectionViews.DocumentCountView({
				search: !_.isEmpty(this.currentQuery.query),
				count: this.currentQuery.documentCount
			});

			return countView;
		},

		doQuery: function(query, modifiers) {
			var me = this;

			this.service.find(query, modifiers)
				.then(function(responseQuery) {
					var items = me.subViews.items;

					// Update query
					me.currentQuery = responseQuery;

					// Update items
					items.collection = responseQuery.results;
					items.resetSubViews();
					items.render();

					// Update pagination
					me.subViews.pagination.model.set({
						currentDoc: responseQuery.modifiers.skip,
						count: responseQuery.documentCount
					});

					// Update count
					me.subViews.count.model.set({
						search: !_.isEmpty(responseQuery.query),
						count: responseQuery.documentCount
					});

					Backbone.history.navigate(location.pathname + '?' + responseQuery.queryURL);
				})
				.fail(function(error) {
					Alerts.add({
						message: error,
						level: 'error'
					});
				})
			;
		},

		createDocument: function(doc, fieldDefinitions) {
			if(!_.keys(doc.attributes).length) {
				return Alerts.add({
					message: 'Can\'t create an empty document. Add one field at least.',
					level: 'error'
				});
			}

			var me = this;

			this.service.save(doc)
				.then(function() {
					var itemsView = me.subViews.items;

					me.subViews.create.reset();
					me.closeCreateDoc();

					// Add the doc to the items and show it
					itemsView.collection.add(doc, {at: 0});
					itemsView.resetSubViews();
					itemsView.render();

					// Open the brand new document
					itemsView.subViews[doc.id].edit();

					me.updateFieldDefinitions(fieldDefinitions);

					Alerts.add({
						message: 'Document created.',
						autoclose: 5000
					});
				})
			;
		},

		saveDocument: function(docView, fieldDefinitions) {
			var me = this;

			// Update the model
			docView.model.set(docView.objectView.model.get('value'));
			docView.render();

			// Save the model
			this.service.save(docView.model)
				.then(function(){
					Alerts.add({message: 'Saved successfully!', autoclose: 5000});
					me.updateFieldDefinitions(fieldDefinitions);
				})
				.fail(function(){
					Alerts.add({message: 'There was an error saving the document. Please, try again.', level: 'error'});
				})
			;
		},

		deleteDocument: function(docView) {
			var me = this,
				itemsView = me.subViews.items,
				doc = docView.model,
				dialog = Alerts.add({
					message: 'Are you sure to delete this document?',
					confirmButtons: {ok: 'Delete it', cancel: 'Don\'t do it'},
					level: 'warn'
				})
			;

			dialog.once('alertOk', function(){
				me.service.remove(doc)
					.then(function(){
						Alerts.add({message: 'Deleted successfully!', autoclose: 5000});

						// Reload current query to update the documents.
						me.service.find(location.search.replace('?', ''))
							.then(function(query){
								me.currentQuery = query;

								itemsView.collection = query.results;
								itemsView.resetSubViews();
								itemsView.render();
							})
							.fail(function(error, emptyQuery){
								// Oh an error! Just remove the document.
								itemsView.collection.remove(doc);
								itemsView.render(doc);
							})
						;
					})
					.fail(function(){
						Alerts.add({message: 'There was an error deleting the document. Please, try again.', level: 'error'});
					})
				;
			});
		},

		editDocument: function(docView, action) {
			if(action != 'remove')
				docView.edit();
		},

		openCreateDoc: function() {
			this.$('.js-collection-controls').hide();
			this.subViews.create.open();
		},

		closeCreateDoc: function() {
			this.$('.js-collection-controls').show();
			this.subViews.create.close();
		},

		openSearch: function(e) {
			if(e)
				e.preventDefault();

			this.$('.js-collection-controls').hide();
			this.subViews.search.open();
		},

		closeSearch: function() {
			this.$('.js-collection-controls').show();
			this.subViews.search.close();
		},

		updateFieldDefinitions: function(fieldDefinitions) {
			var currentDefinitions = this.collectionSettings.propertyDefinitions,
				// Mark for update if the settings are not already stored
				update = !this.collectionSettings._id,
				equalsKey = function(target) {
					return function(def) {
						return def.key == target.key;
					};
				},
				me = this
			;

			if(!currentDefinitions)
				currentDefinitions = (this.collectionSettings.propertyDefinitions = []);

			// Check every field and add the new ones.
			_.each(fieldDefinitions, function(targetDefinition){
				if(!_.find(currentDefinitions, equalsKey(targetDefinition))){
					currentDefinitions.push(targetDefinition);
					update = true;
				}
			});

			if(!update)
				return;

			// Update or create the settings depending on th
			var service = Services.get('collection'),
				method = this.collectionSettings._id ? 'updateSettings' : 'create'
			;

			// Be sure the collectionName is set
			this.collectionSettings.collectionName = this.collectionName;

			service[method](this.collectionName, this.collectionSettings)
				.then(function(storedSettings){
					me.collectionSettings = storedSettings;
					_.each(me.subViews, function(view){
						view.updateCollectionSettings(storedSettings);
					});
				})
			;
		},

		/**
		 * Method to test the collection service.
		 */
		testCollectionAPI: function() {
			var collectionName = 'CollectionServiceTest',
				service =  Services.get('collection'),
				definitions = 'yeah',
				updated = 'noooope'
			;

			setTimeout(function(){

				service.create(collectionName, {propertyDefinitions: definitions, collectionName: collectionName})
					.then(function(settings) {
						console.log('Collection created OK.');

						service.getStats(collectionName)
							.then(function(stats){
								var settings = stats.settings;
								console.log('Collection stats fetched.');

								if(stats.ok && settings && settings.propertyDefinitions == definitions){
									settings.propertyDefinitions = updated;
									service.updateSettings(collectionName, settings)
										.then(function() {
											console.log('Collection settings updated.');
											service.getStats(collectionName)
												.then(function(){
													if(stats.settings.propertyDefinitions == updated){
														console.log('After updating, settings ok.');

														service.drop(collectionName)
															.then(function(){
																console.log('Collection dropped.');

																service.getStats(collectionName)
																	.then(function(){
																		console.log('Error: We shouldn\'t get stats from a dropped collection.');
																	})
																	.fail(function(){
																		console.log('PERFECT!');
																	})
																;
															})
															.fail(function(error){
																console.log('Error dropping the collection: ' + error);
															})
														;
													}
													else {
														console.log('Unexpected settings after update.');
														console.log(stats);
													}
												})
												.fail(function(){
													console.log('Error fetching collection stats 2: ' + error);
												})
										})
										.fail(function(error) {
											console.log('Error updating collection settings: ' + error);
										})
									;
								}
								else {
									console.log('Unexpected settings after creation.');
									console.log(stats);
								}
							})
							.fail(function(error){
								console.log('Error fetching collection stats: ' + error);
							})
						;
					})
					.fail(function(error) {
						console.log('Error creating a collection: ' + error);
					})
				;

			}, 2000);
		},
	});


	return PageController.extend({
		title: 'Collection',
		contentView: CollectionController
	});
});
