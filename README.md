# mongoose-paging

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
