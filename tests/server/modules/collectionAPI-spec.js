var frisby = require('frisby')
;

// Be sure that the collection doesn't exist before start the tests.
var tuleApiUrl = 'http://localhost:3000/api/',
  collection = 'CollectionApiTestCollection',
  settings = {
    _id: Math.floor((Math.random() * 10000000) + 1),
    collectionName: collection,
    propertyDefinitions: [ {"key": "definition", "datatype": {"id": "string"} } ],
    headerFields: ['definition'],
    mandatoryProperties: ['definition']
  },
  updated = {
    _id: settings._id,
    collectionName: collection,
    propertyDefinitions: [ {"key": "other", "datatype": {"id": "string"} } ],
    headerFields: ['other'],
    mandatoryProperties: ['other'],
    allowCustom: false
  },
  unexisting = {
    _id: settings._id,
    collectionName: 'someRandomUnexisting123654'
  }
;

// Make sure the collection doesn't exists. Don't care about the result.
frisby.create('Initial collection delete')
  .delete(tuleApiUrl + 'collections/' + collection)
  .toss()
;

frisby.create('Create collection')
  .post(tuleApiUrl + 'collections', settings, {json: true})
  .expectStatus(200)
  .expectJSON(settings)
  .toss()
;

frisby.create('Fetch collection stats')
  .get(tuleApiUrl + 'collections/' + collection)
  .expectStatus(200)
  .expectJSON('settings', settings)
  .expectJSON({ok: 1, count: 0})
  .toss()
;

frisby.create('Fetch unexisting collection stats returns 404')
  .get(tuleApiUrl + 'collections/unexsisting1234321')
  .expectStatus(404)
  .toss()
;

frisby.create('Update collection')
  .put(tuleApiUrl + 'collections/' + collection, updated, {json:true})
  .expectStatus(200)
  .expectJSON(updated)
  .toss()
;

frisby.create('Fetching updated collection stats')
  .get(tuleApiUrl + 'collections/' + collection)
  .expectStatus(200)
  .expectJSON('settings', updated)
  .expectJSON({ok: 1, count: 0})
  .toss()
;

frisby.create('Update collection with a wrong name should return an error')
  .put(tuleApiUrl + 'collections/othername', updated, {json:true})
  .expectStatus(400)
  .toss()
;

frisby.create('Update an unexisting collection should return 404')
  .put(tuleApiUrl + 'collections/' + unexisting.collectionName, unexisting, {json:true})
  .expectStatus(404)
  .toss()
;

frisby.create('Collection delete')
  .delete(tuleApiUrl + 'collections/' + collection)
  .expectStatus(200)
  .toss()
;

frisby.create('Fetch deleted collection stats returns 404')
  .delete(tuleApiUrl + 'collections/' + collection)
  .expectStatus(404)
  .toss()
;
