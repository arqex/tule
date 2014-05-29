'use strict';

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./tpls/navItem.html',
	'./navigationModels'
];

define(deps, function($, _, Backbone, tplSource, NavModels){

	var NavItemView = Backbone.View.extend({
		className: 'navitem',
		tpl: _.template(tplSource),

		render: function(){
			this.$el.html(this.tpl(this.model.toJSON()));
			if (this.model.get('subItems').length > 0) {
				var innerCollection = new NavModels.NavCollection();
				_.each(this.model.get('subItems'), function(item){
					item = new NavModels.NavItem(item);
					innerCollection.add(item);
				});

				var nav = new NavCollectionView({
					collection: innerCollection
				});

				this.$el.append(nav.el);
				nav.render();
			}
		},

	});

	var NavCollectionView = Backbone.View.extend({
		className: 'navsubitem',
		subViews: {},
		render: function(){
			var me = this;
			this.$el.html();
			if(this.$el.parent().length == 0)
				this.$el.addClass('first-sub');
			this.collection.each(function(navItem){
				if(navItem.get('url') == '0')
					return
					
				var subView = me.subViews[navItem.get('text')];
				if(!subView){
					subView = new NavItemView({model: navItem});
					subView.render();
					me.subViews[navItem.get('text')] = subView;
				}
				me.$el.append(subView.$el);
			});
		}
	});

	return {
		NavItemView: NavItemView,
		NavCollectionView: NavCollectionView
	};
});
