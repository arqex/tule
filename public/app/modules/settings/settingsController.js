"use strict";
var deps = [
	'jquery', 'underscore', 'backbone',
	'modules/collection/collectionViews',
	'modules/core/dispenser',
	'modules/core/mainController'
];

define(deps, function($,_,Backbone, Collection, Dispenser, mainController){
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

	return {
		main: function(){
			var collections = Dispenser.getCollectionList(),
				view
			;

			collections.fetch().then(function(){
				collections.remove('collection_system.indexes');
				collections.remove('collection_monSettings');

				view = new Collection.CollectionView({
					collection: collections,
					fields: [
						function(doc){ return doc.name.split('_')[1]; },
						{action: 'browse', href:'#', icon:'eye'}
					],
					docOptions: docOptions
				});

				view.on('click:function1', function(docView){
					docView.model.getSettings().then(function(){
						docView.open();
					});
				});
				view.on('click:browse', function(docView){
					var name = docView.model.get('name').split('_')[1];
					Backbone.history.navigate('/collections/list/' + name, {trigger: true});
				});

				view.render();

				var newCollectionView = new Collection.NewCollectionView({
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

				newCollectionView.render();

				var superView = new Collection.SuperView({
					adderView: newCollectionView,
					collectionView: view
				});
				
				superView.render();
				mainController.loadView(superView);
				mainController.setTitle('Settings');
			});

		}
	};
});