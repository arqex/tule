var deps = [
	'jquery', 'underscore', 'backbone', 'services',

	'baseController',
	'pageController',

	'alerts',
	'events',

	'modules/collections/collectionViews',
	'text!./tpls/tuleSettings.html'
];

define(deps, function($,_,Backbone, Services, BaseController, PageController, Alerts, Events, CollectionViews, tplSources) {
	'use strict';

	var templates = BaseController.prototype.extractTemplates(tplSources);

	/**
	 * Handles the client route /settings/collections
	 *
	 * Allows to create/edit/delete collections.
	 */
	var CollectionSettingsController = BaseController.extend({
		template: templates.collectionSettings(),

		regionSelectors: {
			create: '.createRegion',
			items: '.itemsRegion',
			count: '.countRegion'
		},

		events: {
			'click .js-doc-create': 'openCreateCollection'
		},

		/**
		 * Initialize the controller.
		 */
		init: function(){
			var me = this;

			// Fetch the collection names and initialize the views.
			this.getCollectionNames()
				.then(function(collections){

					// Store the collections
					collections.sort();
					me.collectionNames = collections;

					me.initViews();
				})
				.fail(function(err){
					console.log(err);
					Alerts.add({
						message: 'There was an error getting the collection list. Please retry.',
						level: 'error'
					});
				})
			;
		},

		/**
		 * Fetches the all the collection names and
		 * @return {Promise} Promise to be resolved once the collection names are ready.
		 */
		getCollectionNames: function() {
			var me = this,
				deferred = $.Deferred();

			// Once the collection service is ready
			Events.once('service:ready:collection', function(){
				me.service = Services.get('collection');

				me.service.getCollectionList()
					.then(function(collections){
						deferred.resolve(collections);
					})
					.fail(function(err){
						deferred.reject(err);
					})
				;
			});

			return deferred.promise();
		},

		/**
		 * Create all the views and render them.
		 */
		initViews: function() {
			var me = this;

			this.subViews = {
				items: this.createItemsView(),
				create: this.createCreateView(),
				count: this.createCountView()
			};

			// Show the views in the regions
			_.each(this.subViews, function(view, key){
				me.regions[key].show(view);
			});
		},

		/**
		 * Creates the collection list view and bind its events.
		 *
		 * @return {CollectionView} The view.
		 */
		createItemsView: function() {
			var namesCollection = new Backbone.Collection(
					this.collectionNames.map(function(name){ return {_id: name, collectionName: name}; })
				),
				itemsView = new CollectionViews.CollectionView({
					collection: namesCollection,
					headerFields: [
						'collectionName',
						{action: 'browse', href: '#', icon: 'eye'},
						{action: 'edit', href: '#', icon: 'pencil'},
						{action: 'remove', href: '#', icon: 'times'}
					],
					collectionSettings: {
						customProperties: false,
						hiddenProperties: ['_id', 'name', 'collectionName'],
						propertyDefinitions: this.getDefinitions()
					}
				})
			;

			// listen to the events
			this.listenTo(itemsView, 'saveDocument', this.saveCollection);
			this.listenTo(itemsView, 'click:browse', this.browseCollection);
			this.listenTo(itemsView, 'click:remove', this.removeCollection);
			this.listenTo(itemsView, 'clickField', this.editCollection);

			return itemsView;
		},

		/**
		 * Create the New collection view and bind its events.
		 * @return {CreateView} The view.
		 */
		createCreateView: function() {
			var createView = new CollectionViews.CreateView({
				collectionSettings: {
					propertyDefinitions: [{key: 'collectionName', label: 'Collection name', datatype: {id: 'string', options: {}} }],
					mandatoryProperties: ['collectionName'],
					customProperties: false
				},
				title: 'Create collection'
			});

			// listen to the events
			this.listenTo(createView, 'createDoc', this.createCollection);
			this.listenTo(createView, 'cancel', this.closeCreateCollection);

			return createView;
		},

		/**
		 * Create the count view and bind its events.
		 *
		 * @return {DocumentCountView} The view.
		 */
		createCountView: function() {
			var countView = new CollectionViews.DocumentCountView({
				count: this.collectionNames.length,
				documentName: 'collection'
			});

			return countView;
		},

		/**
		 * Handles click on the Add new button.
		 * Opens the Create new document form.
		 *
		 * @param  {Event} e Click event
		 * @return {undefined}
		 */
		openCreateCollection: function(e) {
			if(e)
				e.preventDefault();

			this.$('.js-collection-controls').hide();
			this.subViews.create.open();
		},

		/**
		 * Handles CreateView:cancel event.
		 * Closes the create new document form.
		 *
		 * @return {undefined}
		 */
		closeCreateCollection: function() {
			this.$('.js-collection-controls').show();
			this.subViews.create.close();
		},

		/**
		 * Handles the CreateView:createDoc event.
		 * Try to create a new collection with the data given and
		 * add it to the list.
		 *
		 * @param  {Document} doc Document with the collection name.
		 */
		createCollection: function(doc) {
			var me = this,
				name = $.trim(doc.toJSON().collectionName)
			;

			// If there is no name fail.
			if(!name)
				return Alerts.add({
					message: 'Type a name for the collection.',
					level: 'error'
				});

			// Create the collection
			this.service.create(name, {collectionName: name})
				.then(function(settings){
					var itemsView = me.subViews.items;

					me.subViews.create.reset();
					me.closeCreateCollection();

					// Add the doc to the items and show it
					itemsView.collection.add(settings, {at: 0});
					itemsView.resetSubViews();
					itemsView.render();


					// Open the brand new document
					itemsView.subViews[settings._id].edit();

					Alerts.add({
						message: 'Collection created.',
						autoclose: 6000
					});

					// Update count
					me.collectionNames.push(name);
					me.subViews.count.model.set({count: me.collectionNames.length});
					me.collectionNames.sort();

				})
				.fail(function(xhr, status, err){
					Alerts.add({
						message: 'There was an error: ' + err + '.',
						level: 'error'
					});
				})
			;
		},

		/**
		 * Get the property definitions needed for the collection settings.
		 *
		 * @return {Object} Property definitions.
		 */
		getDefinitions: function() {
			return [
				{key: 'customProperties', label: 'Allow custom properties', datatype: {id: 'bool'}},
				{key: 'propertyDefinitions', label: 'Property definitions', datatype: {id: 'array', options:{
					elementsType: {id: 'object', options: {
						propertyDefinitions: [
							{key: 'key', datatype: {id: 'string', options: {}}},
							{key: 'label', datatype: {id: 'string', options: {}}},
							{key: 'datatype', datatype: {id: 'field'}}
						],
						mandatoryProperties: ['key', 'label', 'datatype'],
						customProperties: false
					}}
				}}},
				{key: 'propertiesType', label: 'Properties datatype', datatype: {id: 'field', options:{allowAnyType: true}}},
				{key: 'headerFields', label: 'Header Fields', datatype: {id: 'array', options: {elementsType: {id: 'string', options: {}}}}},
				{key: 'mandatoryProperties', label: 'Mandatory properties', datatype: {id: 'array', options: {elementsType: {id: 'string', options: {}}}}},
				{key: 'hiddenProperties', label: 'Hidden properties', datatype: {id: 'array', options: {elementsType: {id: 'string', options: {}}}}}
			];
		},

		/**
		 * Handles the CollectionView:clickField event.
		 * Opens the collection setting form for the given collection.
		 *
		 * @param  {DocumentView} docView The document view for the collection settings.
		 * @param  {String} action  The action of the header field clicked.
		 */
		editCollection: function(docView, action) {
			var me = this;

			if(action == 'browse' || action == 'remove')
				return;

			this.service.getStats(docView.model.get('collectionName'))
				.then(function(stats){

					// Update the view reference
					me.subViews.items.subViews[stats.settings._id] = docView;
					delete me.subViews.items.subViews[stats.collectionName];

					// Update the settings
					docView.model.set(stats.settings);

					// Render and open the edit view
					docView.render().edit();
				})
				.fail(function(err){
					console.log(err);
				})
			;
		},

		/**
		 * Handles the CollectionView:click:browse event.
		 * Redirects to the collection list page.
		 *
		 * @param  {DocumentView} docView The document view for the collection settings.
		 */
		browseCollection: function(docView) {
			var name = docView.model.get('collectionName');
			Backbone.history.navigate('/collections/list/' + name, {trigger: true});
		},

		/**
		 * Handles the CollectionView:click:remove event.
		 * Deletes a collection and all its documents after an user confirmation.
		 *
		 * @param  {DocumentView} docView The document view for the collection settings.
		 */
		removeCollection: function(docView) {
			var me = this,
				name = docView.model.get('collectionName'),
				dialog
			;

			// Ask once
			dialog = Alerts.add({
				message: 'Are you sure to delete the collection <b>' + name + '</b>, and all its documents?',
				confirmButtons:{ok: 'Delete it', cancel: 'Don\'t delete'},
				level: 'warn'
			});

			dialog.once('alertOk', function(){

				// Ask twice
				Alerts.add({
						message: 'Click delete again to confirm the deletion.',
						confirmButtons:{ok: 'Ok', cancel: 'Cancel'},
						level: 'warn'
					})
				.on('alertOk', function(){
					me.service.drop(name)
						.then(function(){
							Alerts.add({
								message: 'Collection ' + name + ' deleted.',
								autoclose: 6000
							});

							// Delete the view
							delete me.subViews.items.subViews[docView.model.get('_id')];
							docView.remove();

							// Update the counter
							var index = me.collectionNames.indexOf(name);
							me.collectionNames.splice(index, 1);
							me.subViews.count.model.set({count: me.collectionNames.length});
						})
						.fail(function(){
							Alerts.add({
								message: 'There was an error deleting the collection. Please try again.',
								level: 'error'
							});
						})
					;
				});
			});
		},

		/**
		 * Handles CollectionView:saveDocument event.
		 * Updates the collection settings or create it if it didn't exist.
		 *
		 * @param  {DocumentView} docView The document view for the collection settings.
		 */
		saveCollection: function(docView) {
			var settings = docView.objectView.model.get('value'),
				method = 'updateSettings'
			;

			// Create the settings if they are new
			if(settings._id == settings.collectionName){
				delete settings._id;
				method = 'create';
			}

			this.service[method](settings.collectionName, settings)
				.then(function(updatedSettings){

					//Update the models
					docView.model.set(updatedSettings);
					docView.objectView.model.set('value', updatedSettings);

					Alerts.add({
						message: 'Collection updated.',
						autoclose: 6000
					});
				})
				.fail(function(){
					Alerts.add({
						message: 'There was an error saving the collection settings. Please, try again',
						level: 'error'
					});
				})
			;
		}
	});


	return PageController.extend({
		title: 'Collection Settings',
		contentView: CollectionSettingsController
	});
});