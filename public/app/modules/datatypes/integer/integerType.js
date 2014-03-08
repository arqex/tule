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
			'keyup form': 'onKeyup'
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
			this.model.set('value', parseInt(this.$('input').val()), 10);
		},
	});

	dispatcher.registerType({
		id: 'integer',
		name: 'Integer',
		defaultValue: 0,
		inline: true,
		View: IntegerTypeView,
		controls: true
	});

	return IntegerTypeView;
});