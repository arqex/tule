"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./htmlTypeTpl.html',
	'modules/datatypes/datatypeViews',
	'medium-editor',
	'css!./medium-editor.css'
];

define(deps, function($,_,Backbone, tplSource, DatatypeViews, MediumEditor){

	var HtmlTypeView = DatatypeViews.DataTypeView.extend({
		displayTpl: _.template($(tplSource).find('#htmlTpl').html()),
		editTpl: _.template($(tplSource).find('#htmlEditTpl').html()),

		initialize: function(){
			this.events = _.extend({}, this.events || {}, {
				'click a': 'preventLinks'
			});
		},


		getTemplateData: function(){
			var data = DatatypeViews.DataTypeView.prototype.getTemplateData.call( this );

			data.encoded = this.encodeEntities( data.value );

			return data;
		},

		encodeEntities: function( html ){
			return html.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
			   return '&#'+i.charCodeAt(0)+';';
			});
		},

		render: function() {
			DatatypeViews.DataTypeView.prototype.render.call( this );

			this.editor = new MediumEditor( this.$('.htmlEditor'), {
				buttons: ['bold', 'italic', 'underline', 'anchor', 'header1', 'header2', 'unorderedlist', 'image', 'justifyLeft', 'justifyCenter', 'justifyRight']
			});
		},

		preventLinks: function( e ) {
			e.preventDefault();
		},

		save: function() {
			var editor = this.$('.htmlEditor'),
				value = this.model.get('value')
			;

			if( editor.length )
				value = $.trim(editor.html());

			this.model.set( 'value', value );
			this.trigger('edit:ok', value);
		},


		getEditValue: function() {
			if(this.state('mode') == 'edit')
				return this.$('.htmlEditor').html();
			else
				return this.model.get('value');
		}
	});

	return {
		id: 'html',
		name: 'HTML',
		defaultValue: '',
		View: HtmlTypeView
	};

});