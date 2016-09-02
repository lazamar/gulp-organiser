const gulp = require('gulp');
const path = require('path');

const taskConfig = (name, obj) => Object.assign({}, obj, { name });

const subTasksProps = (obj) => {
  return obj
    ? Object.keys(obj)
      .filter(k => obj[k] && (obj[k].src || obj[k].dest))
      .reduce((result, prop) => Object.assign(result, { [prop]: obj[prop] }), {})
    : [];
};

const subTaskNames = (tasks, mainTaskName) => Object.keys(tasks).map(n => `${mainTaskName}:${n}`);

const registerTask = (conf, func) => {
  conf && func(conf); // eslint-disable-line no-unused-expressions, max-len
};

const get = v => obj => obj[v];
const getValues = obj => Object.keys(obj).map(k => obj[k]);

const getCallerFilePath = () => {
  try {
    const err = new Error();

    Error.prepareStackTrace = (e, stack) => stack;
    const currentFile = err.stack.shift().getFileName();

    let callerFile;
    while (err.stack.length) {
      callerFile = err.stack.shift().getFileName();
      if (callerFile !== currentFile) return callerFile;
    }
  } catch (err) {
    throw new Error('Error getting task file name');
  }
  return undefined;
};

const getFileName = (filePath) => path.parse(filePath).name;

const getCallerFileName = () => getFileName(getCallerFilePath());

const makeArray = v => (Array.isArray(v) ? v : [v]);

const gather = (arr, prop) => arr
  .map(get(prop))
  .map(makeArray)
  .reduce((srcs, s) => srcs.concat(s), []);


const createReturnObj = (mainTaskName, tasks) => {
  const src = gather(tasks, 'src');
  const dest = gather(tasks, 'dest');
  const subTasks = tasks.reduce((state, t) => Object.assign({ [t.name]: t }, state), {});

  return { src, dest, subTasks, task: mainTaskName };
};

module.exports = function straw(paths, registrationFunc) {
  if (!paths) {
    throw new Error(`No paths object provided for ${filename}`);
  }

  const filename = getCallerFileName();

  const tasksObj = paths[filename];

  const mainTasksObj = tasksObj;
  const subTasksObj = subTasksProps(tasksObj);

  const mainName = filename;
  const subNames = subTaskNames(subTasksObj, mainName);

  const mainInfo = mainTasksObj;
  const subInfos = getValues(subTasksObj);

  const mainConfig = taskConfig(mainName, mainInfo);
  const subConfigs = subInfos.map((info, idx) => taskConfig(subNames[idx], info));

  let tasks;
  if (subConfigs.length > 0) {
    tasks = subConfigs;
    gulp.task(filename, subConfigs.map(get('name')));
  } else {
    tasks = [mainConfig];
  }

  tasks.map(config => registerTask(config, registrationFunc));
  return createReturnObj(filename, tasks);
};
