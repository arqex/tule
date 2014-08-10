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
				items: this.createItemsView() //,
				// create: this.createCreateView(),
				// count: this.createCountView()
			};

			_.each(this.subViews, function(view, key){
				me.regions[key].show(view);
			});
		},


		createItemsView: function() {
			var namesCollection = new Backbone.Collection(
					this.collectionNames.map(function(name){ return {_id: name}; })
				),
				itemsView = new CollectionViews.CollectionView({
					collection: namesCollection
				})
			;

			this.listenTo(itemsView, 'saveDocument', this.saveDocument);
			this.listenTo(itemsView, 'click:remove', this.deleteDocument);
			this.listenTo(itemsView, 'clickField', this.editDocument);

			return itemsView;
		}
	});


	return PageController.extend({
		title: 'Collection Settings',
		contentView: CollectionSettingsController
	});
});