var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./relationTypeTpl.html',
	'modules/datatypes/datatypeViews',
	'services',
	'events',
	'autocomplete'
];

define(deps, function($,_,Backbone, tplSource, DatatypeViews, Services, Events){
	'use strict';

	var templates = DatatypeViews.DataTypeView.prototype.extractTemplates(tplSource);

	var RelationTypeView = DatatypeViews.DataTypeView.extend({
		displayTpl: templates.relationTpl,
		editTpl: templates.relationEditTpl,

		defaultModelValue: {
			id: '',
			display: ''
		},

		defaultState: {
			mode: 'display'
		},

		defaultTypeOptions: {
			relatedCollection: '',
			displayField: ''
		},

		initialize: function(){
			var me = this;

			// Add custom events
			_.extend(this.events, {
				'keyup .relation-id': 'clearRelation',
				'keyup .relation-field': 'clearId'
			});

			// Init a quick reference to the composite value {id, display}
			this.value = this.getCompositeValue(this.model.get('value'));

			// The reference to the related object
			this.related = false;


			// Check if we can save a composite value
			me.saveComposite = false;
			Services.get('settings').get('tule')
				.then(function(tuleSettings){
					me.saveComposite = tuleSettings.value.compositeRelated;
				})
			;

			// A reference to the collection
			this.relatedCollection = this.typeOptions.relatedCollection ?
				Services.get('collection').collection(this.typeOptions.relatedCollection) :
				false
			;

			// If we have an id and a related collection, but not a display text, fetch the related item.
			if(!this.value.display && this.value.id && this.relatedCollection){
				console.log('Loading related');

				//Let's load the related document
				this.loadingRelated = this.relatedCollection
					.get(this.value.id)
						.then(
							function(related){
								me.related = related.toJSON();
								me.value.display = related.get(me.typeOptions.displayField);
								me.render();
							},
							function(){
								me.loadingRelated = false;
							}
						)
				;
			}
		},

		/**
		 * Converts the value given to an object {id, display} used to store a friendly text with
		 * the reference.
		 *
		 * @param  {String|Object} value The database value.
		 * @return {Object}       The composite value used by the relation field.
		 */
		getCompositeValue: function(value) {
			if(_.isObject(value))
				return {id: value.id, display: value.display};
			return {id: value, display: ''};
		},

		/**
		 * Save the field value when the 'Ok' button is needed.
		 * @return {null}
		 */
		save: function(){
			//If a related document is selected, get its value
			if(this.selected){
				this.value = {
					id: this.selected._id,
					display: this.selected[this.typeOptions.displayField]
				};
				this.related = this.selected;
			}
			else { //Otherwise, get the id value
				this.value = {
					id: this.$('.relation-id').val(),
					display: ''
				};
			}

			// Check composite save
			var value = this.saveComposite ? this.value : this.value.id;

			this.model.set('value', value);
			this.trigger('edit:ok', value);
		},

		getEditValue: function() {
			if( this.state( 'mode' ) == 'edit' ) {
				if(this.selected){
					return {
						id: this.selected._id,
						display: this.selected[this.typeOptions.displayField]
					};

				}
				else { //Otherwise, get the id value
					return {
						id: this.$('.relation-id').val(),
						display: ''
					};
				}
			}
			return this.model.get('value');
		},

		render: function(){
			if(this.state('mode') == 'display')
				return this.renderDisplayMode();

			return this.renderEditMode();
		},

		/**
		 * Render the display mode output. It autorefreshes if a related field is found.
		 * @return {null}
		 */
		renderDisplayMode: function(){
			var templateData = {
					value: this.value,
					related: this.related,
					options: this.typeOptions
				}
			;

			// Re-render if we are still waiting for the related display field.
			if(!this.related && this.loadingRelated)
				this.loadingRelated.then(_.bind(this.render, this), _.bind(this.render, this));

			this.$el.html(this.displayTpl(templateData));

			this.selected = false;
		},

		/**
		 * Render the edit mode output. Call autocomplete initialization if needed.
		 * @return {null}
		 */
		renderEditMode: function(){
			var templateData = {
					value: this.value,
					options: this.typeOptions,
					controls: this.getControlsTpl()
				}
			;

			if(this.related)
				this.selected = this.related;

			this.$el.html(this.editTpl(templateData));

			if(!this.typeOptions.relatedCollection && this.typeOptions.displayField)
				return;

			// Wait to be rendered to start autocomplete
			setTimeout(_.bind(this.setAutocomplete, this), 100);
		},

		/**
		 * Init the autocomplete capabilites of the display field.
		 */
		setAutocomplete: function(){
			var me = this,
				options = this.typeOptions,
				input = this.$('.relation-field')
			;

			input.autocomplete({
				serviceUrl: '/api/docs/' + options.relatedCollection,
				paramName: 'q',
				dataType: 'json',
				minChars: 2,
				deferRequestBy: 500,
				autoSelectFirst: 1,
				onSearchStart: function(query){
					query.query = options.displayField + '|like|' + encodeURIComponent(query.q);
				},
				transformResult: function(res){
					if(!res.documents)
						return {suggestions: []};

					return {
						suggestions: _.map(res.documents, function(item){
							return {value: item[options.displayField], data: item};
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

	var definition = {
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
						selectOptions: []
					}
				}
			},
			{key: 'displayField', label: 'Display Field', datatype: {id: 'string'}}
		]
	};

	// A shortcut to handle the collection names
	var relatedOptions = definition.typeOptionsDefinition[0].datatype.options;

	// Get all the collection names and add it to the select options for the
	// relation type.
	Events.on('service:ready:collection', function(){
		Services.get('collection').getCollectionList().then(function(allCollections){

			// Sort and format the options
			var collections = [];
			allCollections.sort();
			_.each(allCollections, function(c){
				if(c != 'system.indexes' && c != 'monSettings')
					collections.push({value: c, label: c});
			});

			relatedOptions.selectOptions = collections;
		});
	});

	// Update the collection on creation and delete
	Events.on('collection:updated', function(collectionName) {
		var index = relatedOptions.selectOptions.indexOf(collectionName);
		if(index == -1){
			relatedOptions.selectOptions.push(collectionName);
			relatedOptions.selectOptions.sort();
		}
	});

	Events.on('collection:deleted', function(collectionName) {
		var index = relatedOptions.selectOptions.indexOf(collectionName);
		if(index != -1){
			relatedOptions.selectOptions.splice(index, 1);
		}
	});

	return definition;
});