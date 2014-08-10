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

		init: function(){
			var me = this;

			this.getCollectionNames()
				.then(function(collections){

					// Store the collections
					collections.sort();
					me.collectionNames = collections;

					me.initViews();
				})
			;
		},

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
						console.log(err);
						Alerts.add({
							message: 'There was an error getting the collection list. Please retry.',
							level: 'error'
						});
						deferred.reject(err);
					})
				;
			});

			return deferred.promise();
		},

		initViews: function() {
			var me = this;

			this.subViews = {
				items: this.createItemsView(),
				create: this.createCreateView(),
				count: this.createCountView()
			};

			_.each(this.subViews, function(view, key){
				me.regions[key].show(view);
			});
		},

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

			this.listenTo(itemsView, 'saveDocument', this.saveCollection);
			this.listenTo(itemsView, 'click:browse', this.browseCollection);
			this.listenTo(itemsView, 'click:remove', this.removeCollection);
			this.listenTo(itemsView, 'clickField', this.editCollection);

			return itemsView;
		},

		createCreateView: function() {
			var createView = new CollectionViews.CreateView({
				collectionSettings: {
					propertyDefinitions: [{key: 'collectionName', label: 'Collection name', datatype: {id: 'string', options: {}} }],
					mandatoryProperties: ['collectionName'],
					customProperties: false
				}
			});

			this.listenTo(createView, 'createDoc', this.createCollection);
			this.listenTo(createView, 'cancel', this.closeCreateCollection);

			return createView;
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
		 * Handles CreateView[cancel] event.
		 * Closes the create new document form.
		 *
		 * @return {undefined}
		 */
		closeCreateCollection: function() {
			this.$('.js-collection-controls').show();
			this.subViews.create.close();
		},

		createCollection: function(doc) {
			var me = this,
				name = $.trim(doc.toJSON().collectionName)
			;

			if(!name)
				return Alerts.add({
					message: 'Type a name for the collection.',
					level: 'error'
				});

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
				.fail(function(err){
					Alerts.add({
						message: 'There was an error: ' + err + '.',
						level: 'error'
					});
				})
			;
		},

		createCountView: function() {
			var countView = new CollectionViews.DocumentCountView({
				count: this.collectionNames.length,
				documentName: 'collection'
			});

			return countView;
		},

		getDefinitions: function() {
			return [
				{key: 'customProperties', label: 'Allow custom properties?', datatype: {id: 'bool'}},
				{key: 'propertyDefinitions', label: 'Property definitions', datatype: {id: 'array'}},
				{key: 'propertiesType', label: 'Properties datatype', datatype: {id: 'field', options:{allowAnyType: true}}},
				{key: 'headerFields', label: 'Header Fields', datatype: {id: 'array', options: {elementsType: {id: 'string', options: {}}}}},
				{key: 'mandatoryProperties', label: 'Mandatory properties', datatype: {id: 'array', options: {elementsType: {id: 'string', options: {}}}}},
				{key: 'hiddenProperties', label: 'Hidden properties', datatype: {id: 'array', options: {elementsType: {id: 'string', options: {}}}}}
			];
		},

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

		browseCollection: function(docView) {
			var name = docView.model.get('collectionName');
			Backbone.history.navigate('/collections/list/' + name, {trigger: true});
		},

		removeCollection: function(docView) {
			var me = this,
				name = docView.model.get('collectionName'),
				dialog
			;

			dialog = Alerts.add({
				message: 'Are you sure to delete the collection <b>' + name + '</b>, and all its documents?',
				confirmButtons:{ok: 'Delete it', cancel: 'Don\'t delete'},
				level: 'warn'
			});

			dialog.once('alertOk', function(){
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

		saveCollection: function(docView) {
			var settings = docView.objectView.model.get('value'),
				method = 'updateSettings'
			;

			if(settings._id == settings.collectionName){
				delete settings._id;
				method = 'create';
			}

			this.service[method](settings.collectionName, settings)
				.then(function(updatedSettings){
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