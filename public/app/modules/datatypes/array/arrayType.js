var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./arrayTypeTpl.html',
	'modules/datatypes/datatypeViews', 'jquery.ui.sortable'
];

define(deps, function($,_,Backbone, tplSource, DatatypeViews){
	"use strict";

	var templates = DatatypeViews.DataTypeView.prototype.extractTemplates(tplSource);

	var ArrayTypeView = DatatypeViews.DataTypeView.extend({
		displayTpl: templates.arrayTpl,
		editTpl: templates.arrayEditTpl,

		events: {
			'click .js-array-add-element': 'onAddElement',
			'click .js-array-close': 'onClickClose'
		},

		defaultTypeOptions: {
			elementsType: false
		},

		defaultViewOptions: {
			closeable: true
		},

		defaultModelValue: [],

		initialize: function(opts){
			var me = this,
				// Make sure our model value is an array
				value = this.model.get('value') || []
			;

			// And re-set it
			this.model.set('value', value, {silent: true});

			this.createSubViews();

			this.listenTo(this.model, 'change', this.render);
		},

		createSubViews: function() {
			var me = this,
				arrayValue = this.model.get('value'),
				datatype = this.typeOptions.elementsType
			;

			me.subViews = [];

			_.each(arrayValue, function(element, index){
				me.subViews.push(me.createSubView(index, datatype, element));
			});
		},

		createSubView: function(index, datatype, value) {
			var me = this,
				view = new DatatypeViews.DataElementView({
					key: index,
					datatype: datatype,
					value: value
				})
			;

			this.listenTo(view, 'updated', this.updateElement);
			this.listenTo(view, 'delete', this.deleteElement);

			return view;
		},

		render: function(){
			var me  = this,
				mode = this.state('mode'),
				tpl = mode == 'edit' ? this.editTpl : this.displayTpl
			;

			//Render the template
			this.$el
				.html(tpl(_.extend({cid: this.cid}, this.getTemplateData())))
			;

			this.delegateEvents();

			if(this.state('mode') == 'edit'){
				var $props = this.$('.js-array-elements');
				_.each(this.subViews, function(subView){
					$props.append(subView.el);
					subView.render();
					subView.delegateEvents();
				});

				if(!this.subViews.length)
					this.onAddElement();
				else
					this.renderControls();


				this.initSortable();
			}

			return this;
		},

		renderControls: function(){
			var controls = this.$('.js-array-controls[data-cid=' + this.cid + ']').html('');

			controls.append(templates.addElement({cid: this.cid}));

			if(this.viewOptions.closeable)
				controls.append(templates.closeElements());
		},

		reindex: function(index1, index2){
			var toTheEnd = typeof index2 == 'undefined',
				from = toTheEnd ? index1 : Math.min(index1, index2),
				to = toTheEnd ? this.subViews.length - 1 : Math.max(index1, index2)
			;

			for (var i = from; i <= to; i++) {
				var view = this.subViews[i];
				view.model.set({key: i, label: i});
			};
		},

		onAddElement: function(e){
			if(e){
				e.preventDefault();// If this array is not the one who triggers the event, return
				if(this.cid != $(e.target).data('cid'))
					return;
			}

			// If we already have a datatype, just add a new element.
			var elementType = this.typeOptions.elementsType;
			if(elementType){
				return this.addElement(elementType);
			}

			// TODO: Otherwise, render the new element dialog
			var me = this,
				idx = this.subViews.length,
				newElement = new DatatypeViews.DataElementCreationView({
					key: idx,
					label: idx,
					editKey: false,
					title: 'New element'
				})
			;

			newElement.render();
			this.$el.children('.js-array-controls')
				.html(newElement.el)
			;

			setTimeout(function(){
				me.$('input').first().focus();
			},50);

			this.listenTo(newElement, 'ok', function(elementData){

				this.stopListening(newElement);
				newElement.remove();

				this.$el.children('.js-array-controls')
					.html('')
					.append(templates.addElement({cid: this.cid}))
					.append(templates.closeElements())
				;

				this.addElement(elementData.datatype);
			});

			this.listenTo(newElement, 'cancel', function(){
				this.render();
				this.stopListening(newElement);
				newElement.remove();
			});
		},

		addElement: function(datatype, value){
			var index = this.subViews.length,
				view = this.createSubView(index, datatype, value)
			;

			// Add the value to the model
			this.updateElement(index, value);

			// Render the subview
			this.subViews.push(view);
			this.$('.js-array-elements').append(view.el);
			view.render();
			view.delegateEvents();
			view.state('mode', 'edit');
		},

		deleteElement: function(idx){
			this.subViews.splice(idx,1);
			this.reindex(idx);

			// If there is no elements change to display mode
			if(!this.subViews.length)
				this.trigger('edit:cancel');

			this.model.set('value', this.getValue());
			console.log(this.model.get('value'));
		},

		updateElement: function(index, value){
			var modelValue = this.model.get('value');
			modelValue[index] = value;
			this.model.set('value', modelValue);

			console.log(this.model.get('value'));
		},

		onClickClose: function(e){
			if(e)
				e.preventDefault();

			if(this.viewOptions.closeable)
				this.trigger('edit:cancel');
		},

		getValue: function(){
			var value = [];

			_.each(this.subViews, function(subView){
				value.push(subView.typeView.model.get('value'));
			});

			return value;
		},

		initSortable: function(){
			var me = this,
				oldidx, newidx
			;

			this.$('.js-array-elements').sortable({
				placeholder: 'tule-array-placeholder',
				helper: 'clone',
				handle: '.tuleDEKey',
				delay: 200,
				start: function(event, ui) {
					oldidx = ui.item.index();
					ui.placeholder.css({width: ui.helper.width(), height: ui.helper.height()});
					ui.helper.addClass('tule-array-sorting');
				},
				update: function(event, ui) {
					newidx = ui.item.index();
					me.subViews.splice(newidx, 0, me.subViews.splice(oldidx, 1)[0]);
					me.reindex(newidx, oldidx);
					me.model.set('value', me.getValue());
				}
			});
		}
	});

	return {
		id: 'array',
		name: 'Array',
		View: ArrayTypeView,
		defaultValue: [],
	};
});