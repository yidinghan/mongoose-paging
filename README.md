# mongoose-paging

[![Travis](https://img.shields.io/travis/yidinghan/mongoose-paging.svg?style=flat-square)](https://www.npmjs.com/package/mpaging)
[![npm](https://img.shields.io/npm/l/mpaging.svg?style=flat-square)](https://www.npmjs.com/package/mpaging)
[![npm](https://img.shields.io/npm/v/mpaging.svg?style=flat-square)](https://www.npmjs.com/package/mpaging)
[![npm](https://img.shields.io/npm/dm/mpaging.svg?style=flat-square)](https://www.npmjs.com/package/mpaging)
[![David](https://img.shields.io/david/yidinghan/mongoose-paging.svg?style=flat-square)](https://www.npmjs.com/package/mpaging)
[![David](https://img.shields.io/david/dev/yidinghan/mongoose-paging.svg?style=flat-square)](https://www.npmjs.com/package/mpaging)
[![node](https://img.shields.io/node/v/mongoose-paging.svg?style=flat-square)](https://www.npmjs.com/package/mpaging)

mongoose plugin for basic paging

# Getting Start

## NPM

Installation

```shell
npm i -S mpaging
```

## Usage

Quick code snippet

```javascript
const mpaging = require('mpaging');

schema.plugin(mpaging);

// init model, etc.

await model.paging();
await model.paging({ ding: 'dingding' });
await model.paging({}, { limit: 30 });
```
