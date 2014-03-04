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
			'click .array-add-element': 'onAddField'
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

				me.listenTo(elementView, 'destroy', function(idx){
					me.deleteElements(idx);
				});
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

				if(!this.subViews.length){
					console.log("empty");
					this.onAddField();
				}
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
			/* //Better to not modify prototypes
			Array.prototype.move = function (from, to) {
			  this.splice(to, 0, this.splice(from, 1)[0]);
			};
			this.subViews.move(oldidx,newidx);
			*/

			this.subViews.splice(newidx, 0, this.subViews.splice(oldidx, 1)[0]);

			_.each(this.subViews, function(subView, idx){
				subView.key = idx;
				subView.label = idx;
			});

			var model = this.collection.at(oldidx);
			this.collection.remove(model, {silent: true});
			this.collection.add(model, {at: newidx});
		},

		onAddField: function(e){
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
					mode: this.typeOptions.elementsType && !this.collection.length ? 'edit' : 'display'
				})
			;

			newElement.render();
			this.$('a.array-add-element[data-cid=' + this.cid + ']')
				.replaceWith(newElement.el);

			setTimeout(function(){
				me.$('input').focus();
			},50);

			this.listenTo(newElement, 'elementEdited', function(elementData){
				this.saveField(elementData, newElement);
			});
		},

		saveField: function(data, newElement) {
			newElement.datatype = data.datatype;
			newElement.mode = 'edit';
			newElement.typeOptions = data.typeOptions;
			newElement.createModel();

			this.subViews[parseInt(data.key, 10)] = newElement;

			this.collection.add(newElement.model);

			this.listenTo(newElement.model, 'destroy', function(){
				var idx = newElement.key;
				this.deleteElements(idx);
			});
		},

		deleteElements: function(idx){
			this.subViews.splice(idx,1);

			while (this.subViews.length > idx) {
				var subView = this.subViews[idx];
				subView.key = idx;
				subView.label = idx;
				idx ++;
			}


			// Remove the model from the collection
			this.collection.remove(this.collection.at(idx));
		},

		getValue: function(){
			var value = [];

			_.each(this.subViews, function(subView){
				value.push(subView.typeView.getValue());
			});
			return value;
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