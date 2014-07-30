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
			'click .js-document-new': 'openNewDocumentForm',
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
							me.collectionSettings = settings.toJSON();
							deferred.resolve();
						})
						.fail(function(error){
							console.log(error);

							//There has been an error, so we apply default settings
							me.collectionSettings = {allowCustom: true};
							deferred.resolve();
						})
				;
			});

			return deferred.promise();
		},

		initViews: function(){
			var me = this;

			this.subViews = {
				items: this.createCollectionView()
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

		dummy: function() {

			var datatypes = Services.get('datatype'),
				object = datatypes.get({
					datatype: {id: 'object', options:{
						propertyDefinitions: [{
							key: 'opts',
							datatype:{
								id: 'select',
								options: {
									selectOptions: [
										{value: 'opt1', label: 'option 1'},
										{value: 'opt2', label: 'option 2'},
										{value: 'opt3', label: 'option 3'}
									]
								}
							}
						}]
					}},
					value: {
						hola: 'tu',
						quetal: 'comoestas',
						booolean: true,
						array: ['esto', 'es', 'una', 'prueba'],
						objeto: {un:'par', de:'propiedades'},
						opts: 'opt2'
					},

					state: {mode: 'edit'},
					viewOptions: {editAllProperties: false, closeable: false}
				}),
				string = datatypes.get({
					datatype: {id: 'string'},
					value: 'Pedazo de string'
				})
			;

			this.regions.create.show(object);
		}
	});


	return PageController.extend({
		title: 'Collection',
		contentView: CollectionController
	});
});
