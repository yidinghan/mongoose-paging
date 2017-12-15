const _ = require('lodash');
const Ajv = require('ajv');

const ajv = new Ajv({
  useDefaults: true,
  coerceTypes: 'array',
});

const parseQ = q => (typeof q === 'string' ? JSON.parse(q) : q);
const page2skip = (payload) => {
  if (_.has(payload, 'page')) {
    payload.skip = payload.limit * payload.page;
  }
};
const getSparseResult = ({
  dataP, q, payload, model,
}) => {
  const newLimit = payload.limit + 1;
  return dataP.limit(newLimit).then((data) => {
    if (data.length <= newLimit) {
      return {
        data,
        count: data.length,
      };
    }

    return model.count(q).then(count => ({
      data,
      count,
    }));
  });
};
const getResult = ({
  dataP, q, payload, model,
}) => {
  if (payload.sparse && !payload.skip) {
    return Promise.all([dataP.exec(), model.count(q)]).then(([data, count]) => ({
      data,
      count,
    }));
  }

  return getSparseResult({
    dataP,
    q,
    payload,
    model,
  });
};

module.exports = (schema, opts = {}) => {
  const optsSchema = {
    type: 'object',
    properties: {
      sparse: { type: 'boolean', default: false },
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

  schema.statics.paging = function paging(query = {}, payload = {}) {
    if (!plValidate(payload)) {
      const errorMsg = ajv.errorsText(plValidate.errors);
      return Promise.reject(new Error(errorMsg));
    }

    const q = parseQ(query);
    const dataP = this.find(q);
    const pop = payload.populate;
    if (!_.isEmpty(pop)) {
      if (Array.isArray(pop)) {
        pop.forEach(p => dataP.populate(p));
      } else {
        dataP.populate(pop);
      }
    }

    page2skip(payload);
    ['select', 'sort', 'skip', 'lean', 'and', 'or', 'limit'].forEach((key) => {
      if (payload[key] !== undefined) {
        dataP[key](payload[key]);
      }
    });

    return getResult({
      dataP,
      q,
      payload,
      model: this,
    });
  };
};
