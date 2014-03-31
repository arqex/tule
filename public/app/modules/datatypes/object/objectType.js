"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./objectTypeTpl.html',
	'modules/datatypes/dispatcher',
	'modules/alerts/alerts'
];

define(deps, function($,_,Backbone, tplSource, dispatcher, Alerts){

	var ObjectTypeView = dispatcher.BaseView.extend({
		displayTpl: _.template($(tplSource).find('#objectTpl').html()),
		editTpl: _.template($(tplSource).find('#objectEditTpl').html()),
		className: 'field field-object',

		events: {
			'click .object-add-property': 'onAddProperty'
		},

		defaultTypeOptions: {
			path: 'nopath',
			customProperties: true,
			propertyDefinitions: [],
			propertyType: false,
			hiddenProperties: [],
			mandatoryProperties: [],
			editAllProperties: false
		},

		initialize: function(opts){
			var me = this,
				options = this.typeOptions,
				modelvalue = this.model.get('value')
			;

			this.mode = 'display';

			// Store the value in a model to track its changes
			this.modelValue = new Backbone.Model(modelvalue);

			//Let's make the property definitions quicky accesible
			this.propertyDefinitions = {};
			_.each(options.propertyDefinitions, function(definition){
				me.propertyDefinitions[definition.key] = definition;
			});

			//Let's initialize a view for every property
			this.subViews = {};
			_.each(options.mandatoryProperties, function(key){
				var definition = me.propertyDefinitions[key];
				if(definition){
					me.createSubView(key, definition, me.modelValue.get(key));
					if(typeof modelvalue[key] == 'undefined')
						me.modelValue.set(key, dispatcher.types[definition.datatype.id].defaultValue);
				}
				
			});
			_.each(this.model.get('value'), function(value, key){

				var definition = me.propertyDefinitions[key] || {};

				if(options.hiddenProperties.indexOf(key) == -1 && !me.subViews[key]){
					me.createSubView(key, definition, value);
				}
			});

			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.modelValue, 'change', this.render);
		},

		createSubView: function(key, definition, value){
			this.subViews[key] = new dispatcher.DataElementView({
				key: key,
				label: definition.label,
				datatype: this.typeOptions.propertyType || definition.datatype,
				typeOptions: definition.typeOptions,
				allowDelete: this.typeOptions.customProperties && this.typeOptions.mandatoryProperties.indexOf(key) == -1,
				value: value
			});
			if(typeof value == 'undefined')
				this.subViews[key].createModel();

			this.listenTo(this.subViews[key].model, 'destroy', this.deleteProperty);
		},

		render: function(){
			var tpl = this.editTpl,
				me = this
			;

			if(this.mode == 'display')
				tpl = this.displayTpl;

			if(this.model.isNew())
				this.typeOptions.customProperties = true;

			this.$el
				.html(tpl({
					cid: this.cid,
					value: this.modelValue.toJSON(),
					customProperties: this.typeOptions.customProperties
				}))
				.attr('class', this.className + ' field-mode-' + this.mode)
			;
			this.delegateEvents();

			if(this.mode == 'edit'){
				var $props = this.$('.object-properties');
				_.each(this.subViews, function(subView){
					if(me.typeOptions.editAllProperties == true) {
						subView.editAllProperties = true;
						subView.changeMode('edit');
					}
					$props.append(subView.el);
					subView.render();
					subView.delegateEvents();
				});

				if(_.isEmpty(this.subViews))
					this.onAddProperty();
			}

			return this;
		},

		deleteProperty: function(key){
			delete this.subViews[key];
			this.modelValue.unset(key);
			this.model.set('value', this.modelValue.toJSON());			
		},

		onAddProperty: function(e){
			if(e){
				e.preventDefault();
				var cid = $(e.target).data('cid');
				if(this.cid != cid)
					return;
			}

			var me = this,
				newElement = new dispatcher.DataElementView({type: this.typeOptions.propertyType, isNew: true})
			;

			newElement.render();
			this.$('a.object-add-property[data-cid=' + this.cid + ']').replaceWith(newElement.el);

			setTimeout(function(){
				me.$('input').first().focus();
			},50);

			this.listenTo(newElement, 'elementOk', function(elementData){
				var key = $.trim(elementData.key);

				if(this.subViews[key])
					return Alerts.add({message: 'There is already a property called ' + key + '.', level: 'error'});

				if(newElement.datatype){
					newElement.isNew = false;
					newElement.key = key;
					this.saveProperty(newElement);
				}
				else{
					this.createProperty(elementData, newElement);
				}
				this.stopListening(newElement, 'elementOk');
				this.stopListening(newElement, 'elementCancel');
			});

			this.listenTo(newElement, 'elementCancel', function(){
				this.render();
				this.stopListening(newElement, 'elementOk');
				this.stopListening(newElement, 'elementCancel');
				newElement.remove();
			});
		},

		createProperty: function(data, newElement){
			newElement.key = data.key;
			newElement.datatype = data.datatype;
			newElement.mode = 'edit';
			newElement.createModel();
			newElement.createTypeView();
			newElement.isNew = false;
			newElement.typeOptions = data.datatype;

			this.saveProperty(newElement);
		},

		saveProperty: function(newElement) {
			this.subViews[newElement.key] = newElement;

			this.modelValue.set(newElement.key, newElement.model.get('value'));
			this.listenTo(newElement.model, 'destroy', this.deleteProperty);
		},

		getValue: function(){
			var value = {};
			_.each(this.subViews, function(subView, key){
				value[key] = subView.typeView.getValue();
			});
			return value;
		}
	});


	dispatcher.registerType({
		id: 'object',
		name: 'Hash',
		View: ObjectTypeView,
		inline: false,
		defaultValue: {},
		typeOptionsDefinition: [
			{key: 'customProperties', label: 'Allow custom properties?', datatype: {id: 'bool'}},
			{key: 'propertyDefinitions', label: 'Property definitions', datatype: {id: 'array'}},
			{key: 'propertiesType', label: 'Properties datatype', datatype: {id: 'field'}},
			{key: 'mandatoryProperties', label: 'Mandatory properties', datatype: {id: 'array', options: {elementsType: 'string'}}},
			{key: 'hiddenProperties', label: 'Hidden properties', datatype: {id: 'array', options: {elementsType: 'string'}}},
			{key: 'editAllProperties', label: 'Edit all properties at once', datatype: {id: 'bool'}}
		]
	});

	return ObjectTypeView;
});