var config = require('config'),
	db = require(config.path.modules + '/db/dbManager').getInstance(),
	when = require('when')
;

var settings = db.collection(config.mon.settingsCollection),
	hooks
;

module.exports = {
	init: function(appObject) {
		console.log('dentro');
		hooks = appObject.hooks;
	},
	get: function(settingName){
		var deferred = when.defer();
		settings.findOne({name: settingName}, function(err, settingValue){
			if(err)
				deferred.reject(err);
			else
				deferred.resolve(settingValue);
		});
		return deferred.promise;
	},
	save: function(settingName, settingValue){
		var deferred = when.defer();
		//Be sure the we are not overriding another setting;
		settingValue.name = settingName;
		settings.update({name: settingName}, settingValue, function(err){
			if(err)
				deferred.reject(err);
			else
				deferred.resolve(settingValue);
		});
		return deferred.promise;

	},
	getFrontSettings: function(){
		return hooks.filter('settings:front', {});
	}
}