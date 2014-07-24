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

			this.selector = {
				controls: '.js-array-controls[data-cid=' + this.cid + ']',
				els: '.js-array-elements[data-cid=' + this.cid + ']',
				close: '.js-array-close[data-cid=' + this.cid + ']'
			};

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
				var els = this.$(this.selector.els);

				//On the first edit, create the property views
				if(!this.subViews)
					this.createSubViews();

				_.each(this.subViews, function(subView){
					els.append(subView.el);
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
			var controls = this.$(this.selector.controls).html('');

			controls.append(templates.addElement({cid: this.cid}));
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

			// Otherwise, render the new element dialog
			var me = this,
				idx = this.subViews.length,
				newElement = new DatatypeViews.DataElementCreationView({
					key: idx,
					label: idx,
					editKey: false,
					title: 'New element'
				}),
				controls = this.$(this.selector.controls)
			;

			newElement.render();
			this.$(this.selector.els).append(newElement.el);

			// Remove the controls
			controls.html('');

			this.listenTo(newElement, 'ok', function(elementData){

				this.stopListening(newElement);
				newElement.remove();

				// Restore the controls
				controls.append(templates.addElement({cid: this.cid}));

				this.addElement(elementData.datatype);

				// Update the counter
				this.$(this.selector.close).html(templates.elementCount({value: this.model.get('value')}));
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

			// Render the subview
			this.subViews.push(view);
			this.$(this.selector.els).append(view.el);
			view.render();
			view.delegateEvents();
			view.state('mode', 'edit');

			// Add the value to the model
			this.updateElement(index, value);
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
			var modelValue = this.model.get('value').splice(0);
			modelValue[index] = value;
			this.model.set('value', modelValue);
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

			this.$(this.selector.els).sortable({
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