"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!tpls/datatypes.html'
];

define(deps, function($,_,Backbone, tplSource){

	var DataTypeDispatcher = function(){
		this.types = {};
		this.typeNames = [];
	};

	DataTypeDispatcher.prototype = {
		getView: function(typeId, path, value, mode){
			var type = this.types[typeId];
			if(!type){
				console.log('Data type "' + typeId + '" unknown, returning String.');
				type = this.types.string;
			}

			var defaultValue = type.defaultValue;
			if(_.isUndefined(value))
				value = defaultValue;

			 return new type.View({path: path, model: new FieldModel({type: type.id, value: value, inline:type.inline}), mode: mode});
		},

		registerType: function(type){
			this.types[type.id] = type;
			this.typeNames.push({id: type.id, name: type.name});
		},

		getDataType: function(value){
			if( _.isArray(value) ) {
				return 'array';
			} else if( _.isObject(value) ) {
				return 'object';
			} else if( (value === parseInt(value, 10)) && (value != parseInt(NaN,10)) ) {
				return 'integer';
			} else if( (value === parseFloat(value)) && (value != parseFloat(NaN)) ) {
				return 'float';
			} else if( _.isBoolean(value) ) {
				return 'bool';
			}
			return 'string';
		},
		getModel: function(properties){
			return new FieldModel(properties);
		}
	};

	var dispatcher = new DataTypeDispatcher();


	var FieldModel = Backbone.Model.extend({
		defaults: {
			type: false,
			value: false,
			inline: false
		}
	});

	var DataTypeView = Backbone.View.extend({
		construct: function(options){
			this.typeOptions = options && options.typeOptions ? options.typeOptions : {};
			Backbone.View.prototype.construct.call(this, options);
		},
		render: function(){
			var me = this,
				tpl = this.tpl
			;
			if(this.mode == 'edit')
				tpl = this.editTpl;

			this.$el.html(tpl({value: this.getTemplateData()}));

			if(this.mode == 'edit')
				setTimeout(function(){
					me.$('input').first().focus();
				}, 50);
		},

		getTemplateData: function(){
			return this.model.toJSON();
		},

		changeMode: function(mode){
			if(!mode)
				mode = this.mode == 'edit' ? 'display' : 'edit';
			this.mode = mode;
		}
	});

	return dispatcher;
});