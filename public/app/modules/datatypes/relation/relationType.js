"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./relationTypeTpl.html',
	'modules/datatypes/dispatcher',
	'services',
	'events',
	'modules/datatypes/relation/jquery.autocomplete'
];

define(deps, function($,_,Backbone, tplSource, dispatcher, Services, Events){
	var RelationTypeView = dispatcher.BaseView.extend({
		tpl: _.template($(tplSource).find('#relationTpl').html()),
		editTpl: _.template($(tplSource).find('#relationEditTpl').html()),

		defaultTypeOptions: {
			relatedCollection: '',
			displayField: ''
		},

		initialize: function(options){
			var me = this;

			this.relatedId = this.model.get('value');
			this.related = false;

			if(this.relatedId && this.typeOptions.relatedCollection){
				this.relatedCollection = Services.get('collection').collection(this.typeOptions.relatedCollection);
				console.log('Loading related');

				this.loadingRelated = this.relatedCollection
					.get(this.relatedId)
						.then(
							function(related){
								me.related = related;
							},
							function(related){
								this.loadingRelated = false;
							}
						)
				;
			}
		},

		getValue: function(){
			return this.model.get('value');
		},

		render: function(){
			if(this.mode == 'display')
				return this.renderDisplayMode();

			return this.renderEditMode();
		},

		renderDisplayMode: function(){
			var tplData = {
				value: this.related && this.typeOptions.displayField ? this.related.get(this.typeOptions.displayField) : this.relatedId
			};

			if(!this.related && this.loadingRelated)
				this.loadingRelated.then(_.bind(this.render, this));

			this.$el.html(this.tpl(tplData));
		},

		renderEditMode: function(){
			var options = this.typeOptions;
			this.$el.html(this.editTpl(this.model.toJSON()));
			if(!options.relatedCollection || !options.displayField)
				return;

			//Wait to be rendered
			setTimeout(_.bind(this.setAutocomplete, this), 100);
		},

		setAutocomplete: function(){
			var me = this,
				options = this.typeOptions,
				query = {}
			;

			this.$('input').autocomplete({});
		}
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