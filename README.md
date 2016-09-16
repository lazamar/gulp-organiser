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

## License
The MIT License (MIT)

Copyright (c) 2015 Troy Gerwien

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
