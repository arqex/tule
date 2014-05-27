"use strict";
var deps = [
	'jquery', 'underscore', 'backbone', 'services',
	'modules/collection/collectionViews',
	'baseController',
	'pageController',
	'text!./tpls/settingsControllerTpl.html',
	'modules/alerts/alerts'
];

define(deps, function($,_, Backbone, Services, CollectionViews,
	BaseController, PageController, tplController, Alerts){

	//Structure for the collection docs
	var docOptions = {
		customProperties: false,
		propertyDefinitions: [
			{
				key: 'propertyDefinitions',
				label: 'Field definitions',
				datatype: {
					id: 'array',
					options: {
						elementsType: { // Define how to create new fields
							id: 'object',
							options: {
								propertyDefinitions: [
									{key: 'key', datatype: {id: 'string'}},
									{key: 'label', datatype: {id: 'string'}},
									{key: 'datatype', datatype: {id: 'field'}} // inception, yay!
								],
								mandatoryProperties: ['key', 'label', 'datatype'],
								customProperties: false
							}
						}
					}
				}
			},
			{key: 'tableFields', label: 'Table header fields', datatype: {id: 'array', options: {elementsType: {id:'string'}}}},
			{key: 'mandatoryProperties', label: 'Mandatory Fields', datatype: {id: 'array', options: {elementsType: {id: 'string'}}}},
			{key: 'hiddenProperties', label: 'Hidden Properties', datatype: {id: 'array', options: {elementsType: {id: 'string'}}}}
		],
		mandatoryProperties: ['propertyDefinitions', 'mandatoryProperties', 'hiddenProperties', 'tableFields'],
		hiddenProperties: ['name', '_id']
	};

	var createAdderView = function(){
		var adderView = new CollectionViews.NewCollectionView({
			type: 'collection',
			settings: {
				customProperties: false,
				name: "newCollection",
				propertyDefinitions: [{
					datatype: {
						id: "string",
						options: {}
					},
					key: "name",
					label: "Name"
				}],
				mandatoryProperties: ['name']
			}
		});

		return adderView;
	};

	var createItemsView = function(collections){
		var CollectionList = Backbone.Collection.extend({
			model: Services.get('settings').getNew(),
			url: '/api/collections'
		});

		var collection = new CollectionList;

		_.each(collections, function(type){
			collection.add(Services.get('settings').getNewCollection(type));
		});

		var itemsView = new CollectionViews.CollectionView({
			collection: collection,
			fields: [
				function(doc){ return doc.name.split('_')[1]; },
				{action: 'browse', href:'#', icon:'eye'}
			],
			docOptions: docOptions
		});

		itemsView.on('click:function1', function(docView){
			docView.model.getSettings().then(function(){
				docView.open();
			});
		});

		itemsView.on('click:browse', function(docView){
			var name = docView.model.get('name').split('_')[1];
			Backbone.history.navigate('/collections/list/' + name, {trigger: true});
		});

		return itemsView;
	};

	var SettingsController = BaseController.extend({
		template: $(tplController).find('#settingsControllerTpl').html(),
		regionSelectors: {
			adder: '.adderPlaceholder',
			items: '.itemsPlaceholder'
		},

		init: function(opts){
			var me 			= this,
				deferred 	= $.Deferred()
			;

			this.querying = deferred.promise();

			Services.get('collection').getCollectionList().then(function(results){
				var key = results.length;
				while (key--) {
					if(results[key] === 'system.indexes' || results[key] === 'monSettings')
						results.splice(key, 1);
				}

				me.subViews = {
					adder: createAdderView(),
					items: createItemsView(results)
				};

				me.runAdderListeners();

				_.each(me.subViews, function(view, name){
					me.regions[name].show(view);
				})

				deferred.resolve();
			});
		},

		runAdderListeners: function(){
			this.listenTo(this.subViews['adder'], 'createCollection', function(type, data){
				var me 	= this,
					settingsService = Services.get('settings'),
					collection = settingsService.getNewCollection(data.name.value),
					oldurl = collection.url()
				;

				_.each(data, function(values, key){
					collection.set(key, values.value);
				});

				collection.url = '/api/collection';
				settingsService.save(collection).then(function(){
					Alerts.add({message:'Document saved correctly', autoclose:6000});
					collection.url = oldurl;

					// Reset the form on DOM
					me.subViews['adder'].objectView = false;
					me.subViews['adder'].$el.find('.form').remove();
					me.subViews['adder'].close();

					// Render collection view
					me.subViews['items'].collection.add(collection);
					me.subViews['items'].update(me.subViews['items'].collection);
					me.render();
				});
			}); // End of createCollection
		}
	});

	return PageController.extend({
		title: 'Collection Settings',
		contentView: SettingsController
	});

	return SettingsController;
});