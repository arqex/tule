"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./dataElement.html',
	'modules/alerts/alerts'
];

define(deps, function($,_,Backbone, tplSource, Alerts){

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

			return this;
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
		},

		save: function(){
			this.model.set('value', this.$('input').val());
		},

		cancel: function(){

		}
	});

	/**
	 * Init options: {key, label, mode, type, typeOptions, value, allowDelete, model}
	 */
	var DataElementView = Backbone.View.extend({
		formTpl: _.template($(tplSource).find('#DataElementFormTpl').html()),
		tpl: _.template($(tplSource).find('#DataElementTpl').html()),
		events:{
			'click .element-value': 'onClickElementValue',
			'click .element-key': 'onClickElementKey',
			'click .element-delete': 'onClickDelete',
			'click .element-edit-ok': 'onElementEditOk',
			'click .element-ok': 'onElementOk',
			'click .element-cancel': 'onElementCancel',
			'keydown': 'onKeydown'
		},

		initialize: function(options){
			this.key = options.key;
			this.label = options.label;
			this.datatype = options.datatype;
			this.typeOptions = options.typeOptions || {};
			this.mode = options.mode || 'display';
			this.allowDelete = typeof options.allowDelete == 'undefined' ? true : options.allowDelete ;
			this.isNew = options.isNew;	
			if(!options.model && typeof options.value != 'undefined'){
				this.createModel(options.value);
				if(!this.datatype)
					this.datatype = {id:this.model.get('type'), options: {}};
			}
			
			if(!this.model && options.datatype)
				this.createModel();

			if(this.model)
				this.createTypeView();

			this.setInline();
		},
		createModel: function(value) {
			if(typeof value != 'undefined'){
				this.model = dispatcher.createModel(value);
			}else{
				if(!_.isObject(this.datatype))
					this.datatype = {id: this.datatype};
				this.model = dispatcher.createEmptyModel(this.datatype.id);
			}

			this.setInline();
		},

		renderEditForm: function(){
			var fieldView = dispatcher.getView('field');

			fieldView.changeMode('edit');

			this.$el.html(this.formTpl({ name: this.label || this.key }));
			this.$('.element-form').html(fieldView.render().el);

			this.typeView = fieldView;
			return this;
		},

		render: function(){
			if(!this.datatype)
				return this.renderEditForm();

			var tplOptions = {
				key: this.label || this.key,
				mode: this.mode,
				allowDelete: !this.isNew && this.allowDelete,
				inline: this.inline,
				cid: this.cid,
				buttonText: this.isNew ? 'Add' : 'Ok',
				controls: this.isNew || this.controls,
				isNew: this.isNew,
				datatype: this.datatype.id,
				editAllProperties: this.editAllProperties || false
			};

			if(!this.typeView)
				this.createTypeView();

			// Persistent propertyDefinitions
			(this.key == "propertyDefinitions") ? this.typeView.isCustom = true : this.typeView.isCustom = false;

			if(this.datatype.id == 'object')
				this.typeView.typeOptions.editAllProperties = this.isNew;

			this.$el.html(this.tpl(tplOptions));

			this.typeView.render();
			this.$('.element-value').prepend(this.typeView.el);
			this.typeView.delegateEvents();

			return this;
		},
		createTypeView: function(){
			this.typeView = dispatcher.getView(this.datatype.id, this.datatype.options, this.model);
			this.typeView.mode = this.mode;
			this.listenTo(this.typeView, 'changeMode', function(mode){
				this.mode = mode;
				this.typeView.changeMode(mode);
				this.render();
			});
			this.listenTo(this.typeView, 'cancel', function(mode){
				this.trigger('clickCancel');
			});
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
			if(this.isNew || this.editAllProperties)
				return;

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

		onElementOk: function(e){
			e.preventDefault();
			var elementData = {};

			//We are asking for the datatype
			if(this.isNew && !this.datatype){
				var key = this.key;
				if(typeof key == 'undefined')
					key = $.trim(this.$('.element-form-key').val());
				if(typeof key == 'undefined' || key === '')
					return Alerts.add({message: 'The new element needs a key!', level: 'error'});

				this.typeView.save();
				elementData = {key: key, datatype: this.typeView.getValue()};
			}
			else {
				if(this.typeView.typeOptions.editAllProperties == true){
					_.each(this.typeView.subViews, function(subView){
						subView.editAllProperties = false;
						subView.typeView.save();
						subView.changeMode('display');
						elementData[subView.key] = {key: subView.key, datatype: subView.datatype};
					});
				} else {
					this.typeView.save();
					this.changeMode('display');
					elementData = {key: this.key, datatype: this.datatype};
				}
			}

			return this.trigger('elementOk', elementData);
		},

		onElementCancel: function(e){
			e.preventDefault();
			if(this.typeView){
				this.typeView.cancel();
				this.changeMode('display');
			}
			this.trigger('elementCancel');
		},

		setInline: function(){
			if(!this.datatype)
				return false;

			var typeData = dispatcher.types[this.datatype.id];
			this.inline = !(typeData) || typeof typeData.inline === 'undefined' || typeData.inline;
			this.controls = typeData && typeData.controls
		},

		onKeydown: function(e){
			var elementCid = $(e.target).closest('.element').data('cid');
			if(elementCid == this.cid){
				if(this.editAllProperties != true) {
					if(e.which == 13){
						this.onElementOk(e);
					} else if (e.which == 27){
						this.onElementCancel(e);
					}	
				} else {
					// At the forms
					if(e.which == 13){
						e.preventDefault();
						var inputs = $('.form :input');
						inputs[inputs.index(e.target)+1].focus();
					} else if (e.which == 27){
						this.onElementCancel(e);
					}	
				}
			}
		}
	});

	dispatcher.BaseModel = FieldModel;
	dispatcher.BaseView = DataTypeView;
	dispatcher.DataElementView = DataElementView;

	return dispatcher;
});