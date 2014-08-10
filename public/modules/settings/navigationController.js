var deps = [
	'jquery', 'underscore', 'backbone', 'services',

	'baseView',
	'pageController',

	'alerts',
	'events',

	'text!./tpls/navigationSettings.html',

	'jquery.ui.draggable',
	'jquery.ui.droppable'
];

define(deps, function($,_,Backbone, Services, BaseView, PageController, Alerts, Events, tplSources) {
	'use strict';

	var templates = BaseView.prototype.extractTemplates(tplSources);

	var NavigationController = BaseView.extend({
		tpl: templates.navigation(),
		settingsName: 'tuleNavigation',
		className: 'clearfix',

		events: {
			'click .js-navitems-header': 'onToggleItemsGroup',
			'click .js-item-title-edit': 'onItemEdit',
			'click .js-group-title-edit': 'onGroupEdit',
			'click .js-group-cancel': 'onGroupEditCancel',
			'click .js-item-cancel': 'onItemEditCancel',
			'click .js-group-ok': 'onGroupEditOk',
			'click .js-item-ok': 'onItemEditOk',
			'click .js-group-remove': 'onGroupRemove',
			'click .js-item-remove': 'onItemRemove',
			'click .js-nav-add-group': 'onAddGroup',
			'click .js-nav-ok': 'onSave'
		},

		initialize: function() {
			var me = this,
				deferred = $.Deferred(),
				itemsPromise
			;

			this.service = Services.get('settings');
			itemsPromise = this.service.get('navigation:items');

			this.service.get(this.settingsName)
				.then(function(navigation){
					itemsPromise.then(function(items){
						me.navigation = navigation.value;
						me.items = items.value;
						deferred.resolve();
					});
				})
			;

			this.loading = deferred.promise();
		},

		render: function() {
			var me = this;

			this.$el.html('Loading...');

			this.loading.then(function(){
				me.$el.html(me.tpl);

				me.$('.js-navitems').html(templates.items({groups: me.items}));
				me.renderCurrentNavigation();

				//open the first group
				me.$('.js-navitems-group').first()
					.addClass('tule-navitems-open');

				me.initSortable();
			});

			return this;
		},

		/**
		 * Renders the current navigation view and re-set the sortables.
		 */
		renderCurrentNavigation: function(){
			var output = this.navigation.length ? '' : templates.noItems(),
				subItems, item
			;

			for (var i = 0; i < this.navigation.length; i++) {
				item = this.navigation[i];
				subItems = '';
				// Groups
				if(item.subItems) {
					for (var j = 0; j < item.subItems.length; j++) {
						subItems += templates.navItem(_.extend({index: j}, item.subItems[j]));
					}

					output += templates.navGroup({text: item.text, subItems: subItems, index: i});
				}
				// Items
				else {
					output += templates.navItem(_.extend({index: i}, item));
				}
			}

			this.$('.js-nav-current').html(
				templates.currentNavigation(
					{groups: output}
				)
			);

			this.initSortable();
		},

		/**
		 * Initialize the draggable behavior for the lists.
		 */
		initSortable: function() {

			//It was not possible to use sortable
			//because of the nested items. The final solution uses some
			//div.tule-nav-droppoints to define where the items can be
			//dropped. Groups can only be dropped in the top level of the
			//navigation and items in the first and second level.
			var me = this,
				parent
			;

			//All the items in the current navigation are draggable
			this.$('.js-nav-sortable').draggable({
				revert: 'invalid',
				handle: '.js-nav-drag-handle',
				zIndex: 10,
				appendTo: 'body',
				start: function() {
					var $this = $(this);

					// Show the available drop points
					if($this.hasClass('js-nav-group'))
						me.$('.tule-nav-dropgroup').show();
					else{
						me.$('.tule-nav-droppoint').show();
						parent = $this.closest('.js-nav-group').css('z-index', 10);
					}

					// Hide the drop point after the current element.
					$this.siblings('.tule-nav-droppoint[data-index=' + $this.data('index') + ']')
						.hide()
					;
				},
				stop: function() {
					me.$('.tule-nav-droppoint').hide();

					if(parent)
						parent.css('z-index', 0);
					parent = false;
					$(this).removeAttr('style');
				}
			});

			//Initialize the drop points
			this.$('.tule-nav-droppoint').droppable({
				hoverClass: 'tule-nav-drag-hover',
				tolerance: 'pointer',
				drop: function(e, ui) {
					if(ui.draggable.hasClass('js-navitems-item')){
						$(this).replaceWith(ui.draggable.clone().removeAttr('style'));
					}
					else {
						$(this).replaceWith(ui.draggable.removeAttr('style'));
					}

					// Refresh current navigation
					me.navigation = me.getNavigationValue();
					me.renderCurrentNavigation();
				}
			});

			// Make the available items draggable too.
			this.$('.js-navitems-item').draggable({
				revert: true,
				revertDuration: 0,
				helper: 'clone',
				start: function() {
					// Activate drop points
					me.$('.tule-nav-droppoint').show();
				},
				stop: function() {
					me.$('.tule-nav-droppoint').hide();
				}
			});
		},

		/**
		 * Save the current navigation as tule navigation.
		 */
		saveNavigation: function(){
			var me = this;

			if(!this.navigation.length) {
				return Alerts.add({
					message: 'Add at least one element to the navigation.',
					level: 'error'
				});
			}

			this.service.save(this.settingsName, this.navigation)
				.then(function(){
					Alerts.add({
						message: 'Navigation updated.',
						autoclose: 6000
					});

					// Trigger the event to update the menu
					Events.trigger('navigation:updated', me.navigation);
				})
				.fail(function(err){
					console.log(err);
					Alerts.add({
						message: 'There was an error saving the navigation. Please retry.',
						level: 'error'
					});
				})
			;
		},

		onSave: function(e){
			e.preventDefault();
			this.saveNavigation();
		},

		getNavigationValue: function() {
			var updatedNav = [];

			// Go through the elements getting their values
			this.$('.js-nav-groups').children('.js-nav-element').each(function(){
				var item = $(this),
					navItem = {text: item.data('text')},
					subItems = []
				;

				// Groups
				if(item.hasClass('js-nav-group')){
					navItem.url = '#';
					item.find('.js-nav-element').each(function(){
						var subItem = $(this);
						subItems.push({
							text: subItem.data('text'),
							url: subItem.data('url')
						});
					});
					navItem.subItems = subItems;
				}

				// Items
				else {
					navItem.url = item.data('url');
				}

				updatedNav.push(navItem);
			});

			return updatedNav;
		},

		onToggleItemsGroup: function(e) {
			e.preventDefault();
			$(e.target).closest('.js-navitems-group')
				.toggleClass('tule-navitems-open')
			;
		},

		onItemEdit: function(e) {
			e.preventDefault();
			$(e.target).closest('.js-nav-item')
				.addClass('tule-nav-item-editing')
				.find('input').focus()
			;
		},

		onGroupEdit: function(e) {
			e.preventDefault();
			$(e.target).closest('.js-nav-group')
				.addClass('tule-nav-group-editing')
				.find('input').focus()
			;
		},

		onItemEditCancel: function(e) {
			e.preventDefault();
			$(e.target).closest('.js-nav-item')
				.removeClass('tule-nav-item-editing')
			;
		},

		onGroupEditCancel: function(e) {
			e.preventDefault();
			$(e.target).closest('.js-nav-group')
				.removeClass('tule-nav-group-editing')
			;
		},

		onGroupEditOk: function(e) {
			e.preventDefault();
			var $group = $(e.target).closest('.js-nav-group'),
				title = $.trim($group.find('input').val()),
				index = $group.data('index')
			;

			if(!title) {
				return Alerts.add({
					message: 'Please write a title for the group.',
					level: 'error'
				});
			}

			// Update the current navigation
			this.navigation[index].text = title;

			// Update the element
			$group
				.attr('data-text', title)
				.removeClass('tule-nav-group-editing')
				.find('.js-group-title')
					.text(title)
			;
		},

		onItemEditOk: function(e) {
			e.preventDefault();
			var $item = $(e.target).closest('.js-nav-item'),
				$group = $item.closest('.js-nav-group'),
				title = $.trim($item.find('input').val()),
				index = $item.data('index'),
				navigation = this.navigation
			;

			if(!title) {
				return Alerts.add({
					message: 'Please write a title for the item.',
					level: 'error'
				});
			}

			if($group.length)
				navigation = navigation[$group.data('index')].subItems;

			// Update the current navigation
			navigation[index].text = title;

			// Update the element
			$item
				.attr('data-text', title)
				.removeClass('tule-nav-item-editing')
				.find('.js-item-title')
					.text(title)
			;
		},

		onGroupRemove: function(e) {
			e.preventDefault();
			var $group = $(e.target).closest('.js-nav-group'),
				index = $group.data('index')
			;

			this.navigation.splice(index, 1);
			this.renderCurrentNavigation();
		},

		onItemRemove: function(e) {
			e.preventDefault();
			var $item = $(e.target).closest('.js-nav-item'),
				$group = $item.closest('.js-nav-group'),
				index = $item.data('index'),
				navigation = this.navigation
			;

			// If the item is inside a group, update the group
			if($group.length)
				navigation = navigation[$group.data('index')].subItems;

			navigation.splice(index, 1);

			this.renderCurrentNavigation();
		},

		onAddGroup: function(e) {
			e.preventDefault();

			this.navigation.push({
				text: 'New group',
				url: '#',
				subItems: []
			});

			this.renderCurrentNavigation();
			this.$('.js-nav-group').last()
				.addClass('tule-nav-group-editing')
				.find('input')
					.focus()
			;
		}
	});

	return PageController.extend({
		title: 'Menu Configuration',
		contentView: NavigationController
	});
});