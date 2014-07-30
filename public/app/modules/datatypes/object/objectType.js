var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./objectTypeTpl.html',
	'alerts',
	'modules/datatypes/datatypeViews'
];

define(deps, function($,_,Backbone, tplSource, Alerts, DatatypeViews){
	"use strict";

	var templates = DatatypeViews.DataTypeView.prototype.extractTemplates(tplSource);

	var ObjectTypeView = DatatypeViews.DataTypeView.extend({
		displayTpl: templates.objectTpl,
		editTpl: templates.objectEditTpl,

		defaultState: {
			mode: 'edit'
		},

		defaultModelValue: {},

		events: {
			'click .js-object-add-property': 'onAddProperty',
			'click .js-object-close': 'onClickClose'
		},

		defaultTypeOptions: {
			customProperties: true,
			propertyDefinitions: [],
			propertyType: false,
			hiddenProperties: [],
			mandatoryProperties: []
		},

		defaultViewOptions: {
			editAllProperties: false,
			closeable: true
		},

		initialize: function(opts){
			var me = this,

				//Make sure the value is an object
				value = this.model.get('value') || _.clone(this.defaultModelValue)
			;

			// And re-set it
			if(!this.model)
				this.model.set('value', value, {silent: true});

			this.selector = {
				controls: '.js-object-controls[data-cid=' + this.cid + ']',
				props: '.js-object-properties[data-cid=' + this.cid + ']',
				close: '.js-object-close[data-cid=' + this.cid + ']'
			};

			//Let's make the property definitions quicky accesible
			this.propertyDefinitions = {};
			_.each(this.typeOptions.propertyDefinitions, function(definition){
				me.propertyDefinitions[definition.key] = definition;
			});

			// this.listenTo(this.model, 'change', this.render);
		},

		createSubViews: function() {
			var me = this,
				objectValue = this.model.get('value'),
				mandatory = this.typeOptions.mandatoryProperties
			;

			// Reset the Views
			me.subViews = {};

			_.each(mandatory, function(key){
				me.subViews[key] = me.createSubView(key, objectValue[key]);
			});

			_.each(objectValue, function(value, key){
				if(!me.subViews[key])
					me.subViews[key] = me.createSubView(key, value);
			});
		},

		createSubView: function(key, value){
			var definition = this.propertyDefinitions[key] || {},
				view = new DatatypeViews.DataElementView({
					key: key,
					label: definition.label,
					datatype: this.typeOptions.propertyType || definition.datatype,
					deleteable: this.typeOptions.customProperties,
					value: value,
					singleEditable: !this.viewOptions.editAllProperties,
					state: {mode: this.viewOptions.editAllProperties ? 'edit' : 'display'}
				})
			;

			this.listenTo(view, 'updated', this.updateProperty);
			this.listenTo(view, 'delete', this.deleteProperty);

			return view;
		},

		updateProperty: function(key, value){
			var objectValue = _.clone(this.model.get('value'));
			objectValue[key] = value;
			this.model.set('value', objectValue);
		},

		render: function(){
			var me  = this,
				mode = this.state('mode'),
				tpl = mode == 'edit' ? this.editTpl : this.displayTpl
			;

			this.$el
				.html(tpl(_.extend({cid: this.cid}, this.getTemplateData())))
				.attr('class', this.className + ' field-mode-' + mode)
			;

			this.delegateEvents();

			if(mode == 'edit'){
				var $props = this.$(this.selector.props);

				//On the first edit, create the property views
				if(!this.subViews)
					this.createSubViews();

				_.each(this.subViews, function(subView){
					$props.append(subView.el);
					subView.render();
					subView.delegateEvents();
				});

				if(_.isEmpty(this.subViews))
					this.onAddProperty();
				else
					this.renderControls();
			}

			return this;
		},

		renderControls: function(){
			var controls = this.$(this.selector.controls).html('');

			if(this.typeOptions.customProperties)
				controls.append(templates.addProperty({cid: this.cid}));
		},

		deleteProperty: function(key){
			var value = this.model.get('value');
			this.subViews[key].remove();

			delete this.subViews[key];
			delete value[key];

			// If there is no elements change to display mode
			if(!_.keys(value).length)
				this.trigger('edit:cancel');

			this.updateCount();

			this.model.set('value', value);
		},

		onAddProperty: function(e){
			if(e){
				e.preventDefault();
				if(this.cid != $(e.target).data('cid'))
					return;
			}

			var me = this,
				newElement = this.createNewElementForm(),
				controls = this.$(this.selector.controls)
			;

			// Append the form
			this.$(this.selector.props).append(newElement.el);

			// Remove the controls
			controls.html('');

			this.listenTo(newElement, 'ok', function(elementData){
				var key = $.trim(elementData.key);
				elementData.key = key;

				if(this.subViews[key])
					return Alerts.add({message: 'There is already a property called ' + key + '.', level: 'error'});

				this.stopListening(newElement);
				newElement.remove();

				this.addProperty(elementData);

				this.updateCount();

				// Restore the controls
				controls.append(templates.addProperty({cid: this.cid}));

			});

			this.listenTo(newElement, 'cancel', function(){
				this.render();
				this.stopListening(newElement);
				newElement.remove();
			});
		},

		addProperty: function(elementData) {
			var key = $.trim(elementData.key),
				value = elementData.datatype.defaultValue
			;

			// Update property definitions
			this.propertyDefinitions[key] = elementData;

			// Create subview
			var newPropertyView = this.createSubView(key, value);
			this.subViews[key] = newPropertyView;

			// Update model
			this.updateProperty(key, value);

			// Add the new view to the DOM
			this.$(this.selector.props).append(newPropertyView.el);
			newPropertyView.render();
			newPropertyView.state('mode', 'edit');
		},

		createNewElementForm: function(){
			var newElement = new DatatypeViews.DataElementCreationView({
				datatype: this.typeOptions.propertyType
			});

			newElement.render();

			return newElement;
		},

		updateCount: function() {
			// Update the property count
			this.$(this.selector.close).html(templates.objectCount({value: this.model.get('value')}));
		},

		onClickClose: function(e){
			if(e)
				e.preventDefault();

			if(this.viewOptions.closeable)
				this.trigger('edit:cancel');
		},
	});


	return {
		id: 'object',
		name: 'Object',
		View: ObjectTypeView,
		defaultValue: _.clone(ObjectTypeView.prototype.defaultModelValue),
		typeOptionsDefinition: [
			{key: 'customProperties', label: 'Allow custom properties?', datatype: {id: 'bool'}},
			{key: 'propertyDefinitions', label: 'Property definitions', datatype: {id: 'array'}},
			{key: 'propertiesType', label: 'Properties datatype', datatype: {id: 'field', options:{allowAnyType: true}}},
			{key: 'mandatoryProperties', label: 'Mandatory properties', datatype: {id: 'array', options: {elementsType: 'string'}}},
			{key: 'hiddenProperties', label: 'Hidden properties', datatype: {id: 'array', options: {elementsType: 'string'}}}
		]
	};
});
