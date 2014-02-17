var deps = [
	'jquery', 'underscore', 'backbone',
	'text!tpls/docTable.html',
	'modules/datatypes/dispatcher',
	'modules/alerts/alerts'
];
define(deps, function($,_,Backbone, tplSource, dispatcher, Alerts){
	'use strict';
	var DocumentView = Backbone.View.extend({
		tpl: _.template($(tplSource).find('#docTpl').html()),
		initialize: function(opts){
			this.fields = opts.fields || [{href: '#', className: 'remove', icon: 'times'}];
			this.editing = opts.editing || false;
			this.objectView = false;
		},
		render: function(){
			this.$el.html(this.tpl({id: this.model.id, editing: this.editing, fields: this.fields, doc: this.model.toJSON()}));

			if(this.editing){
				this.objectView = dispatcher.getView('object', {path: this.model.id, mode: 'edit'}, this.model);
				this.$('.document-content').find('td').prepend(this.objectView.$el);
				this.objectView.render();
			}
			this.trigger('rendered');
		},

		close: function(){
			if(!this.editing)
				return false;

			this.objectView.remove();
			this.editing = false;
			this.render();
		},

		open: function(){
			if(this.editing)
				return false;


			this.editing = true;
			this.render();
		},

		getValue: function(){
			if(this.editing)
				return this.objectView.getValue();
			return this.model.toJSON();
		}

	});

	var CollectionView = Backbone.View.extend({
		tpl: $(tplSource).find('#tableTpl').html(),

		events: {
			'click .document-ok': 'onClickOk',
			'click .document-cancel': 'onClickCancel',
			'click .document-header>td': 'onClickField'
		},
		initialize: function(opts) {
			this.fields = opts.fields || [{href: '#', className: 'remove', icon: 'times'}];
			this.docViews = {};
			this.createDocViews();
			this.listenTo(this.collection, 'remove', $.proxy(this.removeSubView, this));
		},
		createDocViews: function(){
			var me = this,
				docViews = {}
			;
			this.collection.each(function(doc){
				var docId = doc.id;
				docViews[docId] = new DocumentView({
					model: doc,
					fields: me.fields,
					editing: (me.docViews[docId] ? me.docViews[docId].editing : false)
				});
				docViews[docId].on('rendered', function(){
					me.renderSubview(docViews[docId]);
				});
			});
			this.docViews = docViews;
		},

		render: function(){
			this.$el.html(this.tpl);
			var table = this.$('table');
			_.each(this.docViews, function(view){
				view.render();
				table.append(view.el.children);
				view.delegateEvents();
			});
		},

		renderSubview: function(subView){
			var id = subView.model.id,
				form = $(document.getElementById('document-editing-' + id)),
				header = $(document.getElementById('document-' + id))
			;
			form.remove();
			header.replaceWith(subView.el.children);
			subView.delegateEvents();
		},

		removeSubView: function(model){
			var id = model.id,
				form = $(document.getElementById('document-editing-' + id)),
				header = $(document.getElementById('document-' + id))
			;
			this.docViews[id].remove();
			delete(this.docViews[id]);
			form.remove();
			header.remove();
		},

		onClickOk: function(e){
			e.preventDefault();
			var	docId = $(e.target).closest('tr').data('id'),
				doc = this.collection.get(docId),
				view = this.docViews[docId]
			;

			_.each(view.getValue(), function(value, key){
				doc.set(key, value, {silent:true});
			});

			doc.save(null, {success: function(){
				Alerts.add({message:'Document saved correctly', autoclose:6000});
				view.render();
			}});
		},

		onClickCancel: function(e){
			e.preventDefault();

			var	docId = $(e.target).closest('tr').data('id');
			this.docViews[docId].close();
		},

		onClickField: function(e){
			e.preventDefault();
			var td = $(e.currentTarget),
				docId = td.closest('tr').data('id')
			;
			this.trigger('click:' + td.data('action'), this.docViews[docId]);
		}
	});

	return {
		DocumentView: DocumentView,
		CollectionView: CollectionView
	};

});