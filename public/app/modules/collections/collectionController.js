var deps = [
	'jquery', 'underscore', 'backbone', 'services',

	'./collectionViews',
	'text!./tpls/collectionViews.html',

	'baseController',
	'pageController',

	'alerts',
	'events'
];

define(deps, function($,_,Backbone, Services, CollectionViews, tplSource, BaseController, PageController, Alerts, Events){

	"use strict";

	var templates = BaseController.prototype.extractTemplates(tplSource),
		// Here we will store the collection service when it is ready
		collections
	;

	var CollectionController = BaseController.extend({
		template: templates.main(),

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

		init: function(options){
			var me = this;

			this.collectionName = options.args[0];
			this.params = options.args[2] || {};

			this.initCollectionSettings()
				.then(function(){

					// Now we are sure the collection service is ready,
					// store a shorcut in the collections object
					collections = Services.get('collection');

					// init the views
					me.initViews();
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

			window.model = object.model;

			this.regions.adder.show(object);
			this.regions.items.show(string);
		}
	});


	return PageController.extend({
		title: 'Collection',
		contentView: CollectionController
	});
});
