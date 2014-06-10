;"use strict";

var deps = [
	'jquery', 'underscore', 'backbone',
	'text!./tpls/alert.html'
];
define(deps, function($,_,Backbone, tplSource){
	var Alert = Backbone.Model.extend({
		defaults: {
			message: '',
			level: 'info', // info, warn, error
			confirmButtons: false, // {ok: 'Ok button text', cancel: 'Cancel button text'}
			autoclose: 10000 // milliseconds to close
		},
		initialize: function(){
			this.set('id', this.cid, {silent: true});
			if(!this.get('confirmButtons') && this.get('autoclose'))
				setTimeout(this.triggerAndDestroy.bind(this), this.get('autoclose'));
		},
		triggerAndDestroy: function(){
			this.trigger('alertClosed');
			this.trigger('destroy', this);
		}
	});

	var AlertQueue = Backbone.Collection.extend({
		model: Alert,
		initialize: function(){
			var me = this;
			this.on('destroy', function(model){
				me.remove(model);
			});
		}
	});

	var AlertView = Backbone.View.extend({
		className: 'tule-alerts',
		tpl: _.template(tplSource),
		events: {
			'click .tule-alert-close': 'alertClosed',
			'click .tule-alert-cancel': 'alertCancel',
			'click .tule-alert-ok': 'alertOk'
		},
		initialize: function(options){
			if(!options || !options.collection)
				this.collection = new AlertQueue([]);
			this.listenTo(this.collection, 'add', this.addToView);
			this.listenTo(this.collection, 'remove', this.removeFromView);
		},
		render: function(){
			var me = this;
			this.el.innerHTML = '';
			this.collection.each(function(alert){
				me.$el.append(me.tpl(alert.toJSON()));
			});
		},
		add: function(alertOptions){
			var alert = new Alert(alertOptions);
			this.collection.add(alert);
			return alert;
		},
		addToView: function(alert){
			var alertHTML = $(this.tpl(alert.toJSON())).addClass('tule-alert-hidden');
			this.$el.prepend(alertHTML);
			setTimeout(function(){
				alertHTML.removeClass('tule-alert-hidden');
			},50);
		},
		removeFromView: function(alert){
			var alertHtml = this.$('#' + alert.cid).addClass('tule-alert-hidden');
			setTimeout(function(){
				alertHtml.remove();
			}, 1000);
		},
		alertAction: function(e, eventName){
			e.preventDefault();
			var alert = this.collection.get($(e.target).closest('.tule-alert').attr('id'));
			if(alert){
				alert.trigger(eventName);
				alert.trigger('destroy', alert);
			}
		},
		alertClosed: function(e){
			this.alertAction(e, 'alertClosed');
		},
		alertCancel: function(e){
			this.alertAction(e, 'alertCancel');
		},
		alertOk: function(e){
			this.alertAction(e, 'alertOk');
		}
	});

	var singletonAlert  = new AlertView();
	var singletonAdd	= function(alertOptions) {
		return singletonAlert.add(alertOptions);
	}

	return {
		AlertView: AlertView,
		Alert: Alert,
		alerter: singletonAlert,
		add: singletonAdd

	};
});
