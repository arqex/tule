var frisby = require('frisby')
;

// Be sure that the collection doesn't exist before start the tests.
var tuleApiUrl = 'http://localhost:3000/api/',
  collection = 'ApiTestCollection',
  doc = {
    _id: Math.floor((Math.random() * 10000000) + 1),
    name: 'Alice',
    age: 22
  },

  doc2 = {
    _id: doc._id + 1,
    name: 'Bob',
    age: 40
  },
  doc3 = {
    _id: doc._id + 2,
    name: 'Bob',
    age: 15
  },
  updated = {
    _id: doc._id,
    name: doc.name,
    age: 32
  }
;

// Caution: Delete any document with the same _id, don't care about the result.
frisby.create('first delete')
  .delete(tuleApiUrl + 'docs/' + collection + '/' + doc._id)
  .toss()
;


frisby.create('Create a doc')
  .post(tuleApiUrl + 'docs/' + collection, doc)
    .expectStatus(200)
    .expectJSON(doc)
    .toss()
;

frisby.create('Fetch a doc')
  .get(tuleApiUrl + 'docs/' + collection + '/' + doc._id)
  .expectStatus(200)
  .expectJSON(doc)
  .toss()
;

frisby.create('Fetch an unexisting doc should return 404')
  .get(tuleApiUrl + 'docs/' + collection + '/unexistingid')
  .expectStatus(404)
  .toss()
;

frisby.create('Can\'t create another document with the same id')
  .post(tuleApiUrl + 'docs/' + collection, doc)
    .expectStatus(400)
    .toss()
;

frisby.create('Look for the doc')
  .get(tuleApiUrl + 'docs/' + collection + '?query=_id|eq|' + doc._id)
    .expectStatus(200)
    .expectJSONLength('documents', 1)
    .toss()
;

frisby.create('Adding doc2')
  .post(tuleApiUrl + 'docs/' + collection, doc2)
  .toss()
;

frisby.create('Adding doc3')
  .post(tuleApiUrl + 'docs/' + collection, doc3)
  .toss()
;

frisby.create('Look for docs with name bob')
  .get(tuleApiUrl + 'docs/' + collection + '?query=name|eq|' + doc2.name)
    .expectStatus(200)
    .expectJSONLength('documents', 2)
    .toss()
;

frisby.create('Look for docs older than alice')
  .get(tuleApiUrl + 'docs/' + collection + '?query=age|gt|' + doc.age)
    .expectStatus(200)
    .expectJSONLength('documents', 1)
    .toss()
;

frisby.create('Look for docs younger than alice')
  .get(tuleApiUrl + 'docs/' + collection + '?query=age|lt|' + doc.age)
    .expectStatus(200)
    .expectJSONLength('documents', 1)
    .toss()
;

frisby.create('Look for docs older or equal than alice')
  .get(tuleApiUrl + 'docs/' + collection + '?query=age|gte|' + doc.age)
    .expectStatus(200)
    .expectJSONLength('documents', 2)
    .toss()
;

frisby.create('Look for docs younger or equal than alice')
  .get(tuleApiUrl + 'docs/' + collection + '?query=age|lte|' + doc.age)
    .expectStatus(200)
    .expectJSONLength('documents', 2)
    .toss()
;

frisby.create('Look for docs using two fields')
  .get(tuleApiUrl + 'docs/' + collection + '?query=and(age|eq|' + doc.age + ',name|eq|' + doc.name + ')')
    .expectStatus(200)
    .expectJSONLength('documents', 1)
    .toss()
;

frisby.create('Look for docs using logical or')
  .get(tuleApiUrl + 'docs/' + collection + '?query=or(age|eq|' + doc2.age + ',name|eq|' + doc.name + ')')
    .expectStatus(200)
    .expectJSONLength('documents', 2)
    .toss()
;

frisby.create('Look for unexisting doc')
  .get(tuleApiUrl + 'docs/' + collection + '?query=age|gt|10000')
    .expectStatus(200)
    .expectJSONLength('documents', 0)
    .toss()
;

frisby.create('Look for all docs')
  .get(tuleApiUrl + 'docs/' + collection)
    .expectStatus(200)
    .expectJSONLength('documents', 3)
    .toss()
;

frisby.create('Search with limit 1')
  .get(tuleApiUrl + 'docs/' + collection + '?query=age|gt|0&limit=1')
    .expectStatus(200)
    .expectJSONLength('documents', 1)
    .toss()
;

frisby.create('Search sorted by age desc')
  .get(tuleApiUrl + 'docs/' + collection + '?sort=-age')
    .expectStatus(200)
    .expectJSON('documents.0', doc2)
    .expectJSON('documents.1', doc)
    .expectJSON('documents.2', doc3)
    .toss()
;

frisby.create('Search sorted by age asc')
  .get(tuleApiUrl + 'docs/' + collection + '?sort=age')
    .expectStatus(200)
    .expectJSON('documents.0', doc3)
    .expectJSON('documents.1', doc)
    .expectJSON('documents.2', doc2)
    .toss()
;

frisby.create('Search sorted by name desc and age asc')
  .get(tuleApiUrl + 'docs/' + collection + '?sort=-name,age')
    .expectStatus(200)
    .expectJSON('documents.0', doc3)
    .expectJSON('documents.1', doc2)
    .expectJSON('documents.2', doc)
    .toss()
;

frisby.create('Search skiping 1 result')
  .get(tuleApiUrl + 'docs/' + collection + '?skip=1')
    .expectStatus(200)
    .expectJSONLength('documents', 2)
    .toss()
;

frisby.create('Search with a malformed query, should fail')
  .get(tuleApiUrl + 'docs/' + collection + '?query=age')
    .expectStatus(400)
    .toss()
;

frisby.create('Update the document')
  .put(tuleApiUrl + 'docs/' + collection + '/' + doc._id, updated)
    .expectStatus(200)
    .expectJSON(updated)
    .toss()
;

frisby.create('Update a document with the wrong id in the route should fail')
  .put(tuleApiUrl + 'docs/' + collection + '/wrongid', updated)
    .expectStatus(400)
    .toss()
;

frisby.create('Update an unexisting document should return 404')
  .put(tuleApiUrl + 'docs/' + collection + '/wrongid', {_id: 'wrongid', age: 100})
    .expectStatus(404)
    .toss()
;

frisby.create('Fetching the updated doc')
  .get(tuleApiUrl + 'docs/' + collection + '/' + doc._id)
  .expectStatus(200)
  .expectJSON(updated)
  .toss()
;

frisby.create('Remove the document')
  .delete(tuleApiUrl + 'docs/' + collection + '/' + doc._id)
    .expectStatus(200)
    .toss()
;

frisby.create('Fetch the doc after remove it, should returns 404')
  .get(tuleApiUrl + 'docs/' + collection + '/' + doc._id)
    .expectStatus(404)
    .toss()
;

frisby.create('Remove an unexisting document should returns 404')
  .delete(tuleApiUrl + 'docs/' + collection + '/unexistingid')
    .expectStatus(404)
    .toss()
;

frisby.create('Remove doc2')
  .delete(tuleApiUrl + 'docs/' + collection + '/' + doc2._id)
    .expectStatus(200)
    .toss()
;

frisby.create('Remove doc3')
  .delete(tuleApiUrl + 'docs/' + collection + '/' + doc3._id)
    .expectStatus(200)
    .toss()
;
