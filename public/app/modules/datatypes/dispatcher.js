"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./dataElement.html'
];

define(deps, function($,_,Backbone, tplSource){

	var DataTypeDispatcher = function(){
		this.types = {};
		this.typeNames = [];
		this.typeOptionsDefinitions = {};
	};

	DataTypeDispatcher.prototype = {
		getView: function(typeId, options, value){
			var type = this.types[typeId];
			if(!type){
				console.log('Data type "' + typeId + '" unknown, returning String.');
				type = this.types.string;
			}

			var defaultValue = type.defaultValue;
			if(_.isUndefined(value))
				value = defaultValue;

			var model = value instanceof Backbone.Model && value.has('value')  ? value : new FieldModel({type: typeId, value: value});

			var viewOptions = {model: model, typeOptions: options};

			return new type.View(viewOptions);
		},

		getModel: function(properties){
			return new FieldModel(properties);
		},

		createModel: function(value){
			return new FieldModel({
				value: value,
				type: this.getDataType(value)
			});
		},

		createEmptyModel: function(typeId){
			var typeData = this.types[typeId];
			return new FieldModel({
				value: typeData.defaultValue,
				type: typeId
			});
		},

		registerType: function(type){
			this.types[type.id] = type;
			this.typeNames.push({id: type.id, name: type.name});
			this.typeOptionsDefinitions[type.id] = type.typeOptionsDefinition || [];
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
		}
	};

	var dispatcher = new DataTypeDispatcher();


	var FieldModel = Backbone.Model.extend({
		attributeId: 'key',
		defaults: {
			type: false,
			value: false,
			key: '',
			label: '',
			typeOptions: {}
		},
		toJSON: function() {
			var json = {};
			_.each(this.attributes, function(value, key){
				if(value instanceof Backbone.Model)
					json[key] = value.toJSON();
				else
					json[key] = value;
			});
			return json;
		}
	});

	var DataTypeView = Backbone.View.extend({
		/**
		 * Accepts {model, typeOptions}
		*/
		constructor: function(options){
			if(!this.defaultTypeOptions)
				this.defaultTypeOptions = {};

			this.typeOptions = _.extend({}, this.defaultTypeOptions, (options.typeOptions || {})),
			Backbone.View.prototype.constructor.call(this, options);
		},

		render: function(){
			var me = this,
				tpl = this.tpl
			;
			if(this.mode == 'edit')
				tpl = this.editTpl;

			this.$el.html(tpl(this.getTemplateData()));

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
		},

		getValue: function(){
			return this.model.get('value');
		}
	});

	/**
	 * Init options: {key, label, mode, type, typeOptions, value, allowDelete, model}
	 */
	var DataElementView = Backbone.View.extend({
		formTpl: _.template($(tplSource).find('#DataElementFormTpl').html()),
		tpl: _.template($(tplSource).find('#DataElementTpl').html()),
		events:{
			'change .element-form-type': 'onChangeFieldType',
			'click .element-form-advanced-toggle': 'onAdvancedToggle',
			'click .element-value': 'onClickElementValue',
			'click .element-key': 'onClickElementKey',
			'click .element-delete': 'onClickDelete',
			'click .element-edit-ok': 'onElementEditOk'
		},
		initialize: function(options){
			this.key = options.key;
			this.label = options.label;
			this.datatype = options.datatype;
			this.typeOptions = options.typeOptions || {};
			this.mode = options.mode || 'display';
			this.allowDelete = typeof options.allowDelete == 'undefined' ? true : options.allowDelete ;

			if(!options.model && options.value){
				this.createModel(options.value);
				if(!this.datatype)
					this.datatype = this.model.get('type');
			}

			if(!options.model && options.datatype)
				this.createModel();

			if(this.model)
				this.createTypeView();

			this.setInline();
		},
		createModel: function(value) {
			if(typeof value != 'undefined')
				this.model = dispatcher.createModel(value);
			else
				this.model = dispatcher.createEmptyModel(this.datatype);

			this.setInline();
		},
		renderEditForm: function(){
			var tplOptions = {
				name: this.label || this.key,
				datatype: this.datatype,
				types: dispatcher.typeNames
			};

			this.$el.html(this.formTpl(tplOptions));
		},
		render: function(){
			if(!this.datatype){
				this.renderEditForm();
				return this;
			}

			var tplOptions = {
				key: this.label || this.key,
				mode: this.mode,
				allowDelete: this.allowDelete,
				inline: this.inline,
				cid: this.cid
			};

			if(!this.typeView){
				this.createTypeView();
			}

			this.$el.html(this.tpl(tplOptions));

			this.typeView.render();
			this.$('.element-value').html(this.typeView.el);
			this.typeView.delegateEvents();
		},
		createTypeView: function(){
			this.typeView = dispatcher.getView(this.datatype, this.typeOptions, this.model);
			this.typeView.mode = this.mode;
			this.listenTo(this.typeView, 'changeMode', function(mode){
				this.mode = mode;
				this.typeView.changeMode(mode);
				this.render();
			});
		},
		onChangeFieldType: function(e){
			var type = this.$('element-form-type').val();
			if(this.advanced)
				this.prepareAdvancedOptions(type);
		},
		onAdvancedToggle: function(e){
			if(this.advanced){
				this.$el('.element-form-advanced-options').hide();
				this.advanced = false;
			}
			else {
				var type = this.$('element-form-type').val();
				this.prepareAdvancedOptions(type);
				this.$el('.element-form-advanced-options').show();
				this.advanced = true;
			}
		},
		prepareAdvancedOptions: function(){

		},
		changeMode: function(mode){
			if(!mode)
				mode = this.mode == 'edit' ? 'display' : 'edit';
			this.mode = mode;
			this.typeView.changeMode(mode);
			this.render();
		},

		onClickDelete: function(e){
			//e.stopPropagation();
			e.preventDefault();

			var cid = $(e.target).closest('.element').data('cid');
			if(this.cid == cid) {
				this.remove();
				this.model.trigger('destroy', this.key);
			}
		},

		onClickElementValue: function(e){
			if(this.mode == 'edit')
				return;

			var cid = $(e.target).closest('.element').data('cid');
			if(this.cid == cid)
				this.changeMode();
		},

		onClickElementKey: function(e){
			var cid = $(e.target).closest('.element').data('cid');
			if(this.cid == cid)
				this.changeMode();
		},

		onElementEditOk: function(e) {
			var keyInput = this.$('.element-form-key'),
				elementData = {
					key: keyInput.length ? keyInput.val() : this.key,
					datatype: this.$('.element-form-type').val(),
					typeOptions: {}
				}
			;
			if(this.advanced){

			}
			this.trigger('elementEdited', elementData);
		},

		setInline: function(){
			if(!this.datatype)
				return false;

			var typeData = dispatcher.types[this.datatype];
			this.inline = !(typeData) || typeof typeData.inline === 'undefined' || typeData.inline;
		}
	});

	dispatcher.BaseModel = FieldModel;
	dispatcher.BaseView = DataTypeView;
	dispatcher.DataElementView = DataElementView;

	return dispatcher;
});