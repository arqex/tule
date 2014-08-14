;
var deps = [
	'jquery', 'underscore', 'backbone',
	'text!modules/alerts/tpls/alert.html'
];
define(deps, function($,_,Backbone, tplSource){
	"use strict";

	/**
	 * The alerts module allows to show messages to the user. It is alse possible to create
	 * dialog using them.
	 *
	 * An alert has the following properties:
	 * message: The text that will be shown by the alert.
	 * level: 'info'|'warn'|'error' display the alert in different colors. Default 'info'.
	 * confirmButtons: {ok: String, cancel: String} If set, confirm buttons will transform
	 * 		the alert into a dialog, showing a cancel and a ok button. Clicking the buttons will
	 *   	trigger the 'alertOk' and 'alertCancel' events in the alert.
	 * autoclose: Milliseconds to close the alert automatically. 0 to not to close the alert
	 * 		automatically. Default: 10000.
	 */
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
	/**
	 * The alert view has a collection of alerts that works like a queue. Alerts
	 * are removed automatically when its timer is over.
	 */
	var AlertView = Backbone.View.extend({
		className: 'tule-alerts',
		tpl: _.template(tplSource),
		events: {
			'click .js-alert-close': 'alertClosed',
			'click .js-alert-cancel': 'alertCancel',
			'click .js-alert-ok': 'alertOk'
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

	/**
	 * The single alertView that is placed in the layout. It is possible to use it directly
	 * as the main alerter to show messages to the user.
	 */
	var singletonAlert = new AlertView();

	/**
	 * Add alerts to the the main alerter in the layout just specifying the options.
	 * @param {Object} alertOptions See the options in the Alert Model.
	 */
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
