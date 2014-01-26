'use strict';
var deps = [
	'jquery', 'underscore', 'backbone',
	'text!tpls/config.html',
	'views/datatypeViews',
	'text!tpls/documentEdition.html'
];
define(deps, function($,_,Backbone, tplSource, DatatypeViews, docTpl){
	return Backbone.View.extend({
		tpl: _.template(tplSource),
		docTpl: _.template(docTpl),
		events:{
			'click .collection-name': 'edit',
			'click .document-ok': 'onCollectionOk',
			'click .document-cancel': 'onCollectionCancel',
		},

		initialize: function(){
			this.editViews = {};
		},

		edit: function(e){
			var me = this,
				row = $(e.target).closest('tr'),
				table = row.closest('table'),
				collectionId = row.data('id')
			;

			if(this.editViews[collectionId])
				return;

			if(row.hasClass('editing'))
				return row.toggleClass('closed');

			var collection = this.collection.findByType(collectionId);

			collection.getSettings().then(function(settings){
				delete(settings._id);
				delete(settings.type);
				var view = new DatatypeViews.ObjectView({
						path: collectionId,
						model: new DatatypeViews.FieldModel({
							type: 'object',
							value: settings
						}),
						mode: 'edit'
					}),
					docView = $(me.docTpl({
						name: collectionId,
						cols: row.find('td').length
					}))
				;
				view.render();

				docView.find('td').prepend(view.$el);

				row.after(docView);

				me.editViews[collectionId] = view;
			});
		},

		render: function(){
			this.$el.html(this.tpl({collections: this.collection}));
		},

		onCollectionOk: function(e){
			e.preventDefault();
			var id = $(e.target).closest('tr.document-content').data('id'),
				collection = this.collection.findByType(id),
				values = this.editViews[id].getValue()
			;
			_.each(values, function(value, key){
				collection.set(key, value);
			});
			collection.save();
		},
		onCollectionCancel: function(e){
			e.preventDefault();
			var row = $(e.target).closest('tr.document-content'),
				id = row.data('id');
			this.editViews[id].remove();
			delete(this.editViews[id]);
			row.remove();
		}
	});
});