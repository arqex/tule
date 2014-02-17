"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./booleanTypeTpl.html',
	'modules/datatypes/dispatcher'
];

define(deps, function($,_,Backbone, tplSource, dispatcher){
	var BooleanTypeView = Backbone.View.extend({
		editTpl: _.template($(tplSource).find('#booleanEditTpl').html()),
		events: {
			'click input:checkbox': 'saveBoolean'
		},

		render: function(){
			var me = this,
				tpl = this.editTpl
			;

			this.$el.html(tpl({value: this.model.get('value')}));
		},

		changeMode: function(){
			// Forced by interface. Useless. Ignore it.
		},

		saveBoolean: function(){
			if(this.$('input:checked').length == 1)
				this.model.set('value', true);
			else
				this.model.set('value', false);

		},

		getValue: function(){
			return this.model.get('value');
		}
	});

	dispatcher.registerType({
		id: 'bool',
		name: 'Boolean',
		defaultValue: false,
		inline: true,
		View: BooleanTypeView
	});

	return BooleanTypeView;
});