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
				this.$el
					.html('')
					.append(this.navigation.el);
			},

			openNavigation: function(target, stackedHeight){
				target.children().each(function(){
					$(this).children('a').removeClass('navcurrent');
				});
				stackedHeight += target.children().length * ($(target.children()[0]).height() + 10);
				target.css('max-height',  stackedHeight + 'px');
				var parent = target.parent().closest('.navsubitem');
				if(parent.length > 0)
					this.openNavigation(parent, stackedHeight);
			},

			manager: function(route) {
				$('.navsubitem:not(.first-sub)').css('max-height', '0px');
				var me = this;
				setTimeout(function(){
					var target 	= $('.navlink[href="' + route + '"]');

					target.next().length > 0
						? me.openNavigation(target.next(), 0)
						: me.openNavigation(target.closest('.navsubitem'), 0);

					if(target)
						target.addClass('navcurrent');
				}, 500);
			}
		});

	return NavigationController;
});
