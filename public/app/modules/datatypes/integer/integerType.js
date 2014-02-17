"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./integerTypeTpl.html',
	'modules/datatypes/dispatcher'
];

define(deps, function($,_,Backbone, tplSource, dispatcher){

	var IntegerTypeView = dispatcher.BaseView.extend({
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
		inline: true,
		View: IntegerTypeView
	});

	return IntegerTypeView;
});