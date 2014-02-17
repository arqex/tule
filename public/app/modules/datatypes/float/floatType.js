"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./floatTypeTpl.html',
	'modules/datatypes/dispatcher'
];

define(deps, function($,_,Backbone, tplSource, dispatcher){
	var FloatTypeView = Backbone.View.extend({
		tpl: _.template($(tplSource).find('#floatTpl').html()),
		editTpl: _.template($(tplSource).find('#floatEditTpl').html()),
		events: {
			'click .float-ok': 'onClickOk',
			'onKeyup form': 'onKeyup',
			'click .float-cancel': 'onClickCancel'
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
		inline: true,
		View: FloatTypeView
	});

	return FloatTypeView;
});