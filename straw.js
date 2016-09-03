const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const requireDir = require('require-dir-all');

const gather = (arr, prop) => arr
  .map(v => v[prop])
  .map(v => (Array.isArray(v) ? v : [v]))
  .reduce((srcs, s) => srcs.concat(s), []);

class Files {
  // Impure
  // File that invoked this script right now
  static invokingFilePath() {
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
  }

  // Impure
  // File to first require this script
  static primaryInvokingFilePath() {
    return module.parent ? module.parent.filename : null;
  }

  static requireFolder(folder) {
    const options = { recursive: true };
    return requireDir(folder, options);
  }

  static invokingFileName() {
    return path.parse(Files.invokingFilePath()).name;
  }
}

class TaskPaths {
  constructor() {
    this.paths = null;
    this.gulpfileLoaded = false;
    Object.preventExtensions(this);
  }

  set(paths) {
    this.paths = paths;
  }

  get() {
    if (this.paths) { return this.paths; }
    this.loadPaths(); // Gulpfile should call a function to set the paths
    if (!this.paths) { throw new Error('Path not set in GulpFiles.js'); }
    return this.paths;
  }

  // @private
  loadPaths() {
    if (this.gulpfileLoaded) { throw new Error('Path not set in GulpFiles.js'); }
    const projectRoot = process.cwd();
    const rootFiles = fs.readdirSync(projectRoot);
    const gulpFilename = rootFiles.find(f => /^gulpFiles.js$/i.test(f));

    require(path.join(projectRoot, gulpFilename)); // eslint-disable-line global-require
    this.gulpfileLoaded = true;
  }

}

class TaskConfig {
  static findSubTasks(obj) {
    return obj
      ? Object.keys(obj)
        .filter(k => obj[k] && (obj[k].src || obj[k].dest))
        .reduce((result, prop) => Object.assign(result, { [prop]: obj[prop] }), {})
      : [];
  }

  static create(name, obj) {
    return Object.assign({}, obj, { name });
  }

  static registerTask(conf, func) {
    conf && func(conf); // eslint-disable-line no-unused-expressions, max-len
  }
}

class Straw {
  constructor() {
    this.paths = new TaskPaths();
    Object.preventExtensions(this);
  }

  // ================ Public API =============== //
  registerAll(tasksDir, paths) {
    // Set tasks paths
    this.paths.set(paths);

    const isFirstInvocation = Files.invokingFilePath() === Files.primaryInvokingFilePath();
    if (isFirstInvocation) {
      const p = Files.invokingFilePath();
      const invokingDir = path.parse(p).dir;
      const tasksDirAbsolute = path.join(invokingDir, tasksDir);
      // load tasks
      Files.requireFolder(tasksDirAbsolute);
    }
  }

  registerOne(registrationFunc) {
    const paths = this.paths.get();
    const filename = Files.invokingFileName();
    const tasksObj = paths[filename];
    const mainTasksObj = tasksObj;
    const subTasksObj = TaskConfig.findSubTasks(tasksObj);

    const mainName = filename;
    const subNames = Object.keys(subTasksObj).map(n => `${mainName}:${n}`);

    const mainInfo = mainTasksObj;
    const subInfos = Object.keys(subTasksObj).map(k => subTasksObj[k]);

    const mainConfig = TaskConfig.create(mainName, mainInfo);
    const subConfigs = subInfos.map((info, idx) => TaskConfig.create(subNames[idx], info));

    let tasks;
    if (subConfigs.length > 0) {
      tasks = subConfigs;
      gulp.task(filename, subConfigs.map(c => c.name));
    } else {
      tasks = [mainConfig];
    }

    tasks.map(config => TaskConfig.registerTask(config, registrationFunc));

    const src = gather(tasks, 'src');
    const dest = gather(tasks, 'dest');
    const subTasks = tasks.reduce((state, t) => Object.assign({ [t.name]: t }, state), {});
    return { src, dest, subTasks, name: mainName };
  }
}

module.exports = new Straw();
