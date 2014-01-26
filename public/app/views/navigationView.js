define(['jquery', 'underscore', 'backbone', 'views/navigationItemView'], function($,_,Backbone,ItemView){
	/**
	 * The Navigation View is using the navigation node that is in the DOM as 'el' attribute.
	 */
	return Backbone.View.extend({
		subViews: {},
		render: function(){
			var me = this;
			this.$el.html();
			this.collection.each(function(navItem){
				var subView = me.subViews[navItem.get('text')]
				if(!subView){
					subView = new ItemView({model: navItem});
					subView.render();
					me.subViews[navItem.get('text')] = subView;
				}
				me.$el.append(subView.$el);
			});
		}
	});
});