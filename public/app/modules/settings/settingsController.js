"use strict";
var deps = [
	'jquery', 'underscore', 'backbone', 'services',
	'modules/collection/collectionViews',	

	'modules/core/baseController',
	'modules/core/mainController',

	'text!./tpls/settingsControllerTpl.html',
	'modules/alerts/alerts'
];

define(deps, function($,_,Backbone, Services,
	CollectionViews,
	BaseController, mainController, 
	tplController, Alerts){

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
		hiddenProperties: ['name', '_id', 'type']
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
			model: Services.get('settings').getNew({type: 'settings'}),
			url: '/api/collections'
		});

		var collection = new CollectionList;

		_.each(collections, function(type){
			collection.add(Services.get('settings').getNew(type));
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
		controllerTpl: $(tplController).find('#settingsControllerTpl').html(),		

		initialize: function(opts){
			this.subViews = {};
			this.regions = {};
			this.regionViews = {
				'.adderPlaceholder': 'adder',
				'.itemsPlaceholder': 'items'
			};

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

				// Override
				me.tpl = me.controllerTpl;
				me.subViews['adder'] = createAdderView();
				me.subViews['items'] = createItemsView(results);

				if(me.subViews['adder'])
					me.runAdderListeners();

				deferred.resolve();
			});
		},

		runAdderListeners: function(){
			this.listenTo(this.subViews['adder'], 'createCollection', function(type, data){
				var me 	= this,
					settingsService = Services.get('settings'),
					collection = settingsService.getNew(type)
				;

				_.each(data, function(values, key){
					collection.set(key, values.value);
				});

				var oldurl = collection.url;
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

	return SettingsController;
});