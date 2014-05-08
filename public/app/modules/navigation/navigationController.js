define(['jquery', 'backbone', './navigationModels', './navigationViews'],
	function($, Backbone, NavModels, NavViews){

		var NavigationController = Backbone.View.extend({
			initialize: function(opts){	
				this.navigation = new NavViews.NavCollectionView({
					collection: new NavModels.NavCollection(opts.routes)				
				});			
			},

			render: function(){
				this.navigation.render();
				this.el = this.navigation.el;			
			},

			highlightNavitem: function(route) {
				var target 		= $('.navlink[href="' + route + '"]'),
					parent 		= false,
					maxHeight 	= 0
				;

				target.length > 0
					? parent = target.closest('.navsubitem')
					: parent = this.$el.children();

				maxHeight = parent.children().length * 38

				parent.find('.navcurrent').removeClass('navcurrent');
				parent.css('max-height', maxHeight + 'px');

				if(target)
					target.addClass('navcurrent');
			}
		});

	return NavigationController;
});	