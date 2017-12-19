const { test } = require('ava');
const Promise = require('bluebird');
const mongoose = require('mongoose');

const mpaging = require('./index');

const testDocs = Array(100).fill({ name: 'dingding' });
mongoose.Promise = Promise;
const db = mongoose.createConnection('localhost');
const dropCollection = collectionName =>
  Promise.fromNode((callback) => {
    db.db.dropCollection(collectionName, callback);
  });
const getModel = (mpagingPayload) => {
  const schema = new mongoose.Schema({ name: String });
  schema.plugin(mpaging, mpagingPayload);
  const collectionId = mongoose.Types.ObjectId().toString();
  const collectionName = `tmp${collectionId}`;

  return db.model(collectionName, schema);
};
const loadData = (model, count = testDocs.length) =>
  Promise.each(testDocs.slice(0, count), doc => model.create(doc));

const rawMongooseCount = mongoose.Query.prototype.count;
let counter = { call: false };
mongoose.Query.prototype.count = function (...args) {
  counter.call = true;
  return rawMongooseCount.apply(this, args);
};

test.beforeEach(() => {
  counter = { call: false };
});

test.after.always('clean up tmp collection', () =>
  Promise.fromNode(callback =>
    db.db.listCollections({ name: /^tmp/ }).toArray(callback))
    .map(collection => collection.name)
    .map(dropCollection));

test('paging in sparse mode, query.count should not be called', (t) => {
  const model = getModel();
  const payload = {
    sparse: true,
  };
  return loadData(model, 10)
    .then(() => model.paging({}, payload))
    .then(({ count, data }) => {
      t.is(data.length, 10, 'default page size');
      t.is(count, 10, 'docs count in db');
      t.false(
        counter.call,
        'query.count should not be call when docs less then pagesize',
      );
    });
});

test('correctlly paging result', (t) => {
  const model = getModel();
  return loadData(model)
    .then(() => model.paging())
    .then(({ data, count }) => {
      t.is(data.length, 30, 'default page size');
      t.is(count, 100, 'docs count in db');
    });
});

test('correctlly paging result with fewer docs', (t) => {
  const model = getModel();
  return loadData(model, 10)
    .then(() => model.paging())
    .then(({ data, count }) => {
      t.is(data.length, 10);
      t.is(count, 10);
    });
});

test('docs without name by payload.select', (t) => {
  const model = getModel();
  const payload = {
    select: '-name',
  };
  return loadData(model, 10)
    .then(() => model.paging({}, payload))
    .then(({ data }) => {
      data.forEach((doc) => {
        t.false(Object.keys(doc).includes('name'));
      });
    });
});

test('docs without name by payload.sort', (t) => {
  const model = getModel();
  const payload = {
    sort: '_id',
  };
  return loadData(model, 10)
    .then(() => model.paging({}, payload))
    .then(({ data }) => {
      data.reduce((prev, curr) => {
        t.true(prev._id < curr._id);
        return curr;
      });
    });
});
