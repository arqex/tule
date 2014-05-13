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
		hiddenProperties: ['name', '_id']
	};

	var createAdderView = function(collections){
		var adderView = new CollectionViews.NewCollectionView({
			type: 'collection',
			collection: collections,			
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
		var itemsView = new CollectionViews.CollectionView({
			collection: collections,
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

			var me = this,
				settingsService = Services.get('settings'),
				collections = settingsService.getCollectionList()
			;

			this.querying = collections.fetch().then(function(){
				collections.remove('collection_system.indexes');
				collections.remove('collection_monSettings');
				// Override
				me.tpl = me.controllerTpl;
				me.subViews['adder'] = createAdderView(collections);
				me.subViews['items'] = createItemsView(collections);

				if(me.subViews['adder'])
					me.runAdderListeners();
			});
		},

		runAdderListeners: function(){
			this.listenTo(this.subViews['adder'], 'createCollection', function(type, data){
				var me 	= this,
					collection = SettingsService.get(type);
				;

				_.each(data, function(values, key){
					collection.set(key, values.value);
				});

				collection.url = '/api/collection';
				collection.save(null, {success: function(){
					Alerts.add({message:'Document saved correctly', autoclose:6000});

					// Reset the form on DOM
					me.subViews['adder'].objectView = false;
					me.subViews['adder'].$el.find('.form').remove();
					me.subViews['adder'].close();

					// Render collection view
					collection.unset('type');
					me.subViews['items'].collection.add(collection);
					me.subViews['items'].createDocViews(me.subViews['items'].collection);
					me.render();
				}});
			}); // End of createCollection
		}
	});

	return SettingsController;
});