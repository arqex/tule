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
		
		getValue: function(){
			return this.model.get('value');
		}
	});

	dispatcher.registerType({
		id: 'string',
		name: 'String',
		defaultValue: '',
		inline: true,
		View: StringTypeView,
		controls: true
	});

	return StringTypeView;

});