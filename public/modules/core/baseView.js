"use strict";

define(['jquery', 'underscore', 'backbone', 'region', 'mixins'], function($, _, Backbone, Region, mixins){
	var BaseView = Backbone.View.extend({
		constructor: function(options){
			options = options || {};

			//Create the state model
			var state = options.state || this.defaultState || {};
			this.currentState = new Backbone.Model(state);

			Backbone.View.prototype.constructor.apply(this, arguments);
		},
		state: function(name, value, options){
			if(typeof value == 'undefined')
				return this.currentState.get(name);

			return this.currentState.set(name, value, options);
		},

		getTemplateData: function(){
			var data = {state: this.currentState.toJSON()};
			if(this.model)
				_.extend(data, this.model.toJSON());
			return data;
		},

		render: function() {
			this.$el.html(this.tpl(this.getTemplateData()));

			return this;
		},

		reTrigger: function(eventName) {
			var me =  this;
			return function(){
				// Add the event name to the arguments,
				// we need to convert the arguments to an actual
				// array to do so.
				var args = [eventName].concat(Array.prototype.slice.call(arguments, 0));
				me.trigger.apply(me, args);
			};
		},

		getInputs: function( $element ) {
			var i = 1,
				noName = 'noName',
				data = {},
				$el = $element || this.$el
			;

			$el.find('input, select, textarea').each(function(){
				var $input = $(this),
					name = $input.attr('name') || noName + i++,
					val
				;

				if( $input.attr('type') == 'checkbox') {
					val = $input.is(':checked');
				}
				else {
					val = $input.val();
				}

				data[name] = val;
			});

			return data;
		},

		remove: function() {
			if( this.onRemove )
				this.onRemove();

			Backbone.View.prototype.remove.apply(this, arguments);
		},

		// Clear subviews automatically
		onRemove: function() {

			if( this.regions ) {
				_.each( this.regions, function( r ){
					r.remove();
				});

				delete this.regions;
			}
			else if( this.subViews ) {
				_.each( this.subViews, function( v ){
					v.remove();
				});

				delete this.subViews;
			}
		}
	});


	// Add mixin utilities
	_.extend(BaseView.prototype, mixins.ExtractTemplates);

	return BaseView;
});
