"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./arrayTypeTpl.html',
	'modules/datatypes/dispatcher', 'jquery.ui.sortable'
];

define(deps, function($,_,Backbone, tplSource, dispatcher){

	var ArrayTypeView = dispatcher.BaseView.extend({
		displayTpl: _.template($(tplSource).find('#arrayTpl').html()),
		editTpl: _.template($(tplSource).find('#arrayEditTpl').html()),
		className: 'field field-object',

		events: {
			'click .array-add-element': 'onAddElement'
		},

		defaultTypeOptions: {
			elementsType: false
		},

		initialize: function(opts){
			var me = this,
				collection = new Backbone.Collection([])
			;

			this.subViews = [];
			this.mode = 'display';			

			_.each(this.model.get('value'), function(element, idx){
				var elementView = new dispatcher.DataElementView({
					key: idx,
					datatype: me.typeOptions.elementsType,
					value: element
				});

				me.subViews[idx] = elementView;

				collection.add(elementView.model);
			});

			//Store a collection to track the changes
			this.collection = collection;

			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.collection, 'change add remove', this.render);
			this.listenTo(this.collection, 'destroy', this.deleteElements);
		},

		render: function(){
			var tpl = this.editTpl,
				me  = this;
			if(this.mode == 'display')
				tpl = this.displayTpl;

			this.$el
				.html(tpl({
					idx: this.collection.length,
					path: this.path,
					value: this.collection,
					cid: this.cid
				}))
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

				if(!this.subViews.length)
					this.onAddElement();
			}

			var oldidx, newidx;
			this.$('.array-elements').sortable({
				start: function(event, ui) {
					oldidx = $(ui.item).index();
				},
				update: function(event, ui) {
					newidx = $(ui.item).index();
					me.remake(newidx, oldidx);
				}
			});
			return this;
		},

		remake: function(newidx, oldidx){
			this.subViews.splice(newidx, 0, this.subViews.splice(oldidx, 1)[0]);

			_.each(this.subViews, function(subView, idx){
				subView.key = idx;
				subView.label = idx;
			});

			var model = this.collection.at(oldidx);
			this.collection.remove(model, {silent: true});
			this.collection.add(model, {at: newidx});
		},

		onAddElement: function(e){
			if(e){
				e.preventDefault();
				var cid = $(e.target).data('cid');
				if(this.cid != cid)
					return;
			}

			var me = this,
				idx = this.collection.length,
				newElement = new dispatcher.DataElementView({
					datatype: this.typeOptions.elementsType,
					key: idx,
					label: idx,
					mode: this.typeOptions.elementsType ? 'edit' : 'display',
					isNew: true
				})
			;


			newElement.render();
			this.$('a.array-add-element[data-cid=' + this.cid + ']')
				.replaceWith(newElement.el);

			setTimeout(function(){
				me.$('input').first().focus();
			},50);

			this.listenTo(newElement, 'elementOk', function(elementData){
				if(newElement.datatype){
					newElement.isNew = false;
					this.saveElement(newElement);
				}
				else
					this.createElement(elementData, newElement);
				this.stopListening(newElement, 'elementOk');
				this.stopListening(newElement, 'elementCancel');

				this.listenTo(newElement, 'elementOk', function(){
					this.switchFocus();
				});
			});

			this.listenTo(newElement, 'elementCancel', function(){
				if(!this.collection.length)
					this.trigger('changeMode', 'display');
				this.render();
				this.stopListening(newElement, 'elementOk');
				this.stopListening(newElement, 'elementCancel');
				newElement.remove();
			});
		},

		createElement: function(data, newElement){
			newElement.datatype = data.datatype;
			newElement.mode = 'edit';
			newElement.typeOptions = data.typeOptions;
			newElement.createModel();
			newElement.createTypeView();
			newElement.isNew = false;

			this.saveElement(newElement);

			this.listenTo(newElement, 'elementOk', function(){
				this.switchFocus();
			});
		},

		saveElement: function(newElement) {
			this.subViews[parseInt(newElement.key, 10)] = newElement;

			this.collection.add(newElement.model);
		},

		deleteElements: function(idx){
			this.subViews.splice(idx,1);

			while (this.subViews.length > idx) {
				var subView = this.subViews[idx];
				subView.key = idx;
				subView.label = idx;
				idx++;
			}

			// Remove the model from the collection
			this.collection.remove(this.collection.at(idx));

			if(!this.collection.length)
				this.trigger('changeMode', 'display');
		},

		getValue: function(){
			var value = [];

			_.each(this.subViews, function(subView){
				value.push(subView.typeView.getValue());
			});

			return value;
		},

		switchFocus: function(){
			var addElement = this.$el.find('.add-element');
			if(addElement.data('cid') == this.cid)
				addElement.focus();
		}
	});

	dispatcher.registerType({
		id: 'array',
		name: 'Array',
		View: ArrayTypeView,
		inline: false,
		defaultValue: []
	});

	return ArrayTypeView;
});