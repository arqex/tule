define(['jquery', 'backbone', 'modules/navigation/navigationModels'], 
	function($, Backbone, Navigation){

	var NavigationController = Backbone.View.extend({
		initialize: function(opts){	
			this.navigation = new Navigation.NavCollectionView({
				collection: new Navigation.NavCollection(opts.routes)				
			}); 
		},

		render: function(){
			this.navigation.render();
			this.el = this.navigation.el;
			this.selectCurrentNavElement(); // Caution! Maybe is wrong this selector
		},

		selectCurrentNavElement: function() {
			$('.navitem').removeClass('navcurrent');
			$( '.navlink[href="'+location.pathname+'"]' ).closest('.navitem').trigger('currentNavigation');
		},

		selectFirstNavElement: function() {
			$( '.navlink[href="'+location.pathname+'"]' ).closest('.navitem').trigger('firstNavigation');
		}
	});

	return NavigationController;
});