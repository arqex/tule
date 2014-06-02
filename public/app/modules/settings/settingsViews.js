'use strict';

var deps = [
	'jquery', 'underscore', 'backbone', 'services',

	'text!./tpls/settingsNavigationTpl.html',

	'modules/datatypes/dispatcher',
	'modules/alerts/alerts'
];

define(deps, function($, _, Backbone, Services, tplNavigation, dispatcher, Alerts){
	var ElementView = Backbone.View.extend({
		tplBox: _.template($(tplNavigation).find('#boxTpl').html()),
		tplBoxEdit: _.template($(tplNavigation).find('#boxEditTpl').html()),
		tplItem: _.template($(tplNavigation).find('#itemTpl').html()),
		tplItemEdit: _.template($(tplNavigation).find('#itemEditTpl').html()),
		tplSingle: _.template($(tplNavigation).find('#singleTpl').html()),
		tplSingleEdit: _.template($(tplNavigation).find('#singleEditTpl').html()),

		initialize: function(opts){
			this.text 		= opts.text;
			this.url 		= opts.url || '0';
			this.mode 		= opts.mode || 'display';
			this.type 		= opts.type || false;
			this.subItems 	= opts.subItems || [];

			this.updateTpls();
		},
		render: function(){
			var tpl = this.tpl;
			if(this.mode == 'edit')
				tpl = this.tplEdit;

			this.$el.html(tpl({
				text: this.text,
				url: this.url,
				cid: this.cid
			}));

			if(this.mode == 'edit')
				setTimeout(function(){
					this.$('input').first().focus();
				}, 50);

			if(this.type == 'box'){
				var container = this.$('.js-container');
				_.each(this.subItems, function(subItem){
					subItem.render();
					container.append(subItem.$('li'));
				});
			}
		},
		updateTpls: function(){
			if(this.type == 'box'){
				this.tpl 		= this.tplBox;
				this.tplEdit 	= this.tplBoxEdit;
			} else if(this.type == 'lower'){
				this.tpl 		= this.tplItem;
				this.tplEdit 	= this.tplItemEdit;
			} else if(this.type == 'upper'){
				this.tpl 		= this.tplSingle;
				this.tplEdit 	= this.tplSingleEdit;
			}
		}
	});

	var NavigationPreviewView = Backbone.View.extend({
		tpl: $(tplNavigation).find('#previewTpl').html(),

		events: {
			'click .js-add-box': 'onClickAdd',
			'click .js-upper-edit': 'onClickUpperEdit',
			'click .js-upper-remove': 'onClickUpperRemove',
			'click .js-upper-ok': 'onClickUpperOk',
			'click .js-item-edit': 'onClickItemEdit',
			'click .js-item-remove': 'onClickItemRemove',
			'click .js-item-ok': 'onClickItemOk',
			'click .js-save-navigation': 'onClickSave'
		},

		initialize: function(opts){
			var me = this;
			this.upperElements = [];

			_.each(opts.routes, function(route){
				if(route.subItems){
					var subRoutes = [];

					_.each(route.subItems, function(subRoute){
						var lowerElement = new ElementView({
							text: subRoute.text,
							url: subRoute.url,
							type: 'lower'
						});

						subRoutes.push(lowerElement);
					});
				}

				var upperElement = new ElementView({
					text: route.text,
					url: route.url,
					subItems: subRoutes,
					type: subRoutes ? 'box' : 'upper'
				});

				me.upperElements.push(upperElement);
			});
		},

		render: function(){
			var me = this;
			this.$el.html(this.tpl);
			_.each(this.upperElements, function(element){
				element.render();
				me.$('.js-main').append(element.$('.js-output'));
			});
			this.runSortableEvents();
		},

		runSortableEvents: function(){
			var me = this;
			this.$('.js-container').sortable({
				cancel: '.container-wrapped h4',
				items: 'li',
				cursor: 'move',
				connectWith: '.js-container',
				axis: 'y',
				stop: function(e, ui){
					ui.item.parent().hasClass('js-main')
						? me.updateElements(ui.item, 'main')
						: me.updateElements(ui.item, 'box');

					me.render();
				},
				receive: function(e, ui){
					if(ui.item.hasClass('container-wrapped'))
						return ui.sender.sortable('cancel');
					ui.sender.data('copied', true);

					// Create new model and insert it into the elements data
					if(ui.item.data('origin') == 'outside'){
						var type = 'upper';
						if(!$(this).hasClass('js-main')){
							type = 'lower';
							var cid = $(this).data('cid');
							for(var i=0; i < me.upperElements.length; i++){
								if(me.upperElements[i].cid == cid)
									var upperKey = i;
							}
						}

						var element = new ElementView({
							text: ui.item.data('text'),
							type: type,
							url: ui.item.data('url'),
							mode: 'display'
						});

						type == 'upper'
							? me.upperElements.splice(ui.item.index(), 0, element)
							: me.upperElements[upperKey].subItems.splice(ui.item.index() - 1, 0, element);
					}

					me.render();
				}
			}).disableSelection();
		},

		updateElements: function(item, destiny){
			if(item.hasClass('js-subItem')){
				var keys 	 = this.getItemByNode(item),
					upperKey = keys[0],
					lowerKey = keys[1]
				;
			}else if(item.hasClass('js-item')){
				var upperKey = this.getUpperByNode(item),
					lowerKey = null
				;
			}else{
				var upperKey = this.getUpperByNode(item.children()),
					lowerKey = null
				;
			}

			// Substract the current element
			if(lowerKey === null)
				var element = this.upperElements.splice(upperKey, 1)[0];
			else
				var element = this.upperElements[upperKey].subItems.splice(lowerKey, 1)[0];

			// Adding at its new position
			if(destiny == 'main'){
				if(element.type == 'lower')
					element.type = 'upper';
				element.updateTpls();
				this.upperElements.splice(item.index(), 0, element);
			}else{
				element.type = 'lower';
				element.updateTpls();
				var cid = item.closest('ul').data('cid');
				for(var i=0; i < this.upperElements.length; i++){
					if(this.upperElements[i].cid == cid)
						upperKey = i;
				}
				this.upperElements[upperKey].subItems.splice(item.index() - 1, 0, element);
			}
		},

		onClickAdd: function(e){
			var box = new ElementView({
				text: 'New Box',
				type: 'box',
				mode: 'edit'
			});
			this.upperElements.push(box);
			this.render();
		},

		// Upper nodes
		getUpperByNode: function(node){
			var cid = $(node).closest('.js-item').data('cid'),
				key = this.upperElements.length
			;
			while (key--) {
				if(this.upperElements[key].cid == cid)
					return key;
			}
		},
		onClickUpperEdit: function(e){
			var key = this.getUpperByNode(e.target);
			this.upperElements[key].mode = 'edit';
			this.render();
		},
		onClickUpperRemove: function(e){
			var key = this.getUpperByNode(e.target);
			this.upperRemove(key);
			this.render();
		},
		upperRemove: function(key){
			this.upperElements.splice(key, 1);
		},
		onClickUpperOk: function(e){
			var text 	= $(e.target).siblings('#text').val(),
				key 	= this.getUpperByNode(e.target)
			;
			this.upperElements[key].text = text;
			this.upperElements[key].mode = 'display';
			this.render();
		},

		// Lower nodes
		getItemByNode: function(node){
			var cid 	= $(node).closest('.js-subItem').data('cid'),
				me 		= this
			;

			var key = this.upperElements.length;
			while (key--) {
				var subKey = me.upperElements[key].subItems.length;
				while(subKey--){
					if(me.upperElements[key].subItems[subKey].cid == cid)
						return [key, subKey];
				}
			}
		},
		onClickItemEdit: function(e){
			var keys = this.getItemByNode(e.target);
			this.upperElements[keys[0]].subItems[keys[1]].mode = 'edit';
			this.render();
		},
		onClickItemRemove: function(e){
			var keys = this.getItemByNode(e.target);
			this.itemRemove(keys);
			this.render();
		},
		itemRemove: function(keys){
			this.upperElements[keys[0]].subItems.splice(keys[1], 1);
		},
		onClickItemOk: function(e){
			var text = $(e.target).siblings('#text').val(),
				keys = this.getItemByNode(e.target)
			;
			this.upperElements[keys[0]].subItems[keys[1]].text = text;
			this.upperElements[keys[0]].subItems[keys[1]].mode = 'display';
			this.render();
		},

		onClickSave: function(e){
			var routes = [],
				me = this
			;

			_.each(this.upperElements, function(element){
				var route = {};
				route['text'] = element.text;
				route['url']  = element.subItems.length > 0 ? element.subItems[0].url : element.url;

				if(route.url == "0")
					route['subItems'] = [];

				if(element.subItems.length > 0){
					route['subItems'] = [];
				 	_.each(element.subItems, function(subElement){
						var subRoute = {};
						subRoute['text'] = subElement.text;
						subRoute['url']  = subElement.url;

						route['subItems'].push(subRoute);
					});
				}

				routes.push(route);
			});

			// Throw save new navigation: Services
			Services.get('settings').saveNavigation(routes).then(function(result){
				Alerts.alerter.add({message:'Navigation settings saved correctly', autoclose:6000});
				me.trigger('save', routes);
			});
		}
	});

	var NavigationToolsboxView = Backbone.View.extend({
		tpl: _.template($(tplNavigation).find('#toolsboxTpl').html()),
		initialize: function(opts){
			this.collections = opts.collections;
		},
		render: function(){
			this.$el.html(this.tpl({collections: this.collections}));

			this.$('.js-collection').sortable({
				cancel: 'h4',
				items: 'li',
				connectWith: '.js-container',
				cursor: 'move',
				helper: function(e, li){
					this.copyHelper = li.clone().insertAfter(li);
					$(this).data('copied', false);
					return li.clone();
				},
				stop: function(){
					var copied = $(this).data('copied');
					if (!copied)
						this.copyHelper.remove();
					this.copyHelper = null;
				}
			}).disableSelection();
		}
	});


	return {
		NavigationPreviewView: NavigationPreviewView,
		NavigationToolsboxView: NavigationToolsboxView
	};

});
