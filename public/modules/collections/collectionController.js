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

	'use strict';

	var templates = BaseController.prototype.extractTemplates(tplSource),
		// Here we will store the collection service when it is ready
		collections
	;

	/**
	 * Handles the client route /collection/list/:collectionName
	 *
	 * Allows to create/search/edit/delete documents.
	 */
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
			this.tuleSettings = options.tuleSettings;

			this.initCollectionSettings()
				.then(function(){

					// Now we are sure the collection service is ready,
					// store a shorcut in the collections object
					me.service = Services.get('collection').collection(me.collectionName);

					// Use the current url parameters to fetch first items
					me.service.find(location.search.replace('?', ''))
						.then(function(query){
							me.currentQuery = query;

							// Try to guess the fields for document headers,
							// in case they are not defined by the collection settings.
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

					// Create a shortcut for property definitions
					me.createPropertyDefinitions();

					$('.js-pagetitle').text('Collection ' + me.collectionName);
				})
			;

		},

		/**
		 * Fetches the collection settings from the server. If there are no settings
		 * for the collection, applies some defaults.
		 *
		 * @return {Promise} A promise to be resolved with the settings when fetched.
		 */
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

		/**
		 * If there are not headerFields defined in the collection settings, checks if a
		 * title or name attribute exists in the docs, and add it as header field.
		 *
		 * @return {undefined}
		 */
		guessHeaderFields: function() {
			var settings = this.collectionSettings,
				headerFields = [],
				headersClone = []
			;

			if( settings.headerFields && settings.headerFields.length ){
				headerFields = settings.headerFields;
			}
			else {
				var docs = this.currentQuery.results;

				if(! docs.length)
					return;

				var doc = docs.at(0);

				if(doc.get('title'))
					headerFields.push('title');
				else if(doc.get('name'))
					headerFields.push('name');
			}

			headersClone = headerFields.slice(0);


			Events.trigger( 'filter:collection:headerFields', headersClone, settings.collectionName );
			settings.headerFields = headersClone;
		},


		/**
		 * Creates a shortcut to the property definitions to fast access.
		 * @return {undefined}
		 */
		createPropertyDefinitions: function() {
			var me = this;

			//Let's make the property definitions quicky accesible
			this.propertyDefinitions = {};
			_.each(this.collectionSettings.propertyDefinitions, function(definition){
				me.propertyDefinitions[definition.key] = definition;
			});
		},

		/**
		 * Create all the sub views, add them to the subViews attribute and
		 * render them.
		 *
		 * @return {undefined}
		 */
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
				collectionSettings: this.collectionSettings,
				headerFields: this.getHeaderFields()
			});

			this.listenTo(collection, 'saveDocument', this.saveDocument);
			this.listenTo(collection, 'click:remove', this.deleteDocument);
			this.listenTo(collection, 'clickField', this.editDocument);

			// If we have only a document, open it
			if(collection.collection.length == 1)
				collection.subViews[collection.collection.at(0).id].edit();

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

			// Listen to the page clicks
			this.listenTo(paginationView, 'goto', function(page){
				var data = paginationView.model.toJSON(),
					modifiers = this.currentQuery.modifiers
				;

				// Check if the page is correct.
				if(page < 1 || page > data.lastPage)
					return Alerts.add({message: 'Can\'t go to the page number ' + page, level: 'error'});
				if(page == data.currentPage)
					return;

				// update the skip depending on the page
				modifiers.skip = modifiers.limit * (page - 1);

				this.doQuery(this.currentQuery.query, modifiers);
			});

			return paginationView;
		},

		createSearchView: function() {
			var searchView = new CollectionViews.SearchView({
				query: this.currentQuery.query,
				propertyDefinitions: this.propertyDefinitions,
				tuleSettings: this.tuleSettings
			});

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

		/**
		 * Create the header field list to show in the document's headers.
		 * It adds the edit and delete icons.
		 *
		 * @return {Array} The list of headers. The elements can be:
		 *                     * String: The name of the field in the document. The value of that
		 *                     		field will be shown in the header. The field name will be used
		 *                     		as action for the click event.
		 *                     * Object: An icon will be shown (font awesome), and the action attribute
		 *                     		will be used in the event triggered on click.
		 */
		getHeaderFields: function() {
			var headerFields = this.collectionSettings.headerFields;

			// If we don't have header fields, add the _id.
			if(!headerFields || !headerFields.length){
				headerFields = ['_id'];
			}

			return headerFields.concat([
				{action: 'edit', href: "#", icon: 'pencil'},
				{action: 'remove', href: "#", icon: 'times'}
			]);
		},

		/**
		 * Make a query to the server and updates the views with the results.
		 *
		 * @param  {Object} query     A MongoDB alike query.
		 * @param  {Object} modifiers Modifiers for the query. skip, limit and sort accepted.
		 * @return {Promise}          A promise to be resolved when the results are fetched.
		 */
		doQuery: function(query, modifiers) {
			var me = this;

			return this.service.find(query, modifiers)
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

		/**
		 * Save a new document in the server and update the views to show the new element.
		 * If new fields definition are created by the document, it updates the collection
		 * settings to have them too.
		 *
		 * @param  {Document} doc            The document object
		 * @param  {Object} fieldDefinitions Field definitions for the document.
		 * @return {Promise}          A promise to be resolved when the document is saved.
		 */
		createDocument: function(doc, fieldDefinitions) {
			if(!_.keys(doc.attributes).length) {
				return Alerts.add({
					message: 'Can\'t create an empty document. Add one field at least.',
					level: 'error'
				});
			}

			var me = this;

			return this.service.save(doc)
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

					me.updateFieldDefinitions(doc, fieldDefinitions);

					Alerts.add({
						message: 'Document created.',
						autoclose: 5000
					});

					// Update count
					me.currentQuery.documentCount++;
					me.subViews.count.model.set({count: me.currentQuery.documentCount});
				})
			;
		},

		/**
		 * Updates a document that is already in the views.
		 * If new fields definition are created by the document, it updates the collection
		 * settings to have them too.
		 *
		 * @param  {DocumentView} docView    The view of the document to be saved.
		 * @param  {Object} fieldDefinitions Field definitions for the document.
		 * @return {Promise}                 A promise to be resolved when the document is saved.
		 */
		saveDocument: function(docView, fieldDefinitions) {
			var me = this;

			// Update the model
			docView.model.set(docView.objectView.model.get('value'));
			docView.render();

			// Save the model
			return this.service.save(docView.model)
				.then(function(){
					Alerts.add({message: 'Saved successfully!', autoclose: 5000});
					me.updateFieldDefinitions(docView.model, fieldDefinitions);
				})
				.fail(function(){
					Alerts.add({message: 'There was an error saving the document. Please, try again.', level: 'error'});
				})
			;
		},

		/**
		 * Delete a document from the server updating the view, after user confirmation.
		 *
		 * @param  {DocumentView} docView    The view of the document to be deleted.
		 * @return {[type]}         [description]
		 */
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

			// Delete the document if user confirms
			dialog.once('alertOk', function(){
				me.service.remove(doc)
					.then(function(){
						Alerts.add({message: 'Deleted successfully!', autoclose: 5000});

						//Refresh the documents to show a complete page
						me.doQuery(me.currentQuery.query, me.currentQuery.modifiers);
					})
					.fail(function(){
						Alerts.add({message: 'There was an error deleting the document. Please, try again.', level: 'error'});
					})
				;
			});
		},

		/**
		 * Search the fieldDefinition object given for new definitions, not exisiting
		 * in the current collection settings. If found, it adds the new definition to the collection settings, and store them in
		 * the server. Also, updates the settings of all the subViews.
		 *
		 * @param  {Object} fieldDefinitions Field definition as stored in collection settings.
		 * @return {undefined}
		 */
		updateFieldDefinitions: function(model, fieldDefinitions) {
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

			// Check every field and add the new ones if they are in the model
			_.each(fieldDefinitions, function(targetDefinition){
				if(!_.find(currentDefinitions, equalsKey(targetDefinition)) && (typeof model.get(targetDefinition.key) != 'undefined') ){
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
						if(view.updateCollectionSettings)
							view.updateCollectionSettings(storedSettings);
					});
				})
			;
		},

		/**
		 * Handles CollectionView[clicField] event.
		 * When user clicks on edit a document, opens the document edition view.
		 *
		 * @param  {DocumentView} docView    	The view of the document clicked.
		 * @param  {String} action  				The action of the field clicked.
		 * @return {undefined}
		 */
		editDocument: function(docView, action) {
			if(action != 'remove')
				docView.edit();
		},

		/**
		 * Handles click on the Add new button.
		 * Opens the Create new document form.
		 *
		 * @param  {Event} e Click event
		 * @return {undefined}
		 */
		openCreateDoc: function(e) {
			if(e)
				e.preventDefault();

			this.$('.js-collection-controls').hide();
			this.subViews.create.open();
		},

		/**
		 * Handles CreateView[cancel] event.
		 * Closes the create new document form.
		 *
		 * @return {undefined}
		 */
		closeCreateDoc: function() {
			this.$('.js-collection-controls').show();
			this.subViews.create.close();
		},

		/**
		 * Handles click on the magnifying glass icon.
		 * Opens the search form.
		 *
		 * @param  {Event} e Click event
		 * @return {undefined}
		 */
		openSearch: function(e) {
			if(e)
				e.preventDefault();

			this.$('.js-collection-controls').hide();
			this.subViews.search.open();
		},

		/**
		 * Handles SearchView[cancel] event.
		 * Closes the search form.
		 *
		 * @return {undefined}
		 */
		closeSearch: function() {
			this.$('.js-collection-controls').show();
			this.subViews.search.close();
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
