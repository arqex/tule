"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'views/collectionView',
	'views/mainView',
	'text!tpls/superView.html',
	'models/dispenser',
	'models/superViewTools',
	'modules/alerts/alerts'
];

define(deps, function($,_,Backbone, CollectionViews, mainView, tplSuper, Dispenser, Tools, Alerts){
	var createPagination = function(current, limit, total){
		var pagination = new CollectionViews.PaginationView({
			currentPage: Math.round(current),
			lastPage: Math.ceil(total / limit),
			limit: limit,
			skip: (current * limit) - limit
		});

		return pagination;
	};

	var createSearchTools = function(type){
		var searchTools = new CollectionViews.SearchTools({
			type: type
		});

		return searchTools;
	};

	var createAdderView = function(type, results, settings){
		var newDocView = new CollectionViews.NewDocView({
			type: type,
			collection: results,
			settings: settings
		});

		return newDocView;
	};

	var createCollectionView = function(documents, fields, settings){
		var view = new CollectionViews.CollectionView({
			collection: documents,
			fields: fields,
			customFields: 1,
			docOptions: settings			
		});

		return view;
	};

	var SuperView = Backbone.View.extend({
		tplSuperView: $(tplSuper).find('#superTpl').html(),

		initialize: function(opts){
			this.type 		= opts.type;
			this.params		= opts.params;
			this.adder 		= opts.adderView || null;
			this.search 	= opts.searchView || null;
			this.pagination = opts.paginationView || null;
			this.items		= opts.collectionView || null;
			this.fullItems	= Dispenser.getCollection(this.type);

			if(this.adder)
				this.runAdderListeners();
			if(this.search)
				this.runSearchListeners();
			if(this.pagination)
				this.runPaginationListeners();
			if(this.items)
				this.runItemsListeners();
		},

		render: function(){
			this.$el.html(this.tplSuperView);

			if(this.adder){
				this.adder.render();
				this.$('.adderPlaceholder').append(this.adder.el); }
			if(this.search){
				this.search.render();
				this.$('.searchPlaceholder').append(this.search.el); }
			if(this.pagination){
				this.pagination.render();
				this.$('.paginationPlaceholder').append(this.pagination.el); }
			if(this.items){
				this.items.render();
				this.$('.collectionPlaceholder').append(this.items.el); }
		},

		runAdderListeners: function(){
			this.listenTo(this.adder, 'createDoc', function(type, data){
				var me = this,
					doc = Dispenser.getDoc(type)
				;

				_.each(data, function(values, key){
					doc.set(key, values.value);
				});

				doc.save(null, {success: function(){
					Alerts.add({message:'Document saved correctly', autoclose:6000});	
					doc.url = encodeURI('/api/docs/' + me.type + '/' + doc.id);

					// Reset the form on DOM
					me.adder.objectView = false;
					me.adder.$el.find('.form').remove();
					me.adder.close();

					// Add possible new property definitions
					$.post('/api/collection/'+me.type, {
						type: me.type,
						data: data
					});

					// Render collection view
					me.trigger('renderCollection', doc);

				}});
			}); // End of createDoc
		},

		runSearchListeners: function(){
			this.listenTo(this.search, 'searchDoc', function(clauses){
				var me = this;

				this.fullItems.query({clause: clauses}).then(function(results){
					var	customUrl = "",
						paramName = encodeURI("clause[]"),
						paramValue = ''
					;

					for(var i in clauses){
						paramValue = encodeURI(clauses[i]);
						customUrl += (paramName + "=" + paramValue);
						if(i < clauses.length - 1) 
							customUrl += "&";
							
					}

					Backbone.history.navigate("/collections/list/" + me.type + "?" + customUrl);

					me.pagination.update(1, results.get('total'));
					me.items.createDocViews(results.get('documents'));
					me.items.render();
				});
			}); // End of searchDoc
		},

		runPaginationListeners: function(){
			this.listenTo(this.pagination, 'navigate', function(page){
				var	limit = this.pagination.limit,
					conditions = this.params || {},
					query = {},
					me = this
				;

				conditions.skip 	= (page * limit) - limit;
				conditions.limit	= limit;

				query = Tools.createQuery(this.type, conditions);

				this.fullItems.query(query).then(function(results, options){
					me.pagination.currentPage = page;
					me.pagination.distance = me.pagination.lastPage - page;
					me.pagination.lastPage = Math.ceil(results.get('total') / limit);
					me.pagination.render();

					var customUrl = "skip=" + conditions.skip + "&limit=" + conditions.limit;
					if(query.clause){
						_.each(query.clause, function(clause){
							customUrl = customUrl + "&clause[]=" + clause;
						});						
					}

					customUrl = encodeURI(customUrl);
					Backbone.history.navigate("/collections/list/" + me.type + "?" + customUrl);
					
					me.items.createDocViews(results.get('documents'));
					me.items.render();
				});
			}); // Enf of navigate
		},

		runItemsListeners: function(){
			this.listenTo(this, 'renderCollection', function(doc){
				this.items.collection.add(doc);
				this.items.createDocViews(this.items.collection);
				this.items.render();
				this.pagination.render();
			});

			this.listenTo(this.items, 'click:edit', function(docView){
				docView.open();
			}); // End of click edit

			this.listenTo(this.items, 'click:remove', function(docView){
				if(confirm('Are you sure to delete this document?'))
					docView.model.destroy({
						wait: true,
						success: function(){
							console.log('Document deleted');
							Alerts.alerter.add({message: 'Deletion completed', autoclose: 6000});
						},
						error: function(){
							console.log('Document NOT deleted');
							Alerts.alerter.add({message: 'There was an error deleting the document.', level: 'error'});
						}
					});
				return false;
			}); // End of click remove

			this.listenTo(this.items, 'click:' + this.items.fields[0], function(docView){
				docView.open();
			}); // End of click fields[0]

			this.listenTo(this.items, 'saveDoc', function(data){
				$.post('/api/collection/'+this.type, {
					type: this.type,
					data: data
				});
			}); // End of saveDoc			
		}
	});


	return {
		list: function(type, page, query){			
			var collection = Dispenser.getCollection(type);
			var settingsPromise = collection.getSettings();

			// If there are conditions in the url execute the query
			if(query != undefined)
				query = Tools.createQuery(type, query);

			collection.query(query).then(function(results, options){
				settingsPromise.then(function(settings){
					// Primitive vars
					var fields 		= settings.tableFields || [],
						documents 	= results.get('documents'),
						total 		= results.get('total'),
						current		= results.get('current'),
						limit 		= results.get('limit')
					;

					// Set up fields
					fields.push({action: 'edit', href: "#", icon: 'pencil'});
					fields.push({action: 'remove', href: "#", icon: 'times'});

					// Create subviews
					var collectionView 	= createCollectionView(documents, fields, settings, type),
						pagination 		= createPagination(current, limit, total),
						searchTools 	= createSearchTools(type),
						newDocView		= createAdderView(type, results, settings)						
					;

					// Create the SuperView
					var superView = new SuperView({
						type: type,
						params: query,
						adderView: newDocView,
						searchView: searchTools,
						paginationView: pagination,
						collectionView: collectionView
					});

					// Render the set
					superView.render();
					mainView.loadView(superView);
					mainView.setTitle(type + ' collection');
				});
			});
		}
	};
});