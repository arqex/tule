define(['jquery', 'underscore', 'backbone', 'text!modules/nav/navItem.html'],
    function($,_,Backbone, tplSource) {

    // Models
    var NavItem = Backbone.Model.extend({
        defaults: {
            url: false,
            subItems: []
        }
    });

    var NavCollection = Backbone.Collection.extend({
        model: NavItem
    });

    // Views
    var NavItemView = Backbone.View.extend({
        className: 'navitem',
        tpl: _.template(tplSource),
        render: function(){
            this.$el.html(this.tpl(this.model.toJSON()));
        }
    });

    var NavCollectionView = Backbone.View.extend({
        subViews: {},
        render: function(){
            var me = this;
            this.$el.html();
            this.collection.each(function(navItem){
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
        NavItem: NavItem,
        NavCollection: NavCollection,
        NavItemView: NavItemView,
        NavCollectionView: NavCollectionView
    };
});