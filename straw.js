const requireDir = require('require-dir-all');
const path = require('path');
const fs = require('fs');
const gulp = require('gulp');

const requireGulpfile = () => {
  const projectRoot = process.cwd();
  const gulpFilename = fs.readdirSync(projectRoot).find(f => /^gulpfile.js$/i.test(f));
  return require(path.join(projectRoot, gulpFilename)); // eslint-disable-line global-require
};

const tasksPaths = (function () {
  let paths = null;
  let pathRequestCount = 0;
  return {
    set: (p) => (paths = p),
    get: () => {
      if (paths) { return paths; }
      if (pathRequestCount > 0) {
        throw new Error('Path not set in Gulpfile.');
      }
      requireGulpfile(); // Gulpfile should call a function to set the paths
      pathRequestCount++;
      if (!paths) {
        throw new Error('Path not set in Gulpfile.');
      } else {
        return paths;
      }
    },
  };
}());

// Impure
// File to first require this script
const primaryInvokingFilePath = () => {
  return module.parent ? module.parent.filename : null;
};

// Impure
// File that invoked this script right now
const invokingFilePath = () => {
  const originalFunc = Error.prepareStackTrace;
  let filename;
  try {
    const err = new Error();

    Error.prepareStackTrace = (e, stack) => stack;
    const currentFile = err.stack[0].getFileName();

    let callerFile;
    let needle = 0;
    while (err.stack[needle]) {
      callerFile = err.stack[needle].getFileName();
      if (callerFile !== currentFile) {
        filename = callerFile;
        break;
      }
      needle++;
    }
  } catch (err) {
    throw new Error('Error getting task file name');
  }

  Error.prepareStackTrace = originalFunc;
  return filename;
};

const getFileName = (filePath) => path.parse(filePath).name;

const isFirstInvocation = () => invokingFilePath() === primaryInvokingFilePath();

// Load all npm modules of a folder
const requireFolder = (folder) => {
  const options = { recursive: true };
  return requireDir(folder, options);
};

function registerAll(tasksFolder, paths) {
  tasksPaths.set(paths);

  if (isFirstInvocation()) {
    const p = invokingFilePath();
    const invokingDir = path.parse(p).dir;
    const tasksFolderAbsolute = path.join(invokingDir, tasksFolder);
    // load tasks
    requireFolder(tasksFolderAbsolute);
  }
}


// Register task --------------------------------------------------------------
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

const makeArray = v => (Array.isArray(v) ? v : [v]);

const gather = (arr, prop) => arr
  .map(get(prop))
  .map(makeArray)
  .reduce((srcs, s) => srcs.concat(s), []);

const createReturnObj = (mainTaskName, tasks) => {
  const src = gather(tasks, 'src');
  const dest = gather(tasks, 'dest');
  const subTasks = tasks.reduce((state, t) => Object.assign({ [t.name]: t }, state), {});

  return { src, dest, subTasks, name: mainTaskName };
};

function registerOne(registrationFunc) {
  const paths = tasksPaths.get();
  const filename = getFileName(invokingFilePath());

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
}

module.exports = { registerAll, registerOne };
