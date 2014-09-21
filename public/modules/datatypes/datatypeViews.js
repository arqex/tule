var deps = [
	'jquery', 'underscore', 'backbone', 'baseView', 'text!./dataElement.html', 'services', 'events',
	'autocomplete'
];
define(deps, function($,_,Backbone, BaseView, sourceTpl, Services, Events){
	'use strict';

	// The datatype service is stored as a private variable
	var service;
	Events.once('service:ready:datatype', function(){
		service = Services.get('datatype');
	});

	var templates = BaseView.prototype.extractTemplates(sourceTpl);

	var DataTypeView = BaseView.extend({
		defaultState: {
			mode: 'display'
		},

		events: {
			'click .js-DEok': 'onOk',
			'keydown input': 'onPressKey',
			'click .js-DEcancel': 'onCancel'
		},

		defaultViewOptions: {
			singleEditable: true
		},

		constructor: function(options){
			this.datatype = options.datatype || {id: 'string', options: {}};

			// Shortcut for the datatype options
			this.typeOptions = _.extend({}, (this.defaultTypeOptions || {}), (this.datatype.options || {}));

			// View options
			this.viewOptions = _.extend({}, (this.defaultViewOptions || {}), (options.viewOptions || {}));

			// Create a proper model in case there is not a model in the options
			if(!options.model)
				this.model = new Backbone.Model({value: options.value});

			// Shortcut for the datatype service
			this.service = service;

			BaseView.prototype.constructor.apply(this, arguments);
		},

		render: function() {

			var me = this,
				template = (this.state('mode') == 'edit') ? this.editTpl : this.displayTpl
			;

			this.$el.html(template(this.getTemplateData()));

			if(this.state('mode') == 'edit')
				setTimeout(function(){
					me.$('input').first().focus();
				}, 50);

			return this;
		},

		getTemplateData: function(){
			return _.extend({
					state: this.currentState.toJSON(),
					options: this.datatype.options,
					controls: this.getControlsTpl(),
					viewOptions: this.viewOptions
				}, this.model.toJSON())
			;
		},

		getEditValue: function(){
			if(this.state('mode') == 'edit')
				return this.$('input').val();
			return this.model.get('value');
		},

		/**
		 * Return the markup for the Ok & Cancel buttons when
		 * the data type is editable by itself.
		 * @return {[type]} [description]
		 */
		getControlsTpl: function(buttonText){
			if(!this.viewOptions.singleEditable)
				return '';

			return templates.dataElementControls({buttonText: buttonText || 'Ok'});
		},

		onOk: function(e){
			e.preventDefault();
			this.save();
		},

		onPressKey: function(e) {
			if(e.which == 13) // Press enter is like hit ok
				this.onOk(e);
		},

		save: function(e) {
			var input = this.$('input');

			if(!input.length)
				return console.log('Save not implemented');

			this.model.set('value', input.val());

			this.trigger('edit:ok', input.val());
		},

		onCancel: function(e){
			e.preventDefault();
			this.cancel();
		},

		cancel: function(){
			this.trigger('edit:cancel');
		}

	});

	var DataElementView = BaseView.extend({
		tpl: templates.dataElement,

		events: {
			'click .js-DEValue': 'toggleMode',
			'click .js-DEDelete': 'onClickDelete'
		},

		defaultState: {
			mode: 'display'
		},

		tagName: 'tr',

		className: 'js-DE tuleDE',

		defaults: {
			// Allow to delete the element?
			deleteable: true,

			// We need a datatype to create the object view
			datatype: false,

			// Show the ok and cancel buttons?
			singleEditable: true,

			// Editing on click?
			editable: true
		},

		initialize: function(options){
			// Set up all the properties defined in the defaults
			this.initModel(options);

			// Shortcut to the datatype service.
			this.service = service;

			// If some property definitions are given, use them for autocompletion
			this.propertyDefinitions = options.propertyDefinitions ? _.keys(options.propertyDefinitions) : [];

			// Create the type view using the value
			this.typeView = options.datatype ?
				service.get({
						datatype: options.datatype,
						value: options.value,
						viewOptions: {singleEditable: this.model.get('singleEditable')},
						state: this.currentState.toJSON()
					}) :
				service.guessAndGet({
					value: options.value,
					viewOptions: {singleEditable: this.model.get('singleEditable')},
					state: this.currentState.toJSON()
				})
			;

			// Add a class for the data type to allow styling datatypes individually
			this.$el.addClass('tuleDE-' + this.typeView.datatype.id + ' js-tuleDE-' + options.key);

			this.listenToEvents();

			// Datatypes can force the working mode
			var forceMode = this.typeView.forceMode;
			if(forceMode && forceMode != this.state('mode'))
				this.state('mode', forceMode);
		},

		initModel: function(options){
			var me = this,
				modelProperties = {
					key: options.key,
					label: options.label || options.key
				}
			;
			_.each(this.defaults, function(value, key){
				modelProperties[key] = (typeof options[key] != 'undefined') ? options[key] : value;
			});

			this.model = new Backbone.Model(modelProperties);
		},

		listenToEvents: function(){
			var me = this;

			// Update the mode of the type view on our mode updates.
			this.listenTo(this.currentState, 'change:mode', function(){
				var mode = this.state('mode'),
					forcedMode = this.typeView.forcedMode;

				if(!forcedMode || mode == forcedMode){
					me.typeView.state('mode', mode);
					me.render();
				}
			});

			this.listenTo(this.typeView, 'edit:ok', function(value){
				if(me.model.get('singleEditable'))
					me.state('mode', 'display');
			});

			// Trigger an event to let the parent know any value update
			this.listenTo(this.typeView.model, 'change:value', function(){
				me.trigger('updated', me.model.get('key'), me.typeView.model.get('value'));
			});

			this.listenTo(this.typeView, 'edit:cancel', function(){
				if(me.model.get('singleEditable'))
					me.state('mode', 'display');
			});

			//If some change is detected in the model (key updated), re-render
			this.listenTo(this.model, 'change', this.render);
		},

		/**
		 * Returns the current value in the element form when editing.
		 * If we are not editing, return the current mode value.
		 * @return {Mixed} Value of the element
		 */
		getEditValue: function(){
			if(this.state('mode') == 'edit')
				return this.typeView.getEditValue();
			return this.model.get('value');
		},

		render: function() {

			// Render the template
			this.$el.html(this.tpl(_.extend(this.getTemplateData(), {cid: this.cid})));

			// Add the type view and activate its events
			this.typeView.render();
			this.$('.js-DEValue').html(this.typeView.el);
			this.typeView.delegateEvents();

			return this;
		},

		toggleMode: function(e) {
			if(this.state('mode') == 'display'){
				this.state('mode', 'edit');
			}
		},

		onClickDelete: function(e){
			e.preventDefault();
			if($(e.currentTarget).data('cid') == this.cid)
				this.trigger('delete', this.model.get('key'));
		}
	});

	var DataElementCreationView = BaseView.extend({
		defaults: {
			datatype: false,
			editDatatype: true,
			key: '',
			label: '',
			editKey: true,
			okButtonText: 'Add',
			title: 'New property'
		},

		tpl: templates.dataElementCreation,

		tagName: 'tr',
		className: 'tuleDEC',

		events: {
			'click .js-DEC-ok': 'onOk',
			'click .js-DEC-cancel': 'onCancel'
		},

		initialize: function(options){
			this.initModel(options);

			// Save the definitions for autocomplete
			if(options.propertyDefinitions){
				this.propertyNames = _.keys(options.propertyDefinitions);
				this.propertyDefinitions = options.propertyDefinitions;
			}

			this.typeView = service.get({
				datatype: {id: 'field',	options: {}},
				viewOptions: {singleEditable: false}
			});
		},

		initModel: function(options){
			var me = this,
				modelProperties = {
					key: options.key,
					label: options.label || options.key
				}
			;
			_.each(this.defaults, function(value, key){
				modelProperties[key] = (typeof options[key] != 'undefined') ? options[key] : value;
			});

			this.model = new Backbone.Model(modelProperties);
		},

		render: function(){
			var me = this;

			this.$el.html(this.tpl(this.getTemplateData()));

			this.$('.js-DEC-type').html(this.typeView.el);

			this.typeView.state('mode', 'edit');

			this.typeView.render().delegateEvents();

			setTimeout(function(){
				var input = me.$('input'),
					select = me.$('select')
				;


				if(input.length) {
					if(me.propertyNames){
						input.autocomplete({
							lookup: me.propertyNames,
							onSelect: function(selected) {
								if(me.typeView){
									// Set the value in the type view
									me.typeView.model.set('value', me.propertyDefinitions[selected.value].datatype);
									me.typeView.render();
								}
							}
						});
					}
					input.focus();
				}
				else
					me.$('select').focus();
			}, 50);

			return this;
		},

		onOk: function(e) {
			e.preventDefault();

			var fieldData = {
				datatype: this.typeView.save().model.get('value'),
				key: this.$('.js-DECinput').val()
			};

			this.trigger('ok', fieldData);
		},

		onCancel: function(e) {
			e.preventDefault();

			this.trigger('cancel');
		}
	});

	return {
		DataTypeView: DataTypeView,
		DataElementView: DataElementView,
		DataElementCreationView: DataElementCreationView
	};

});