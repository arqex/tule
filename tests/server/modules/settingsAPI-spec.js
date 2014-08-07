'use strict';

var frisby = require('frisby');

// Be sure that the collection doesn't exist before start the tests.
var settingsUrl = 'http://localhost:3000/api/settings/',
  setting = {
    name: 'FrisbyTestSettingName',
    value: 10
  },
  updated = {
    name: 'FrisbyTestSettingName',
    value: 15
  }
;

// Caution: Delete any setting with the same name, don't care about the result.
frisby.create('first delete')
  .delete(settingsUrl + setting.name)
  .toss()
;

frisby.create('Create a setting')
	.post(settingsUrl + setting.name, setting, {json: true})
		.expectStatus(200)
		.expectJSON(setting)
		.toss()
;

frisby.create('Fetch a setting')
	.get(settingsUrl + setting.name)
		.expectStatus(200)
		.expectJSON(setting)
		.toss()
;

frisby.create('Fetch an unexisting setting should return 404')
	.get(settingsUrl + 'weirdunexistingid')
		.expectStatus(404)
		.toss()
;

frisby.create('Updating a setting')
	.put(settingsUrl + updated.name, updated, {json: true})
		.expectStatus(200)
		.expectJSON(updated)
		.toss()
;

frisby.create('Fetch an updated setting')
	.get(settingsUrl + updated.name)
		.expectStatus(200)
		.expectJSON(updated)
		.toss()
;

frisby.create('Delete a setting')
	.delete(settingsUrl + updated.name)
		.expectStatus(200)
		.toss()
;

frisby.create('Fetch a deleted setting should return 404')
	.get(settingsUrl + setting.name)
		.expectStatus(404)
		.toss()
;

frisby.create('Delete a unexisting should be ok')
	.delete(settingsUrl + updated.name)
		.expectStatus(200)
		.toss()
;

frisby.create('Create a with a put should be ok')
	.put(settingsUrl + setting.name, setting, {json: true})
		.expectStatus(200)
		.expectJSON(setting)
		.toss()
;

frisby.create('Fetch a setting created with a put')
	.get(settingsUrl + setting.name)
		.expectStatus(200)
		.expectJSON(setting)
		.toss()
;

frisby.create('Updating a setting with a post should be ok')
	.post(settingsUrl + updated.name, updated, {json: true})
		.expectStatus(200)
		.expectJSON(updated)
		.toss()
;

frisby.create('Fetch an updated setting with a post')
	.get(settingsUrl + updated.name)
		.expectStatus(200)
		.expectJSON(updated)
		.toss()
;

frisby.create('Delete a setting 2')
	.delete(settingsUrl + updated.name)
		.expectStatus(200)
		.toss()
;