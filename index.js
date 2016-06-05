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

const FILE_EXTENSIONS = ['html', 'htm', 'md', 'php'];

const DEFAULT_CONFIG = {
  base: undefined,
  src: undefined,
  dest: undefined,
  ignore: ['layouts', 'includes'],
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
    pattern: undefined, // Path relative to `config.src`
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
 * Method that defines the task with configurable options. Only `options.src`
 * and `options.dest` are required.
 *
 * @param {Object} options - Task options.
 * @param {string} [options.base] - Base path for the source files to emit.
 * @param {string|string[]} options.src - Glob or an array of globs that matches
 *                                        files to emit. These globs are all
 *                                        relative to `options.base`.
 * @param {string} options.dest - Path of destination directory to write files
 *                                to.
 * @param {string|Function|Array} [options.watch] - Task(s) or methods to invoke
 *                                                  whenever watched files have
 *                                                  changed. This array is
 *                                                  applied to `run-sequence`.
 *                                                  Defaults to the current
 *                                                  task name.
 * @param {boolean} [extendsDefaults=false] - Specifies whether array values are
 *                                            concatenated when merging config
 *                                            options with defaults.
 *
 * @return {Function} - A function that returns a Gulp stream.
 */
module.exports = function(options, extendsDefaults) {
  if (typeof extendsDefaults !== 'boolean') extendsDefaults = true;

  // Set defaults based on options before merging.
  if (options.src) {
    DEFAULT_CONFIG.watch = {
      files: [$.glob('**/*', { base: $.glob(options.src, { base: options.base }), exts: FILE_EXTENSIONS })]
    }
  }

  const config = $.config(options, DEFAULT_CONFIG, extendsDefaults);
  let isWatching = false;

  // Set defaults after merging.
  if (!_.get(config, 'layouts.directory')) _.set(config, 'layouts.directory', path.join(config.src, 'layouts'));

  return function(callback) {
    const taskName = this.seq[0];
    const shouldWatch = (util.env['watch'] || util.env['w']) && (config.watch !== false);
    const src = $.glob(config.src, { base: config.base });
    const dest = $.glob('', { base: config.dest });

    if (shouldWatch && !isWatching) {
      isWatching = true;
      this.watch((config.watch && config.watch.files) || src, () => { sequence.use(this).apply(null, [].concat((config.watch && config.watch.tasks) || [taskName])); });
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
