define(['jquery', 'underscore', 'backbone', 'text!.tpls/navItem.html'],
    function($,_,Backbone, tplSource) {

    // Models
    var NavItem = Backbone.Model.extend({
        defaults: {
            text: false,
            url: false,
            subItems: []
        }
    });

    var NavCollection = Backbone.Collection.extend({
        model: NavItem,
    });

    // Views
    var NavItemView = Backbone.View.extend({
        className: 'navitem',
        tpl: _.template(tplSource),
        events: {
            'click .nested': 'openNavigation',
            'currentNavigation': 'openNavigation',
            'firstNavigation': 'firstNavigation'
        },
        render: function(){
            this.$el.html(this.tpl(this.model.toJSON()));
            if (this.model.get('subItems').length > 0) {
                var innerCollection = new NavCollection();
                _.each(this.model.get('subItems'), function(item){
                    item = new NavItem(item);
                    innerCollection.add(item);
                });

                var nav = new NavCollectionView({
                    collection: innerCollection
                });

                this.$el.append(nav.el);
                nav.render();
            }
        },
        openNavigation: function(e){
            e.preventDefault();
            if (this.$el.children('a').is(e.target)){
                var target = $(e.target).closest('.navitem').children('div');
                // The addition in the end equals the padding property
                mH = $( target ).find('.navitem').length * (this.$( '.navitem' ).height()+10);
                target.css('max-height') === '0px' ? target.css('max-height', mH+'px') : target.css('max-height', '0px');
            }
            if (location.pathname == this.$el.children('a').attr('href'))
                this.$el.addClass('navcurrent');
        },
        firstNavigation: function(e){
            e.preventDefault();
            var target = this.$el.parent();
            if (target[0].className != 'navigation') {
                // The addition in the end equals the padding property
                mH = $( target ).find('.navitem').length * ($( '.navitem' ).height()+10);
                target.css('max-height') === '0px' ? target.css('max-height', mH+'px') : target.css('max-height', '0px');
            }
            if (location.pathname == this.$el.children('a').attr('href'))
               this.$el.addClass('navcurrent');
        }
    });

    var NavCollectionView = Backbone.View.extend({
        className: 'navsubitem',
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