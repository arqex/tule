var deps = [
	'underscore', 'jquery', 'backbone', 'react'
];

define( deps, function( _, $, Backbone, React ){
	'use strict';

	var ReactView = Backbone.View.extend({
		initialize: function( options ){
			this.tuleSettings = options.tuleSettings;
			console.log( this.tuleSettings );
			this.fetchComponent()
				.then( this.render.bind( this ) )
			;
		},

		render: function(){
			if( !this.component )
				this.$el.html('Loading...');
			else
				React.render( this.component, this.el );

			return this;
		},

		fetchComponent: function(){
			var me = this,
				deferred = $.Deferred()
			;

			require([ this.tuleSettings.url.assets + '/' + this.componentUrl + '#' ], function(Component){
				me.component = React.createElement( Component, {store: me.store} );
				deferred.resolve();
			});

			return deferred.promise();
		}
	});

	return ReactView;
});