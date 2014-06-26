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

		events: {
			'keyup .relation-id': 'clearRelation',
			'keyup .relation-field': 'clearId'
		},

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

				//Let's load the related document
				this.loadingRelated = this.relatedCollection
					.get(this.relatedId)
						.then(
							function(related){
								me.related = related.toJSON();
							},
							function(related){
								me.loadingRelated = false;
							}
						)
				;
			}
		},

		/**
		 * Save the field value when the 'Ok' button is needed.
		 * @return {null}
		 */
		save: function(){
			//If a related document is selected, get its value
			if(this.selected){
				this.related = this.selected;
				this.relatedId = this.selected._id;
			}
			else //Otherwise, get the id value
				this.relatedId = this.$('.relation-id').val();

			this.model.set('value', this.relatedId);
		},

		render: function(){
			if(this.mode == 'display')
				return this.renderDisplayMode();

			return this.renderEditMode();
		},

		/**
		 * Render the display mode output. It autorefreshes if a related field is found.
		 * @return {null}
		 */
		renderDisplayMode: function(){
			var templateData = _.extend(this.model.toJSON(), this.typeOptions),
				displayField = templateData.displayField
			;

			if(this.related && displayField && this.related[displayField])
					templateData.value = this.related[displayField];

			templateData.related = this.related;

			if(!this.related && this.loadingRelated)
				this.loadingRelated.then(_.bind(this.render, this), _.bind(this.render, this));

			this.$el.html(this.tpl(templateData));
		},

		/**
		 * Render the edit mode output. Call autocomplete initialization if needed.
		 * @return {null}
		 */
		renderEditMode: function(){
			var templateData = _.extend(this.model.toJSON(), this.typeOptions),
				showRelated = templateData.relatedCollection && templateData.displayField
			;

			if(showRelated)
				templateData.relatedFieldValue = this.related ? this.related[templateData.displayField] : '';

			this.$el.html(this.editTpl(templateData));

			if(!showRelated)
				return;

			//Wait to be rendered
			setTimeout(_.bind(this.setAutocomplete, this), 100);
		},

		/**
		 * Init the autocomplete capabilites of the display field.
		 */
		setAutocomplete: function(){
			var me = this,
				options = this.typeOptions,
				query = {},
				input = this.$('.relation-field')
			;

			me.selected = false;

			input.autocomplete({
				serviceUrl: '/api/docs/' + this.typeOptions.relatedCollection,
				paramName: 'q',
				dataType: 'json',
				minChars: 2,
				deferRequestBy: 500,
				params: {clause: ''},
				autoSelectFirst: 1,
				onSearchStart: function(query){
					query.clause = 'undefined|' + me.typeOptions.displayField + '|eq|/.*' + query.q + '.*/';
				},
				transformResult: function(res){
					if(!res.documents)
						return {suggestions: []};

					return {
						suggestions: _.map(res.documents, function(item){
							return {value: item[me.typeOptions.displayField], data: item};
						})
					};
				},
				onSelect: function(suggestion){
					me.selected = suggestion.data;
					me.$('.relation-id').val(suggestion.data._id);
				}
			});
		},

		/**
		 * Clears the display field input when the id field is modified.
		 * @return {null}
		 */
		clearRelation: function(){
			this.$('.relation-field').val('');
		},

		/**
		 * Clears the id input field when the display field doesn't match any document.
		 * @return {null}
		 */
		clearId: function(){
			if(!this.selected || this.selected[this.typeOptions.displayField] != this.$('.relation-field').val()){
				this.$('.relation-id').val('');
				this.selected = false;
			}
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
				controls: true,
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