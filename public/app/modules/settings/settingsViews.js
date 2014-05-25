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
			'click .js-box-edit': 'onClickBoxEdit',
			'click .js-box-remove': 'onClickBoxRemove',
			'click .js-box-ok': 'onClickBoxOk',
			'click .js-item-edit': 'onClickItemEdit',
			'click .js-item-remove': 'onClickItemRemove',
			'click .js-item-ok': 'onClickItemOk',
			'click .js-save-navigation': 'onClickSave'
		},

		initialize: function(opts){
			var me = this;
			this.upperElements = [];

			_.each(window.routes, function(route){
				var subRoutes = [];

				_.each(route.subItems, function(subRoute){
					var lowerElement = new ElementView({
						text: subRoute.text,
						url: subRoute.url,
						type: 'lower'
					});

					subRoutes.push(lowerElement);
				});

				var upperElement = new ElementView({
					text: route.text,
					url: route.url,
					subItems: subRoutes,
					type: subRoutes.length > 0 ? 'box' : 'upper'
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

					//me.render();
				}
			}).disableSelection();
		},

		updateElements: function(item, destiny){
			if(item.hasClass('js-subItem')){
				var keys 	 = this.getItemByNode(item),
					upperKey = keys[0],
					lowerKey = keys[1]
				;
				console.log("Is SUBITEM and goes to " + destiny.toUpperCase());
				console.log("Upperkey: " + upperKey + " | LowerKey: " + lowerKey);
			}else if(item.hasClass('js-item')){
				var upperKey = this.getBoxByNode(item),
					lowerKey = null
				;
				console.log("Is ITEM and goes to " + destiny.toUpperCase());
				console.log("Upperkey: " + upperKey + " | LowerKey: " + lowerKey);
			}else{
				var upperKey = this.getBoxByNode(item.children()),
					lowerKey = null
				;
				console.log("Is BOX and goes to " + destiny.toUpperCase());
				console.log("Upperkey: " + upperKey + " | LowerKey: " + lowerKey);
			}

			var element = this.upperElements.splice(upperKey, 1)[0];
			if(destiny == 'main'){
				this.upperElements.splice(item.index(), 0, element);
			}else{

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

		getBoxByNode: function(node){
			var cid = $(node).closest('.js-item').data('cid'),
				me = this,
				key = this.upperElements.length
			;
			while (key--) {
				if(me.upperElements[key].cid == cid)
					return key;
			}
		},
		onClickBoxEdit: function(e){
			var key = this.getBoxByNode(e.target);
			this.upperElements[key].mode = 'edit';
			this.render();
		},
		onClickBoxRemove: function(e){
			var key = this.getBoxByNode(e.target);
			this.boxRemove(key);
			this.render();
		},
		boxRemove: function(key){
			this.upperElements.splice(key, 1);
		},
		onClickBoxOk: function(e){
			var text 	= $(e.target).siblings('#text').val(),
				key 	= this.getBoxByNode(e.target)
			;
			this.upperElements[key].text = text;
			this.upperElements[key].mode = 'display';
			this.render();
		},

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
			var text 	= $(e.target).siblings('#text').val(),
				keys 	= this.getItemByNode(e.target)
			;
			this.upperElements[keys[0]].subItems[keys[1]].text = text;
			this.upperElements[keys[0]].subItems[keys[1]].mode = 'display';
			this.render();
		},

		onClickSave: function(e){
			var routes = [];
			_.each(this.$('.js-item'), function(box){
				var node = {};

				node['text'] = $(box).data('text');
				node['url']	 = $(box).data('url') || "0";

				_.each($(box).children('li'), function(subnode){
					if(node['url'] == "0"){
						node['url']		 = $(subnode).data('url');
						node['subItems'] = [];
					}
					node['subItems'].push({
						text: $(subnode).data('text'),
						url: $(subnode).data('url')
					});
				});

				routes.push(node);
			});
			console.log(routes);
			// Throw save new navigation: Services
		}
	});

	var NavigationToolsboxView = Backbone.View.extend({
		tpl: _.template($(tplNavigation).find('#toolsboxTpl').html()),

		render: function(){
			var me = this;
			Services.get('collection').getCollectionList().then(function(results){
				results.splice(results.indexOf('system.indexes'), 1);
				results.splice(results.indexOf('monSettings'), 1);
				me.$el.html(me.tpl({collections: results}));

				me.$('.js-collections, .js-settings').sortable({
					cancel: 'h4',
					items: 'li',
					connectWith: '.js-container',
					cursor: 'move',
					change: function(e, ui){
						//console.log(e.currentTarget);
					},
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
			});
		}
	});
	

	return {
		NavigationPreviewView: NavigationPreviewView,
		NavigationToolsboxView: NavigationToolsboxView
	};

});