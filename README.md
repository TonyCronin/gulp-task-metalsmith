# gulp-task-metalsmith [![Circle CI](https://circleci.com/gh/andrewscwei/gulp-task-metalsmith/tree/master.svg?style=svg)](https://circleci.com/gh/andrewscwei/gulp-task-metalsmith/tree/master) [![npm version](https://badge.fury.io/js/gulp-task-metalsmith.svg)](https://badge.fury.io/js/gulp-task-metalsmith)

Gulp task for processing template files with Metalsmith plugins, option to watch source files for changes. Built-in plugins are executed in the following order:

1. [metalsmith-collections](https://www.npmjs.com/package/metalsmith-collections)
2. [metalsmith-tags](https://www.npmjs.com/package/metalsmith-tags)
3. [metalsmith-pagination](https://www.npmjs.com/package/metalsmith-pagination)
4. [metalsmith-markdown](https://www.npmjs.com/package/metalsmith-markdown)
5. [metalsmith-layouts](https://www.npmjs.com/package/metalsmith-layouts)
6. [metalsmith-in-place](https://www.npmjs.com/package/metalsmith-in-place)
7. [metalsmith-permalinks](https://www.npmjs.com/package/metalsmith-permalinks)
8. [metalsmith-sitemap](https://www.npmjs.com/package/metalsmith-sitemap)

This task also has built-in support for [i18n](https://www.npmjs.com/package/i18n).

## Usage

```js
import _ from 'lodash';
import browserSync from 'browser-sync';
import gulp from 'gulp';
import metalsmith from 'gulp-task-metalsmith';
import moment from 'moment';
import path from 'path';

gulp.task('views', metalsmith({
  src: path.join(__dirname, 'app'),
  dest: path.join(__dirname, 'public'),
  metadata: {
    _: _,
    m: moment
  },
  collections: {
    blog: {
      pattern: 'blog/**/*.md',
      sortBy: 'date',
      reverse: true,
      permalink: '/blog/:title/',
      layout: 'post',
      paginate: {
        perPage: 5,
        layout: 'page',
        path: 'blog/:num/',
        first: 'blog/'
      }
    }
  },
  tags: {
    path: 'blog/:tag',
    layout: 'page',
    sortBy: 'date',
    reverse: true,
    perPage: 2,
  },
  watch: {
    tasks: [browserSync.reload]
  },
  sitemap: {
    hostname: 'http://www.example.com'
  }
}));
```

```
$ gulp views
```

## API

### `metalsmith(options[, extendsDefaults])`

Returns: `Function`

#### `options`

Type: `Object`

Options that define the behavior of this task. This object is parsed by `config()` in [`gulp-task-helpers`](https://www.npmjs.com/package/gulp-task-helpers), so you can target specific `NODE_ENV` environments.

##### `options.base`

Type: `string`<br>
Default: `undefined`

If specified, this is the base path for the source files to emit into the stream. Patterns defined in `options.src` will be relative to this path.

##### `options.src`

Type: `string``<br>
Default: `undefined`

Path of directory where Metalsmith should read files from, relative to `options.base` if specified.

##### `options.dest`

Type: `string`<br>
Default: `undefined`

Path of destination directory to write files to.

##### `options.ignore`

Type: `Array`<br>
Default: `['layouts', 'includes', '.DS_Store']`

Path(s) relative to `options.src` to ignore.

##### `options.watch`

Type: `Object` or `boolean`

Options that define the file watching behavior. If set to `false`, watching will be disabled regardless of the `--watch` flag.

###### `options.watch.files`

Type: `string` or `string[]`<br>
Default: Patterns computed from `options.base` and `options.src`

Glob pattern(s) that matches the files to be watched. Defaults to the patterns computed from `options.base` and `options.src`.

###### `options.watch.tasks`

Type: `string`, `Function` or `Array`<br>
Default: Current task name

Task(s) or methods to invoke whenever watched files have changed. This array is applied to [`run-sequence`](https://www.npmjs.com/package/run-sequence). Defaults to the current task name.

##### `options.i18n`

Type: `Object`<br>
Default: `undefined`

Options for [`i18n`](https://www.npmjs.com/package/i18n).

##### `options.metadata`

Type: `Object`<br>
Default: `undefined`

Metadata for all templates.

##### `options.collections`

Type: `Object`<br>
Default: `undefined`

Options for [`metalsmith-collections`](https://www.npmjs.com/package/metalsmith-collections), with two additional keys: `permalink`—defines the permalink pattern for each individual collection, and `paginate`—options for [`metalsmith-pagination`](https://www.npmjs.com/package/metalsmith-pagination) for the current collection.

##### `options.tags`

Type: `Object`<br>
Default: `undefined`

Options for [`metalsmith-tags`](https://www.npmjs.com/package/metalsmith-tags).

##### `options.markdown`

Type: `Object`<br>
Default: `undefined`

Options for [`metalsmith-markdown`](https://www.npmjs.com/package/metalsmith-markdown).

##### `options.layouts`

Type: `Object`<br>
Default: 
```js
{
  engine: 'pug',
  directory: `${options.src}`/layouts`
}
```

Options for [`metalsmith-layouts`](https://www.npmjs.com/package/metalsmith-layouts). This object is automatically merged with `options.{engine_name}`, where `{engine_name}` is the value for `options.layouts.engine`.

##### `options.inPlace`

Type: `Object`<br>
Default: 
```js
{
  engine: 'pug',
  rename: true
}
```

Options for [`metalsmith-in-place`](https://www.npmjs.com/package/metalsmith-in-place). This object is automatically merged with `options.{engine_name}`, where `{engine_name}` is the value for `options.inPlace.engine`.

##### `options.mapsite`

Type: `Object`<br>
Default: `undefined`

Options for [`metalsmith-mapsite`](https://www.npmjs.com/package/metalsmith-mapsite).

#### `extendsDefaults`

Type: `boolean`<br>
Default: `true`

Maps to `useConcat` param in `config()` of [`gulp-task-helpers`](https://www.npmjs.com/package/gulp-task-helpers).

## Watching for Changes

You can pass a `--watch` or `--w` flag to the Gulp command to enable file watching, like so:

```
$ gulp views --watch
```

By default, files that were emitted as source files will be marked for watching and the task name assigned to this module will be executed whenever a file changes. To override this behavior see `options.watch`.

## License

This software is released under the [MIT License](http://opensource.org/licenses/MIT).
