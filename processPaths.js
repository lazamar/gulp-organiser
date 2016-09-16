const _ = require('lodash/fp');

// Returns a new object with same keys where each new value is the result
// of applying the callback function to the primary value.
// mapKeys :: Function -> Object -> Object
const mapKeys = _.curry((f, obj) => {
  const newObj = {};
  Object.keys(obj).forEach(k => {
    newObj[k] = f(k, obj[k]);
  });
  return newObj;
});

// Gets an object and returns one with a subset of keys where each value is a
// possible task object if it fits the isTask check.
// toPossibleTasks :: Object -> Object
const toPossibleTasks = _.flow(
  // get only key/value pairs where the value is an object
  _.pickBy(_.isPlainObject),
  // Add the `key` string as name property of the value
  mapKeys((key, value) => Object.assign({}, value, { name: key }))
);

// isTask :: Object -> Boolean
const isTask = obj => _.isPlainObject(obj) && (obj.src || obj.dest);

// toArray :: a -> [b]
const toArray = v => {
  if (Array.isArray(v)) {
    return v;
  }
  if (v === null || v === undefined) {
    return [];
  }
  return [v];
};

// generateConfig :: String -> Object -> Object
const generateConfig = mainTaskName => obj => {
  const name = mainTaskName ? `${mainTaskName}:${obj.name}` : obj.name;
  const src = toArray(obj.src).filter(_.isString);
  return Object.assign({}, obj, { name, src });
};

// createTaskConfig :: Object -> [Object]
const createMainTaskConfig = obj => {
  const mainTaskName = obj.name;

  if (isTask(obj)) {
    const mainTask = generateConfig()(obj);
    return [mainTask];
  }

  const subTasks = _.flow(
    toPossibleTasks,
    _.toArray, // make object into an array of values
    _.filter(isTask),
    _.map(generateConfig(mainTaskName))
  )(obj);

  return subTasks;
};

// toTaskConfigs :: Object<Object> -> Object<Array>
const toTaskConfigs = _.flow(toPossibleTasks, _.mapValues(createMainTaskConfig));

module.exports = function processPaths(paths) {
  return toTaskConfigs(paths);
};
