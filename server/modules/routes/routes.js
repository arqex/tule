module.exports = {
	'get::/api/settings/:name': 'apiSettings::getConfig',
	'put::/api/settings/:name': 'apiSettings::updateConfig',
	'post::/api/settings/:name': 'apiSettings::createConfig',
	'delete::/api/settings/:name': 'apiSettings::removeConfig',
	'get::/api/collections': 'apiCollection::list',
	'get::/api/collectionstatus/:name': 'apiCollection::getStatus',
	'post::/api/collection': 'apiCollection::createCollection',

	'get::/api/docs/:type': 'apiDocument::collection',
	'post::/api/docs/:type': 'apiDocument::create',
	'get::/api/docs/:type/:id': 'apiDocument::get',
	'put::/api/docs/:type/:id': 'apiDocument::update',
	'delete::/api/docs/:type/:id': 'apiDocument::remove',	

	'get::/api/plugins': 'pluginController::list',
	'get::/api/plugins/activate/:id': 'pluginController::activate',
	'get::/api/plugins/deactivate/:id': 'pluginController::deactivate',

	'get::/mongoreset': 'mongoReset::main',

	'*': 'main'
};