const gulp = require('gulp');
const path = require('path');

const taskConfig = (name, obj) => {
  return obj && (obj.src || obj.dest)
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
  if (!paths) {
    throw new Error(`No paths object provided for ${filename}`);
  }

  const filename = getCallerFileName();
  const tasksObj = paths[filename];
  if (!tasksObj) {
    return createReturnObj(filename, []);
  }

  const mainTask = taskConfig(filename, tasksObj);
  const subTasks = mainTask ? [] : getSubTasks(tasksObj, filename);
  const allTasks = mainTask ? [mainTask] : subTasks;
  allTasks.forEach(t => registerTask(t, registrationFunc));

  if (subTasks.length) {
    // If there are subtasks we will just execute all of them
    // when the task name is called
    gulp.task(filename, subTasks.map(get('name')));
  }

  return createReturnObj(filename, allTasks);
};
