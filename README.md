# gulp-task-metalsmith [![Circle CI](https://circleci.com/gh/VARIANTE/gulp-task-metalsmith/tree/master.svg?style=svg)](https://circleci.com/gh/VARIANTE/gulp-task-metalsmith/tree/master) [![npm version](https://badge.fury.io/js/gulp-task-metalsmith.svg)](https://badge.fury.io/js/gulp-task-metalsmith)

Gulp task for processing fonts with the option to watch the emitted source files for changes.

## Usage

```js
import gulp from 'gulp';
import fonts from 'gulp-task-metalsmith';

gulp.task('fonts', fonts({
  src: 'app/fonts/**/*',
  dest: 'public/fonts'
}));
```

```
$ gulp fonts
```

## API

### `fonts(options[, extendsDefaults])`

#### `options`

Type: `Object`

Options that define the behavior of this task. You can override options for specific `NODE_ENV` environments by putting the same option inside `options.envs.{NODE_ENV}`. For example:

```js
{
  src: '**/*',
  envs: {
    production: {
      src: 'foo/**/*'
    }
  }
}
```

...would give you the following when `NODE_ENV` is `production`:

```js
{
  src: 'foo/**/*'
}
```

When `NODE_ENV` is blank, `production` environment is assumed.

##### `options.base`

Type: `string`<br>
Default: `undefined`

If specified, this is the base path for the source files to emit into the stream. Patterns defined in `options.src` will be relative to this path.

##### `options.src` (required)

Type: `string` or `Array`<br>
Default: `undefined`

Glob or an array of globs that matches files to emit. These globs are all relative to `options.base` if specified.

##### `options.dest` (required)

Type: `string`<br>
Default: `undefined`

Path of destination directory to write files to.

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

#### `extendsDefaults`

Type: `boolean`<br>
Default: `false`

This module has a default config provided for you. When you pass in your own config via the `options` parameter, the module resolves your config with the default config by using `lodash`(https://lodash.com/)'s `merge` function, which doesn't concatenate array values. If `extendsDefaults` is set to `true`, array values will be concatenated.

## Watching for Changes

You can pass a `--watch` or `--w` flag to the Gulp command to enable file watching, like so:

```
$ gulp fonts --watch
```

By default, files that were emitted as source files will be marked for watching and the task name assigned to this module will be executed whenever a file changes. To override this behavior use `options.watch`.

## License

This software is released under the [MIT License](http://opensource.org/licenses/MIT).
