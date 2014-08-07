var deps = [
	'jquery', 'underscore', 'backbone', 'baseView', 'text!./tpls/navigationTpls.html'
];

define(deps, function($,_,Backbone, BaseView, tplSource){
	var templates = BaseView.prototype.extractTemplates(tplSource);

	/**
	 * The whole navigation view. Controls items and item groups
	 * Options:
	 * 	- navigationData: an array with the navigation items as objects
	 * 		{url: 'Url of the item', text: 'Label to be shown in the item'}
	 */
	var NavigationView = BaseView.extend({
		tagName: 'ul',
		className: 'tuleNav',


		initialize: function(options){
			this.createItems(options.navigationData || []);
		},

		/**
		 * Create the item's subviews
		 * @param  {Object} data The navigation data
		 * @return {undefined}
		 */
		createItems: function(data){
			var me = this;

			this.collection = new Backbone.Collection(data);
			this.items = [];

			// Clean listeners up
			this.stopListening();

			this.collection.each(function(navigationItem){
				var item = navigationItem.get('subItems') ?
					new NavigationGroupView({model: navigationItem}) :
					new navigationItemView({model: navigationItem})
				;
				me.items.push(item);

				me.listenTo(item, 'selected', me.onChildSelected);
			});

			return this;
		},

		/**
		 * Render the navigation
		 * @return {this}
		 */
		render: function(){
			var el = this.el;

			//Empty the element
			el.innerHTML = '';

			//Append subitems
			_.each(this.items, function(item){
				item.render();
				el.appendChild(item.el);
				item.delegateEvents();
			});

			return this;
		},

		/**
		 * Refreshes the menu selecting the items that matches
		 * the current URL
		 *
		 * @return {undefined}
		 */
		select: function(url){
			_.each(this.items, function(item){
				item.select(url);
			});
		},

		/**
		 * When an item is clicked, propagates the selected event.
		 * @param  {String} url The url of the item clicked
		 * @return {undefined}
		 */
		onChildSelected: function(url){
			// Propagate event!
			this.trigger('selected', url);
		}
	});

	/**
	 * The view for groups of items. Basically it is a NavigationView with
	 * a clickable header.                                                                                            [description]
	 */
	var NavigationGroupView = NavigationView.extend({
		tagName: 'li',
		className: 'tuleNavItem tuleNavGroup',
		tpl: templates.navigationGroup,
		defaultStatus: {
			open: false
		},

		events: {
			'click >a': 'onClickHeader'
		},

		initialize: function(options){
			this.createItems(this.model.get('subItems'));

			// Listen to change on the open state
			this.listenTo(this.currentState, 'change:open', this.onOpenChange);
		},

		render: function(){
			var me = this,
				subList
			;

			this.el.innerHTML = this.tpl(_.extend(this.model.toJSON(), {state: this.currentState.toJSON()}));
			subList = this.$('.js-nav-subitems');

			//Append subitems
			_.each(this.items, function(item){
				item.render();
				subList.append(item.el);
				item.delegateEvents();
			});

			return this;
		},

		/**
		 * Opens the group when some of its items matches the current url.
		 * @return {boolean} True when the group is open.
		 */
		select: function(url){
			var found = false;
			_.each(this.items, function(item){
				found = item.select(url) || found;
			});

			this.state('open', found);
			return found;
		},

		onOpenChange: function(){
			if(this.state('open'))
				this.$el.addClass('tuleNavOpen');
			else
				this.$el.removeClass('tuleNavOpen');
		},

		/**
		 * When the group header is clicked, navigate to the first item url
		 * @return {undefined}
		 */
		onClickHeader: function(){
			if(this.items.length){
				// On click navigate to the first child URL
				Backbone.history.navigate(this.items[0].model.get('url'), {trigger: true});
			}
		}
	});

	/**
	 * The view for single items
	 */
	var navigationItemView = BaseView.extend({
		tagName: 'li',
		className: 'tuleNavItem',
		tpl: templates.navigationItem,
		defaultStatus: {
			selected: false
		},
		events: {
			'click a': 'onClick'
		},

		initialize: function(){
			// Listen to change on the selected state
			this.listenTo(this.currentState, 'change:selected', this.onSelectedChange);
		},

		render: function(){
			this.el.innerHTML = this.tpl(_.extend(this.model.toJSON(), {state: this.currentState.toJSON()}));

			return this;
		},

		onClick: function(e){
			this.trigger('selected', this.model.get('url'));
		},

		/**
		 * Check if the current URL matches the item's url. If so, the item
		 * turns selected.
		 * @return {boolean} True when the item's url matches the current one.
		 */
		select: function(url){
			var link = document.createElement('a');

			link.setAttribute('href', this.model.get('url'));

			if(link.href == url){
				this.state('selected', true);
				return true;
			}

			this.state('selected', false);
			return false;
		},

		onSelectedChange: function(){
			if(this.state('selected'))
				this.$el.addClass('tuleNavCurrent');
			else
				this.$el.removeClass('tuleNavCurrent');
		}
	});

	return NavigationView;
});