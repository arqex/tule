module.exports = [
	{route: 'get::/api/settings/:name', controller: 'apiSettings::getConfig'},
	{route: 'put::/api/settings/:name', controller: 'apiSettings::updateConfig'},
	{route: 'post::/api/settings/:name', controller: 'apiSettings::createConfig'},
	{route: 'delete::/api/settings/:name', controller: 'apiSettings::removeConfig'},

	{route: 'get::/api/collections', controller: 'apiCollection::list'},
	{route: 'get::/api/collectionstatus/:name', controller: 'apiCollection::getStatus'},
	{route: 'post::/api/collection', controller: 'apiCollection::createCollection'},

	{route: 'get::/api/docs/:type', controller: 'apiDocument::collection'},
	{route: 'post::/api/docs/:type', controller: 'apiDocument::create'},
	{route: 'get::/api/docs/:type/:id', controller: 'apiDocument::get'},
	{route: 'put::/api/docs/:type/:id', controller: 'apiDocument::update'},
	{route: 'delete::/api/docs/:type/:id', controller: 'apiDocument::remove'},

	{route: 'get::/api/plugins', controller: 'pluginController::list'},
	{route: 'get::/api/plugins/activate/:id', controller: 'pluginController::activate'},
	{route: 'get::/api/plugins/deactivate/:id', controller: 'pluginController::deactivate'},

	{route: 'get::/mongoreset', controller: 'mongoReset::main'},

	{route: '*', controller: 'main'}
];