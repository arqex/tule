"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./floatTypeTpl.html',
	'modules/datatypes/dispatcher'
];

define(deps, function($,_,Backbone, tplSource, dispatcher){
	var FloatTypeView = dispatcher.BaseView.extend({
		tpl: _.template($(tplSource).find('#floatTpl').html()),
		editTpl: _.template($(tplSource).find('#floatEditTpl').html()),
		events: {
			'onKeyup form': 'onKeyup',
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

		onKeyup: function(e){
			if(e.which == 13){
				e.preventDefault();
				this.save();
				this.trigger('changeMode', 'display');
			} else if (e.which == 27) {
				e.preventDefault();
				this.cancel();
				this.trigger('changeMode', 'display');
			}
		},

		save: function(){
			this.model.set('value', parseFloat(this.$('input').val()));
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
		View: FloatTypeView,
		controls: true
	});

	return FloatTypeView;
});