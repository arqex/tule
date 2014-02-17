"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./arrayTypeTpl.html',
	'modules/datatypes/dispatcher', 'jquery.ui.sortable'
];

define(deps, function($,_,Backbone, tplSource, dispatcher){
	var ArrayElementView = Backbone.View.extend({
		tpl: _.template($(tplSource).find('#arrayElementTpl').html()),
		events: {
			'click .element-value': 'onClickFieldValue',
			'click .element-idx': 'onClickFieldIdx',
			'click .element-delete': 'onClickDelete'
		},

		initialize: function(opts){
			this.mode 	= opts.mode || 'display';
			this.idx 	= opts.idx;
			this.path 	= opts.path;
			this.elementView = opts.view;
			this.elementView.mode = opts.mode;
			this.model 	= this.elementView.model;
			this.inline = opts.inline;

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
			this.$el
				.html(this.tpl({path: this.path, idx: this.idx, mode: this.mode, inline:this.inline}))
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

		onClickDelete: function(e){
			e.preventDefault();

			var idx = $(e.target).closest('.array-element').data('key');
			if(this.idx == idx) {
				this.model.destroy();
			}
		},

		onClickFieldIdx: function(e){
			var element = $(e.target).closest('.array-element');
			if(element.data('path') == this.path)
				this.changeMode();
		},
	});


	var ArrayTypeView = dispatcher.BaseView.extend({
		displayTpl: _.template($(tplSource).find('#arrayTpl').html()),
		editTpl: _.template($(tplSource).find('#arrayEditTpl').html()),
		elementFormTpl: _.template($(tplSource).find('#elementFormTpl').html()),
		className: 'field field-object',

		events: {
			'click .array-add-element': 'onAddField',
			'click .element-edit-ok': 'onClickFieldOk'
		},

		defaultOptions: {
			path: 'nopath',
			model: 'display'
		}

		initialize: function(opts){
			var me = this;
			this.path = this.options.path;
			this.subViews = [];
			this.mode = this.options.mode;

			//Ensure backbone model for listening to changes
			//if(!(this.model.get('value') instanceof Backbone.Collection))
			//	this.model.set('value', new Backbone.Collection(this.model.get('value')));

			_.each(this.model.get('value'), function(element, idx){
				var	elementPath = me.path + '.' + idx,
					elementType = dispatcher.getDataType(element),
					elementView = dispatcher.getView(elementType, {path: elementPath}, element),
					elementInline = elementView.model.get('inline'),
					elementActualView = new ArrayElementView({
						view: elementView,
						path: elementPath,
						idx: idx,
						inline: elementInline,
						mode: 'display'
					})
				;
				me.subViews[idx] = elementActualView;

				me.listenTo(me.subViews[idx].model, 'destroy', function(subViewModel){
					var idx = elementActualView.idx;
					me.deleteElements(idx);
				});

			});

			this.model.set('value', new Backbone.Collection(this.model.get('value')));
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model.get('value'), 'change add remove', this.render);
		},

		render: function(){
			var tpl = this.editTpl,
				me  = this;
			if(this.mode == 'display')
				tpl = this.displayTpl;

			this.$el
				.html(tpl({
					idx:this.model.get('value').length,
					path: this.path,
					value: this.model.get('value')
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

				if(_.isEmpty(this.subViews))
					console.log("empty");
					this.onAddField();
			}

			var oldidx, newidx;
			this.$('.array-elements').sortable({
				start: function(event, ui) {
					this.oldidx = $(ui.item).index();
				},
				update: function(event, ui) {
					this.newidx = $(ui.item).index();
					me.remake(this.newidx, this.oldidx);
				}
			});
			return this;
		},

		remake: function(newidx, oldidx){
			Array.prototype.move = function (from, to) {
			  this.splice(to, 0, this.splice(from, 1)[0]);
			};
			this.subViews.move(oldidx,newidx);
			_.each(this.subViews, function(subView, idx){
				subView.idx = idx;
			});

			var model = this.model.get('value').at(oldidx);
			this.model.get('value').remove(model, {silent: true});
			this.model.get('value').add(model, {at: newidx});
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

			var elementActualView = new ArrayElementView({
				view: dispatcher.getView(type, {path: this.path + '.' + idx}),
				idx: idx,
				path: this.path + '.' + idx,
				mode: 'edit'
			});

			this.subViews[idx] = elementActualView;

			this.model.get('value').add(this.subViews[idx].model);

			this.listenTo(this.subViews[idx].model, 'destroy', function(){
				var idx = elementActualView.idx;
				me.deleteElements(idx);
			});
		},

		deleteElements: function(idx){
			this.subViews[idx].remove();
			this.subViews.splice(idx,1);
			var looper = idx + 1;
			while (this.subViews.length > idx) {
				this.subViews[idx].idx = ((this.subViews[idx].idx) - 1);
				idx ++;
			}
			var modelToDie = this.model.get('value').at(idx);
			this.model.get('value').remove(modelToDie);
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
		inline: false,
		defaultValue: []
	});

	return ArrayElementView;
});