// (c) VARIANTE
/**
 * @file Gulp task for processing fonts files, with the option to watch for
 *       changes by passing either `--watch` or `--w` flag when running the
 *       task using the CLI.
 */

const $ = require('gulp-task-helpers');
const _ = require('lodash');
const collections = require('metalsmith-collections');
const fs = require('fs-extra');
const i18n = require('i18n');
const inPlace = require('metalsmith-in-place');
const layouts = require('metalsmith-layouts');
const markdown = require('metalsmith-markdown');
const metalsmith = require('metalsmith');
const path = require('path');
const permalinks = require('metalsmith-permalinks');
const sequence = require('run-sequence');
const sitemap = require('metalsmith-mapsite');
const util = require('gulp-util');

const FILE_EXTENSIONS = ['html', 'htm', 'md', 'php', 'jade', 'pug'];

const DEFAULT_CONFIG = {
  base: undefined,
  src: undefined,
  dest: undefined,
  ignore: ['layouts', 'includes', '.DS_Store'],
  watch: undefined,
  i18n: undefined,
  metadata: undefined,
  collections: undefined,
  markdown: undefined,
  layouts: {
    pattern: undefined, // Path relative to `config.src`
    engine: 'jade',
    directory: undefined // Defaults to `config.src`/layouts in runtime.
  },
  inPlace: {
    pattern: '**/*.jade',
    engine: 'jade',
    rename: true
  },
  jade: {
    pretty: true
  },
  sitemap: {
    hostname: undefined,
    omitIndex: true
  },
  envs: {
    production: {
      jade: {
        pretty: false
      }
    }
  }
};

/**
 * Method that defines the task with configurable Metalsmith plugin options.
 *
 * @param {Object} options - Task options.
 * @param {string} [options.base] - Base path for the source files to emit.
 * @param {string} options.src - Directory path relative to `options.base` (if
 *                               specified) where Metalsmith should read files
 *                               from.
 * @param {string} options.dest - Path of destination directory to write files
 *                                to.
 * @param {Array} [options.ignore] - Path(s) relative to `options.src` to
 *                                   ignore.
 * @param {Object} [options.watch] - Options that define the file watching
 *                                   behavior. If set to `false`, watching will
 *                                   be disabled even if the CLI flag is set.
 * @param {string|string[]} [options.watch.files] - Glob pattern(s) that matches
 *                                                  files to watch. Defaults to
 *                                                  the emitted files.
 * @param {string|Function|Array} [options.watch.tasks] - Array of task names or
 *                                                        functions to execute
 *                                                        when watched files
 *                                                        change. Defaults to
 *                                                        the current task name.
 * @param {Object} [options.i18n] - `i18n` options.
 * @param {Object} [options.metadata] - Metadata for Metalsmith templates.
 * @param {Object} [options.collections] - `metalsmith-collections` options, but
 *                                         with an additional key `permalink`
 *                                         which defines the permalink pattern
 *                                         for each individual collection.
 * @param {Object} [options.markdown] - `metalsmith-markdown` options.
 * @param {Object} [options.layouts] - `metalsmith-layouts` options. This object
 *                                     is automatically merged with
 *                                     `options.{engine_name}`, where
 *                                     {engine_name} is the value for
 *                                     `options.layouts.engine`.
 * @param {Object} [options.inPlace] - `metalsmith-in-place` options. This
 *                                     object is automatically merged with
 *                                     `options.{engine_name}`, where
 *                                     {engine_name} is the value for
 *                                     `options.inPlace.engine`.
 * @param {Object} [options.sitemap] - `metalsmith-mapsite` options.
 * @param {boolean} [extendsDefaults=true] - Specifies whether array values are
 *                                           concatenated when merging config
 *                                           options with defaults.
 *
 * @return {Function} - Async function that performs the Metalsmith tasks.
 */
module.exports = function(options, extendsDefaults) {
  if (typeof extendsDefaults !== 'boolean') extendsDefaults = true;

  let isWatching = false;

  return function(callback) {
    const taskName = this.seq[0];

    // Set defaults based on options before merging.
    if (options.src) {
      DEFAULT_CONFIG.watch = {
        files: [$.glob('**/*', { base: $.glob(options.src, { base: options.base }), exts: FILE_EXTENSIONS })],
        tasks: [taskName]
      }
    }

    const config = $.config(options, DEFAULT_CONFIG, extendsDefaults);

    // Set defaults after merging.
    if (!_.get(config, 'layouts.directory')) _.set(config, 'layouts.directory', path.join(config.src, 'layouts'));

    const shouldWatch = (util.env['watch'] || util.env['w']) && (config.watch !== false);
    const src = $.glob(config.src, { base: config.base });
    const dest = $.glob('', { base: config.dest });

    if (shouldWatch && !isWatching) {
      isWatching = true;
      this.watch((config.watch && config.watch.files) || $.glob('**/*', { base: config.src, exts: FILE_EXTENSIONS }), () => {
        sequence.use(this).apply(null, [].concat((config.watch && config.watch.tasks) || [taskName]));
      });
    }

    // Generate default `metalsmith-permalinks` linksets.
    let linksets = [];

    if (_.get(config, 'collections')) {
      for (let collection in _.get(config, 'collections')) {
        let pattern = _.get(config, `collections.${collection}.permalink`) || path.join(collection, ':slug');

        if (pattern) {
          if (_.startsWith(pattern, '/')) pattern = pattern.substr(1);
          linksets.push({
            match: { collection: collection },
            pattern: pattern
          });
        }
      }
    }

    // Spoof i18n metadata so it can bind its API.
    config.metadata.headers = {};

    i18n.configure(config.i18n);
    i18n.init(config.metadata);

    let m = metalsmith(config.base || __dirname)
      .clean(false)
      .source(config.src)
      .ignore(config.ignore)
      .destination(config.dest)
      .metadata(config.metadata)
      .use(function(files, metalsmith, done) {
        // Generate status report.
        Object.keys(files).forEach(file => util.log(util.colors.blue('[metalsmith]'), `Processing file: ${file}`));
        done();
      })
      .use(collections(config.collections))
      .use(markdown(config.markdown))
      .use(layouts(_.merge(config.layouts, _.get(config, _.get(config, 'layouts.engine')))))
      .use(inPlace(_.merge(config.inPlace, _.get(config, _.get(config, 'inPlace.engine')))))
      .use(function(files, metalsmith, done) {
        // Disable permalinks for certain files.
        let regex = new RegExp(`^(404|500)\.(${FILE_EXTENSIONS.join('|')})`);

        Object.keys(files).forEach(file => {
          if (regex.test(path.basename(file))) files[file].permalink = false;
        });

        done();
      })
      .use(permalinks({ relative: false, linksets: linksets }));

    if (!_.isEmpty(_.get(config, 'sitemap.hostname'))) m = m.use(sitemap(config.sitemap));

    m.build(function(err) {
      if (err) {
        if (shouldWatch) {
          util.log(util.colors.blue('[metalsmith]'), util.colors.red(err));
          callback();
        }
        else {
          callback(err);
        }
      }
      else {
        callback();
      }
    });
  }
};
