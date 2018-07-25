const _ = require('lodash');

const base = require('./base.json');

const storage = {};

function get(path) {
  const baseObject = _.get(base, path);
  const storageObject = _.get(storage, path);

  if (!storageObject) {
    return baseObject;
  }

  if (typeof storageObject !== 'object') {
    return storageObject;
  }

  return _.merge(baseObject, storageObject);
}

function update(path, data) {
  _.update(storage, path, () => data);

  return get(path);
}

function updateById(path, id, data) {
  const objects = get(path);

  // not found? return with new item
  if (!objects.find(obj => obj.id === id)) {
    update(path, [...objects, { id, ...data }]);
  } else {
    // update the item in the array
    update(path, objects.map((obj) => {
      if (obj.id === id) {
        return _.merge({}, obj, data);
      }

      return obj;
    }));
  }

  return get(path).find(obj => obj.id === id);
}

module.exports = {
  get,
  update,
  updateById,
};