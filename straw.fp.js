const requireDir = require('require-dir-all');
const processPaths = require('./processPaths');
const _ = require('lodash/fp');
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
    set: (p) => (paths = processPaths(p)),
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
// registerTask :: Object -> function -> void
const registerTask = (conf, func) => {
  conf && func(conf); // eslint-disable-line no-unused-expressions, max-len
};

// makeArray :: a -> [b]
const makeArray = v => (Array.isArray(v) ? v : [v]);

// gather :: [Object] -> String -> [a]
const gather = (arr, prop) => arr
  .map(_.get(prop))
  .map(makeArray)
  .reduce((srcs, s) => srcs.concat(s), []);

// createReturnObj :: String -> [Object] -> Object
const createReturnObj = (mainTaskName, tasks) => {
  const src = gather(tasks, 'src');
  const dest = gather(tasks, 'dest');
  const subTasks = tasks.reduce((state, t) => Object.assign({ [t.name]: t }, state), {});

  return { src, dest, subTasks, name: mainTaskName };
};

// Whether the array contains subtasks or just one main task.
// isJustMaintask :: String -> [Object] -> Boolean
const isJustMainTask = _.curry((mainTaskName, tasks) => {
  return tasks.length === 1 && tasks[0].name === mainTaskName;
});

// Registers the function for one main task and its subTasks
// Returns an object describing the function
// registerOne :: Function -> Object
function registerOne(registrationFunc) {
  const paths = tasksPaths.get();
  const taskName = getFileName(invokingFilePath());
  const tasks = paths[taskName];

  if (!isJustMainTask(taskName, tasks)) {
    gulp.task(taskName, tasks.map(_.get('name')));
  }

  tasks.map(config => registerTask(config, registrationFunc));
  return createReturnObj(taskName, tasks);
}

module.exports = { registerAll, registerOne };
