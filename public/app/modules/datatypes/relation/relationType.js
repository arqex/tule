"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./relationTypeTpl.html',
	'modules/datatypes/dispatcher',
	'services',
	'events'
];

define(deps, function($,_,Backbone, tplSource, dispatcher, Services,Events){
	var RelationTypeView = dispatcher.BaseView.extend({
		tpl: _.template($(tplSource).find('#relationTpl').html()),
		editTpl: _.template($(tplSource).find('#relationEditTpl').html()),

		defaultTypeOptions: {
			relatedCollection: ''
		},

		initialize: function(options){
			var me = this;

			this.relatedId = this.model.get('value');

			if(this.relatedId){
				//this.loadingRelated = Services.
			}
		},

		getValue: function(){
			return this.model.get('value');
		},
	});

	Events.on('service:ready:collection', function(){
		Services.get('collection').getCollectionList().then(function(allCollections){
			var collections = [];
			allCollections.sort();
			_.each(allCollections, function(c){
				if(c != 'system.indexes' && c != 'monSettings')
					collections.push({value: c, label: c});
			});
			dispatcher.registerType({
				id: 'relation',
				name: 'Relation',
				defaultValue: '',
				inline: false,
				View: RelationTypeView,
				typeOptionsDefinition: [
					{
						key: 'relatedCollection',
						label: 'Related Collection',
						datatype: {
							id: 'select',
							options: {
								selectOptions: collections
							}
						}
					},
					{key: 'displayField', label: 'Display Field', datatype: {id: 'string'}}
				]
			});
		});
	});

	return RelationTypeView;
});