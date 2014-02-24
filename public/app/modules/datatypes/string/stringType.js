"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./stringTypeTpl.html',
	'modules/datatypes/dispatcher'
];

define(deps, function($,_,Backbone, tplSource, dispatcher){

	var StringTypeView = dispatcher.BaseView.extend({
		tpl: _.template($(tplSource).find('#stringTpl').html()),
		editTpl: _.template($(tplSource).find('#stringEditTpl').html()),
		events: {
			'click .string-ok': 'onClickOk',
			'keyup form': 'onKeyup',
			'click .string-cancel': 'onClickCancel'
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
		inline: true,
		View: StringTypeView
	});

	return StringTypeView;

});