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

			openNavigation: function(target, stackedHeight){
				target.children().each(function(){
					$(this).children('a').removeClass('navcurrent');
				});
				stackedHeight += target.children().length * 37;
				target.css('max-height',  stackedHeight + 'px');
				var parent = target.parent().closest('.navsubitem');
				if(parent.length > 0)
					this.openNavigation(parent, stackedHeight);
			},

			manager: function(route) {
				var target 	= $('.navlink[href="' + route + '"]');

				target.next().length > 0
					? this.openNavigation(target.next(), 0)
					: this.openNavigation(target.closest('.navsubitem'), 0);

				if(target)
					target.addClass('navcurrent');
			}
		});

	return NavigationController;
});	