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

	window.service = Services.get('collection').collection('games');
	window.Alerts = Alerts;

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
			items: '.itemsRegion'
		},

		events: {
			'click .js-doc-create': 'openCreateDoc',
			'click .js-collection-search': 'openSearchTools'
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
						})
						.fail(function(error, emptyQuery){
							me.currentQuery = emptyQuery;
						})
						.always(function(){

							// init the views
							me.initViews();
						});
				})
			;
		},

		initCollectionSettings: function(){
			var me = this,
				deferred = $.Deferred()
			;
			Events.once('service:ready:collection', function(){
				Services.get('settings')
					.getCollectionSettings(me.collectionName)
						.then(function(settings){
							me.collectionSettings = _.extend(settings.toJSON(), {name: me.collectionName});
							deferred.resolve();
						})
						.fail(function(error){
							console.log(error);

							//There has been an error, so we apply default settings
							me.collectionSettings = {allowCustom: true, name: me.collectionName};
							deferred.resolve();
						})
				;
			});

			return deferred.promise();
		},

		initViews: function(){
			var me = this;

			this.subViews = {
				items: this.createCollectionView(),
				create: this.createCreateView()
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
			this.listenTo(collection, 'clickField', this.editDocument)

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
		},

		saveDocument: function(docView) {

			// Update the model
			docView.model.set(docView.objectView.model.get('value'));
			docView.render();

			// Save the model
			this.service.save(docView.model)
				.then(function(){
					Alerts.add({message: 'Saved successfully!', autoclose: 5000});
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

		updateFieldDefinitions: function(fieldDefinitions) {

		}
	});


	return PageController.extend({
		title: 'Collection',
		contentView: CollectionController
	});
});
