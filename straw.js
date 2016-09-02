const gulp = require('gulp');
const path = require('path');

const taskConfig = (name, obj) => {
  return obj.src || obj.dest
    ? Object.assign({}, obj, { name })
    : null;
};

const getSubTasks = (obj, mainTaskName) => {
  const taskNames = Object.keys(obj);
  const configs = taskNames.map(n => taskConfig(`${mainTaskName}:${n}`, obj[n]));
  return configs;
};

const registerTask = (conf, func) => {
  conf && func(conf); // eslint-disable-line no-unused-expressions, max-len
};

const get = v => obj => obj[v];

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
  const filename = getCallerFileName();
  const tasksObj = paths[filename];
  if (tasksObj === undefined) {
    throw new Error(`No configuration found for ${filename}`);
  }

  const mainTask = taskConfig(filename, tasksObj);
  if (mainTask) {
    registerTask(mainTask, registrationFunc);
    return createReturnObj(filename, [mainTask]);
  }

  const subTasks = getSubTasks(tasksObj, filename);
  if (!subTasks.length) {
    throw new Error(`No tasks or subtasks found for ${filename}`);
  }

  subTasks.forEach(t => registerTask(t, registrationFunc));
  // If there are subtasks we will just execute all of them
  // when the task name is called
  gulp.task(filename, subTasks.map(get('name')));
  return createReturnObj(filename, subTasks);
};
