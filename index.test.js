const { test } = require('ava');
const Promise = require('bluebird');
const mongoose = require('mongoose');

mongoose.Promise = Promise;
const db = mongoose.createConnection('localhost');
const dropCollection = collectionName =>
  Promise.fromNode((callback) => {
    db.db.dropCollection(collectionName, callback);
  });

test.after.always('clean up tmp collection', () =>
  Promise.fromNode(callback =>
    db.db.listCollections({ name: /^tmp/ }).toArray(callback))
    .map(collection => collection.name)
    .map(dropCollection));
