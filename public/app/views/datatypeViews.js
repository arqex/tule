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
		getView: function(typeId, path, value){
			var type = this.types[typeId];
			if(!type){
				console.log('Data type "' + typeId + '" unknown, returning String.');
				type = this.types.string;
			}

			var defaultValue = type.defaultValue;
			if(_.isUndefined(value))
				value = defaultValue;

			return new type.View({path: path, model: new FieldModel({type: type.id, value: value})});
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
		}
	};

	var dispatcher = new DataTypeDispatcher();

	var DATATYPE = {
		OBJECT: 'object',
		STRING: 'string',
		ARRAY: 	'array',
		INTEGER:'int',
		FLOAT: 	'float',
		BOOLEAN:'bool'
	};

	var FieldModel = Backbone.Model.extend({
		defaults: {
			type: false,
			value: false
		}
	});

	var StringTypeView = Backbone.View.extend({
		tpl: _.template($(tplSource).find('#stringTpl').html()),
		editTpl: _.template($(tplSource).find('#stringEditTpl').html()),
		events: {
			'click .string-ok': 'onClickOk',
			'keyup form': 'onKeyup',
			'click .string-cancel': 'onClickCancel'
		},
		render: function(){
			var me = this,
				tpl = this.tpl
			;

			if(this.mode == 'edit')
				tpl = this.editTpl;

			this.$el.html(tpl({value: this.model.get('value')}));

			if(this.mode == 'edit')
				setTimeout(function(){
					me.$('input').focus();
				}, 50);
		},

		changeMode: function(mode){
			if(!mode)
				mode = this.mode == 'edit' ? 'display' : 'edit';
			this.mode = mode;
		},

		onClickOk: function(e){
			e.preventDefault();
			this.saveString();
		},

		onKeyup: function(e){
			if(e.which == 13){
				console.log("string");
				e.preventDefault();
				this.saveString();
			} else if (e.which == 27) {
				e.preventDefault();
				this.cancel();
			}
		},

		saveString: function(){
			this.model.set('value', this.$('input').val());
			this.trigger('changeMode', 'display');
		},

		onClickCancel: function(e){
			e.preventDefault();
			this.cancel();
		},

		cancel: function() {
			this.trigger('changeMode', 'display');	
		},

		getValue: function(){
			return this.model.get('value');
		}
	});

	dispatcher.registerType({
		id: 'string',
		name: 'String',
		defaultValue: '',
		View: StringTypeView
	});

	var IntegerTypeView = Backbone.View.extend({
		tpl: _.template($(tplSource).find('#integerTpl').html()),
		editTpl: _.template($(tplSource).find('#integerEditTpl').html()),
		events: {
			'click .integer-ok': 'onClickOk',
			'keyup form': 'onKeyup',
			'click .integer-cancel': 'onClickCancel'
		},
		render: function(){
			var me = this,
				tpl = this.tpl
			;
			if(this.mode == 'edit')
				tpl = this.editTpl;

			this.$el.html(tpl({value: this.model.get('value')}));

			if(this.mode == 'edit')
				setTimeout(function(){
					me.$('input').focus();
				}, 50);
		},

		changeMode: function(mode){
			if(!mode)
				mode = this.mode == 'edit' ? 'display' : 'edit';
			this.mode = mode;
		},

		onClickOk: function(e){
			e.preventDefault();
			this.saveInteger();
		},

		onKeyup: function(e){
			if(e.which == 13){
				console.log("integer");
				e.preventDefault();
				this.saveInteger();
			} else if (e.which == 27) {
				e.preventDefault();
				this.cancel();
			}
		},

		saveInteger: function(){
			this.model.set('value', parseInt(this.$('input').val()), 10);
			this.trigger('changeMode', 'display');
		},

		onClickCancel: function(e){
			e.preventDefault();
			this.cancel();
		},

		cancel: function() {
			this.trigger('changeMode', 'display');	
		},

		getValue: function(){
			return this.model.get('value');
		}
	});

	dispatcher.registerType({
		id: 'integer',
		name: 'Integer',
		defaultValue: 0,
		View: IntegerTypeView
	});

	var FloatTypeView = Backbone.View.extend({
		tpl: _.template($(tplSource).find('#floatTpl').html()),
		editTpl: _.template($(tplSource).find('#floatEditTpl').html()),
		events: {
			'click .float-ok': 'onClickOk',
			'onKeyup form': 'onKeyup',
			'click .float-cancel': 'onClickCanel'
		},

		render: function() {
			var me 	= this,
				tpl = this.tpl
			;
			if(this.mode == 'edit')
				tpl = this.editTpl;

			this.$el.html(tpl({value: this.model.get('value')}));

			if(this.mode == 'edit')
				setTimeout(function(){
					me.$('input').focus();
				}, 50);
		},

		changeMode: function(mode){
			if(!mode)
				mode = this.mode == 'edit' ? 'display' : 'edit';
			this.mode = mode;
		},

		onClickOk: function(e){
			e.preventDefault();
			this.saveFloat();
		},

		onKeyup: function(e){
			if(e.which == 13){
				e.preventDefault();
				this.saveFloat();
			} else if (e.which == 27) {
				e.preventDefault();
				this.cancel();
			}
		},

		saveFloat: function(){
			this.model.set('value', parseFloat(this.$('input').val()));
			this.trigger('changeMode', 'display');
		},

		onClickCancel: function(e){
			e.preventDefault();
			this.cancel();
		},

		cancel: function() {
			this.trigger('changeMode', 'display');	
		},

		getValue: function(){
			return this.model.get('value');
		}
	});

	dispatcher.registerType({
		id: 'float',
		name: 'Double',
		defaultValue: 0.0,
		View: FloatTypeView
	});

	var BooleanTypeView = Backbone.View.extend({
		editTpl: _.template($(tplSource).find('#booleanEditTpl').html()),
		events: {
			'click input:checkbox': 'saveBoolean'
		},

		render: function(){
			var me = this,
				tpl = this.editTpl
			;
			
			this.$el.html(tpl({value: this.model.get('value')}));
		},

		changeMode: function(){
			// Forced by interface. Useless. Ignore it.
		},

		saveBoolean: function(){
			if(this.$('input:checked').length == 1)
				this.model.set('value', true);
			else 
				this.model.set('value', false);
			
		},

		getValue: function(){
			return this.model.get('value');
		}
	});

	dispatcher.registerType({
		id: 'bool',
		name: 'Boolean',
		defaultValue: false,
		View: BooleanTypeView
	});


	var ObjectPropertyView = Backbone.View.extend({
		tpl: _.template($(tplSource).find('#objectPropertyTpl').html()),
		events: {
			'click .property-value': 'onClickFieldValue',
			'click .property-key': 'onClickFieldKey',
			'click .property-delete': 'onClickDelete'
		},

		initialize: function(opts){
			this.mode = opts.mode || 'display';
			this.key = opts.key;
			this.path = opts.path;
			this.propertyView = opts.view;
			this.propertyView.mode = opts.mode;
			this.model = this.propertyView.model;

			this.listenTo(this.propertyView, 'changeMode', function(mode){
				this.changeMode(mode);
			});

			this.listenTo(this.model, 'change', this.emitChange);
		},

		changeMode: function(mode){
			if(!mode)
				mode = this.mode == 'edit' ? 'display' : 'edit';
			this.mode = mode;
			this.propertyView.changeMode(mode);
			this.render();
		},

		render: function(){
			this.$el
				.html(this.tpl({path: this.path, key: this.key, mode: this.mode}))
				.find('.property-value')
					.html(this.propertyView.el)
			;
			this.propertyView.render();
			this.propertyView.delegateEvents();
			return this;
		},

		destroy: function(){
			this.model.destroy();			
		},

		onClickDelete: function(e){			
			//e.stopPropagation();
			e.preventDefault();
			
			var key = $(e.target).closest('.object-property').data('key');
			if(this.key == key) {
				this.destroy();
			}
		},

		onClickFieldValue: function(e){
			if(this.mode == 'edit')
				return;

			var property = $(e.target).closest('.object-property');
			if(property.data('path') == this.path)
				this.changeMode();
		},

		onClickFieldKey: function(e){
			var property = $(e.target).closest('.object-property');
			if(property.data('path') == this.path)
				this.changeMode();
		},
	});

	var ObjectTypeView = Backbone.View.extend({
		displayTpl: _.template($(tplSource).find('#objectTpl').html()),
		editTpl: _.template($(tplSource).find('#objectEditTpl').html()),
		fieldFormTpl: _.template($(tplSource).find('#fieldFormTpl').html()),
		className: 'field field-object',

		events: {
			'click .object-add-property': 'onAddField',
			'click .property-edit-ok': 'onClickFieldOk'
		},

		initialize: function(opts){
			var me = this;
			this.path = opts.path;
			this.subViews = {};
			this.mode = opts.mode || 'display';

			//Ensure backbone model for listening to changes
			if(!(this.model.get('value') instanceof Backbone.Model))
				this.model.set('value', new Backbone.Model(this.model.get('value')));

			_.each(this.model.get('value').toJSON(), function(fieldValue, fieldKey){
				var fieldPath = me.path + '.' + fieldKey,
					fieldType = dispatcher.getDataType(fieldValue),
					fieldView = dispatcher.getView(fieldType, fieldPath, fieldValue)
				;
				me.subViews[fieldKey] = new ObjectPropertyView({
					view: fieldView,
					path: fieldPath,
					key: fieldKey,
					mode: 'display'
				});
				
				me.listenTo(me.subViews[fieldKey].model, 'destroy', function(subViewModel){
					me.subViews[fieldKey].remove();
					delete me.subViews[fieldKey];
					// Update parent model:					
					this.model.get('value').unset(fieldKey);					
				});
			});

			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model.get('value'), 'change', this.render);
		},

		render: function(){			
			var tpl = this.editTpl;
			if(this.mode == 'display')
				tpl = this.displayTpl;

			this.$el
				.html(tpl({path: this.path, value: this.model.get('value').toJSON()}))
				.attr('class', this.className + ' field-mode-' + this.mode)
			;
			this.delegateEvents();

			if(this.mode == 'edit'){
				var $props = this.$('.object-properties');
				_.each(this.subViews, function(subView){
					$props.append(subView.el);
					subView.render();
					subView.delegateEvents();
				});

				if(_.isEmpty(this.subViews))
					this.onAddField();
			}

			return this;
		},	

		onAddField: function(){
			var me = this;
			this.$('a.object-add-property')
				.replaceWith(this.fieldFormTpl({
					types: dispatcher.typeNames,
					property:{key: '', type: ''},
					path:this.path					
				}));
			setTimeout(function(){
				me.$('input').focus();
			},50);
		},

		onClickFieldOk: function(e){
			e.preventDefault();
			var $form = $(e.target).closest('form');
			this.saveField($form);
		},

		saveField: function($form) {
			var me = this,
				key = $form.find('input[type=text]').val(),
				type = $form.find('select').val()
			;
			if(!key || !type)
				return console.log('You need to set a name and a type for the property');

			if(this.subViews[key])
				return console.log('There is already a property named ' + key);



			this.subViews[key] = new ObjectPropertyView({
				view: dispatcher.getView(type, this.path + '.' + key),
				key: key,
				path: this.path + '.' + key,
				mode: 'edit'
			});
			/*
			this.listenTo(this.subViews[key].model, 'change', function(subViewModel){
				var value = subViewModel.get('value');
				if(value instanceof Backbone.Model)
					value = value.toJSON();
				me.model.get('value').set(key, value);
				console.log(me.model.get('value').toJSON());
			});
			*/			
			this.model.get('value').set(key, this.subViews[key].model.get('value'));
		},

		changeMode: function(mode){
			if(!mode)
				mode = this.mode == 'edit' ? 'display' : 'edit';
			this.mode = mode;
		},
		getValue: function(){
			var value = {};
			_.each(this.subViews, function(subView, key){
				value[key] = subView.propertyView.getValue();
			});
			return value;
		}
	});

	dispatcher.registerType({
		id: 'object',
		name: 'Hash',
		View: ObjectTypeView,
		defaultValue: {}
	});



	var ArrayElementView = Backbone.View.extend({

		tpl: _.template($(tplSource).find('#arrayElementTpl').html()),
		events: {
			'click .element-value': 'onClickFieldValue',
			'click .element-idx': 'onClickFieldIdx'
		},

		initialize: function(opts){		
			this.mode = opts.mode || 'display';
			this.idx = opts.idx;
			this.path = opts.path;
			this.elementView = opts.view;
			this.elementView.mode = opts.mode;
			this.model = this.elementView.model;

			this.listenTo(this.elementView, 'changeMode', function(mode){
				this.changeMode(mode);
			});

			this.listenTo(this.model, 'change', this.emitChange);
		},

		changeMode: function(mode){
			if(!mode)
				mode = this.mode == 'edit' ? 'display' : 'edit';
			this.mode = mode;
			this.elementView.changeMode(mode);
			this.render();
		},

		render: function(){
			console.log("RENDERING ARRAY ELEMENT");
			this.$el
				.html(this.tpl({path: this.path, idx: this.idx, mode: this.mode}))
				.find('.element-value')
					.html(this.elementView.el)
			;
			this.elementView.render();
			this.elementView.delegateEvents();
			return this;
		},

		onClickFieldValue: function(e){
			if(this.mode == 'edit')
				return;

			var element = $(e.target).closest('.array-element');
			if(element.data('path') == this.path)
				this.changeMode();
		},

		onClickFieldIdx: function(e){
			var element = $(e.target).closest('.array-element');
			if(element.data('path') == this.path)
				this.changeMode();
		},
	});

	var ArrayTypeView = Backbone.View.extend({
		displayTpl: _.template($(tplSource).find('#arrayTpl').html()),
		editTpl: _.template($(tplSource).find('#arrayEditTpl').html()),
		elementFormTpl: _.template($(tplSource).find('#elementFormTpl').html()),
		className: 'field field-object',

		events: {
			'click .array-add-element': 'onAddField',
			'click .element-edit-ok': 'onClickFieldOk'
		},

		initialize: function(opts){
			var me = this;
			this.path = opts.path;
			this.subViews = [];
			this.mode = opts.mode || 'display';

			//Ensure backbone model for listening to changes
			if(!(this.model.get('value') instanceof Backbone.Collection))
				this.model.set('value', new Backbone.Collection(this.model.get('value')));

			_.each(this.model.get('value'), function(element, idx){	
				var	elementPath = me.path + '.' + idx,
					elementType = dispatcher.getDataType(element),
					elementView = dispatcher.getView(elementType, elementPath, element)
				;
				me.subViews[idx] = new ArrayElementView({
					view: elementView,
					path: elementPath,
					idx: idx,
					mode: 'display'
				});

				me.listenTo(me.subViews[idx].model, 'destroy', function(subViewModel){
					me.subViews[idx].remove();
					delete me.subViews[idx];
					// Update parent model:					
					//this.model.get('value').unset(idx);					
				});				

			});

			this.model.set('value', new Backbone.Collection(this.model.get('value')));
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model.get('value'), 'change add remove', this.render);
		},

		render: function(){
			console.log("RENDERING ARRAY");
			var tpl = this.editTpl;
			if(this.mode == 'display')
				tpl = this.displayTpl;

			this.$el
				.html(tpl({path: this.path, value: this.model.get('value')}))
				.attr('class', this.className + ' field-mode-' + this.mode)
			;
			this.delegateEvents();

			if(this.mode == 'edit'){
				var $props = this.$('.array-elements');
				_.each(this.subViews, function(subView){
					$props.append(subView.el);
					subView.render();
					subView.delegateEvents();
				});

				if(_.isEmpty(this.subViews))
					console.log("empty");
					this.onAddField();
			}

			return this;
		},


		onAddField: function(){			
			var me = this;
			this.$('a.array-add-element')
				.replaceWith(this.elementFormTpl({
					types: dispatcher.typeNames,
					element: {type:''},
					idx: this.model.get('value').length
					//path: this.path
				}));
			setTimeout(function(){
				me.$('input').focus();
			},50);
		},

		onClickFieldOk: function(e){
			e.preventDefault();
			var $form = $(e.target).closest('form');
			this.saveField($form);
		},

		saveField: function($form) {
			
			var me = this,
				idx = this.model.get('value').length,
				type = $form.find('select').val()
			;
			
			if(!type)
				return console.log('You need to set a type for the element');

			this.subViews[idx] = new ArrayElementView({
				view: dispatcher.getView(type, this.path + '.' + idx),
				idx: idx,
				path: this.path + '.' + idx,
				mode: 'edit'
			});

			this.model.get('value').add(this.subViews[idx].model);
		},

		changeMode: function(mode){
			if(!mode)
				mode = this.mode == 'edit' ? 'display' : 'edit';
			this.mode = mode;
		},
		getValue: function(){
			var value = [];

			_.each(this.subViews, function(subView, index){
				value.push(subView.elementView.getValue());
			});
			return value;
		}
	});

	dispatcher.registerType({
		id: 'array',
		name: 'Array',
		View: ArrayTypeView,
		defaultValue: []
	});


	return {
		TYPES: DATATYPE,
		ObjectView: ObjectTypeView,
		StringView: StringTypeView,
		IntegerView: IntegerTypeView,
		FloatView: FloatTypeView,
		BooleanView: BooleanTypeView,
		ArrayView: ArrayTypeView,
		FieldModel: FieldModel
	};
});