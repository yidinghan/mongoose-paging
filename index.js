const _ = require('lodash');
const Ajv = require('ajv');

const ajv = new Ajv({
  useDefaults: true,
  coerceTypes: 'array',
});

module.exports = (schema, opts = {}) => {
  const optsSchema = {
    type: 'object',
    properties: {
      lean: { type: 'boolean', default: true },
      page: { type: 'number' },
      skip: { type: 'number', default: 0 },
      limit: { type: 'number', default: 30 },
      maxLimit: { type: 'number', default: 100 },
      select: { $ref: '#/definitions/stringOrObject' },
      sort: { $ref: '#/definitions/stringOrObject' },
      or: { $ref: '#/definitions/arrayObject' },
      and: { $ref: '#/definitions/arrayObject' },
      populate: {
        anyOf: [
          {
            type: 'array',
            items: { $ref: '#/definitions/stringOrObject' },
          },
          { type: 'object' },
        ],
      },
    },
    definitions: {
      stringOrObject: {
        oneOf: [{ type: 'string' }, { type: 'object' }],
      },
      arrayObject: {
        type: 'array',
        items: { type: 'object' },
      },
      populate: {
        type: 'object',
        properties: {
          path: { type: 'string' },
        },
      },
    },
  };

  const optsValidate = ajv.compile(optsSchema);
  if (!optsValidate(opts)) {
    throw new Error(ajv.errorsText(optsValidate.errors));
  }

  optsSchema.properties.limit.maximum = opts.maxLimit;
  delete optsSchema.properties.maxLimit;
  const plValidate = ajv.compile(optsSchema);

  schema.statics.paging = function paging(query, payload = {}) {
    if (!plValidate(payload)) {
      const errorMsg = ajv.errorsText(plValidate.errors);
      return Promise.reject(new Error(errorMsg));
    }

    const q = typeof query === 'string' ? JSON.parse(query) : query;

    if (_.has(payload, 'page')) {
      payload.skip = payload.limit * payload.page;
    }

    const dataP = this.find(q);
    const pop = payload.populate;
    if (!_.isEmpty(pop)) {
      if (Array.isArray(pop)) {
        pop.forEach(p => dataP.populate(p));
      } else {
        dataP.populate(pop);
      }
    }

    ['select', 'sort', 'skip', 'lean', 'and', 'or', 'limit'].forEach((key) => {
      if (payload[key] !== undefined) {
        dataP[key](payload[key]);
      }
    });

    return Promise.all([dataP.exec(), this.count(q)]).then(([data, count]) => ({
      data,
      count,
    }));
  };
};
