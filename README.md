# API
```
/**
 * Registers the directory where gulp task registrations are
 * and provides the paths to be used in each task.
 * @param {String} tasksDir
 * @param {Object} paths
 * @return {Object} a task config object
 */
registerAll(tasksDir, paths)


/**
 * Registers a gulp task.
 * @param {Function} registrationFunc - receives two objects as arguments: (task, allTaks)
 */
register(registrationFunc)


/**
 * Loads all tasks from a path into an array of task configurations
 * @param {String} folderPath
 * @return {Array<Object>} task configs
 */
loadFrom(folderPath)
```

## Registration Function
The registration function receives two arguments: `task` and `allTasks`.
They look as follows:
<!-- TODO: add rest of documentation -->
