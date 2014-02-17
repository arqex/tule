"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./objectTypeTpl.html',
	'modules/datatypes/dispatcher'
];

define(deps, function($,_,Backbone, tplSource, dispatcher){
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
			this.inline = opts.inline;

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
				.html(this.tpl({inline:this.inline, path: this.path, key: this.key, mode: this.mode}))
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

	var ObjectTypeView = dispatcher.BaseView.extend({
		displayTpl: _.template($(tplSource).find('#objectTpl').html()),
		editTpl: _.template($(tplSource).find('#objectEditTpl').html()),
		fieldFormTpl: _.template($(tplSource).find('#fieldFormTpl').html()),
		className: 'field field-object',

		events: {
			'click .object-add-property': 'onAddField',
			'click .property-edit-ok': 'onClickFieldOk'
		},

		defaultOptions: {
			mode: 'display',
			path: 'nopath',
			customProperties: true
		},

		initialize: function(opts){
			var me = this;
			this.path = this.options.path;
			this.subViews = {};
			this.mode = this.options.mode;

			//Ensure backbone model for listening to changes
			if(!(this.model.get('value') instanceof Backbone.Model))
				this.model.set('value', new Backbone.Model(this.model.get('value')));

			_.each(this.model.get('value').toJSON(), function(fieldValue, fieldKey){
				var fieldPath = me.path + '.' + fieldKey,
					fieldType = dispatcher.getDataType(fieldValue),
					fieldView = dispatcher.getView(fieldType, {path:fieldPath}, fieldValue),
					fieldInline = fieldView.model.get('inline');
				;
				me.subViews[fieldKey] = new ObjectPropertyView({
					view: fieldView,
					path: fieldPath,
					key: fieldKey,
					inline: fieldInline,
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
				.html(tpl({
					path: this.path,
					value: this.model.get('value').toJSON(),
					customProperties: this.options.customProperties
				}))
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
				view: dispatcher.getView(type, {path: this.path + '.' + key}),
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
		inline: false,
		defaultValue: {}
	});

	return ObjectTypeView;
});