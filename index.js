// (c) Andrew Wei
/**
 * @file Gulp task for processing template files using Metalsmith. Option to
 *       watch for changes by passing either `--watch` or `--w` flag in the CLI.
 */

const $ = require('gulp-task-helpers');
const _ = require('lodash');
const collections = require('metalsmith-collections');
const fs = require('fs-extra');
const i18n = require('i18n');
const inPlace = require('metalsmith-in-place');
const layouts = require('metalsmith-layouts');
const markdown = require('metalsmith-markdown');
const metadata = require('./plugins/metadata');
const mathjax = require('./plugins/mathjax');
const metalsmith = require('metalsmith');
const noop = require('./plugins/noop');
const pagination = require('metalsmith-pagination');
const path = require('path');
const pathfinder = require('./plugins/pathfinder');
const permalinks = require('metalsmith-permalinks');
const prism = require('./plugins/prism');
const related = require('metalsmith-related');
const reporter = require('./plugins/reporter');
const resolve = require('./plugins/resolve');
const sequence = require('run-sequence');
const sitemap = require('metalsmith-sitemap');
const tags = require('metalsmith-tags');
const util = require('gulp-util');

const FILE_EXTENSIONS = ['html', 'htm', 'md', 'php', 'jade', 'pug'];

const DEFAULT_CONFIG = {
  base: undefined,
  src: undefined,
  dest: undefined,
  ignore: ['layouts', 'includes', '.DS_Store'],
  watch: undefined,
  i18n: undefined,
  metadata: {},
  collections: undefined,
  tags: undefined,
  markdown: {
    langPrefix: 'language-'
  },
  related: {
    terms: 5,
    max: 5,
    threshold: 0,
    pattern: undefined, // Path relative to `config.src`
    text: (doc) => (doc.contents || doc.body || doc.markdown || doc.title || ((doc.tags instanceof Array) && doc.tags.join(', ')))
  },
  prism: {
    lineNumbers: false,
    showLanguage: false
  },
  mathjax: false,
  layouts: {
    pattern: undefined, // Path relative to `config.src`
    engine: 'pug',
    directory: undefined // Defaults to `config.src`/layouts in runtime.
  },
  inPlace: {
    pattern: '**/*.pug',
    engine: 'pug',
    rename: true
  },
  pug: {
    pretty: true
  },
  jade: {
    pretty: true
  },
  sitemap: {
    hostname: undefined,
    pattern: [
      '**/*.html',
      '!**/404.html',
      '!**/500.html'
    ],
    omitIndex: true
  },
  envs: {
    production: {
      pug: {
        pretty: false
      },
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
 * @param {Object|boolean} [options.related] - `metalsmith-related` options. If
 *                                             `false`, plugin is disabled.
 * @param {Object} [options.tags] - `metalsmith-tags` options, with some custom
 *                                  defaults.
 * @param {Object} [options.markdown] - `metalsmith-markdown` options.
 * @param {Object|boolean} [options.mathjax] - Options for MathJax. If `false`,
 *                                             MathJax will be disabled.
 * @param {Object|boolean} [options.prism] - Options for Prism. If `false`,
 *                                           Prism highlighting will be
 *                                           disabled.
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
 * @param {Object} [options.sitemap] - `metalsmith-sitemap` options.
 * @param {boolean} [extendsDefaults=true] - Maps to `useConcat` param in
 *                                           `gulp-task-helpers`#config.
 *
 * @return {Function} - Async function that performs the Metalsmith tasks.
 */
module.exports = function(options, extendsDefaults) {
  let isWatching = false;

  return function(callback) {
    const config = getConfig(this, options, extendsDefaults);
    const shouldWatch = (util.env['watch'] || util.env['w']) && (config.watch !== false);

    if (shouldWatch && !isWatching) {
      isWatching = true;
      this.watch((config.watch && config.watch.files) || $.glob('**/*', { base: config.src, exts: FILE_EXTENSIONS }), () => {
        sequence.use(this).apply(null, [].concat((config.watch && config.watch.tasks) || [this.seq[0]]));
      });
    }

    const metadataConfig = {
      'error-pages': {
        pattern: '**/{500,404}.*',
        metadata: {
          permalink: false
        }
      }
    };

    // Set defaults for metalsmith-layouts.
    if (!_.get(config, 'layouts.directory')) _.set(config, 'layouts.directory', path.join(config.src, 'layouts'));
    _.merge(config.layouts, _.get(config, _.get(config, 'layouts.engine')));

    // Set defaults for metalsmith-in-place
    _.merge(config.inPlace, _.get(config, _.get(config, 'inPlace.engine')));

    // Set defaults for metalsmith-permalinks
    if (!config.permalinks) config.permalinks = { relative: false, linksets: [] };

    // Set defaults for metalsmith-pagination
    if (!config.pagination) config.pagination = {};

    // Set defaults for metalsmith-tags
    if (config.tags) {
      if ((typeof config.tags.layout === 'string') && _.isEmpty(path.extname(config.tags.layout)))
        config.tags.layout = `${config.tags.layout}.${config.layouts.engine}`;

      if (typeof config.tags.path === 'string' && _.isEmpty(path.extname(config.tags.path))) {
        if (!_.endsWith(config.tags.path, '/')) config.tags.path = `${config.tags.path}/`;
        config.tags.path = `${config.tags.path}index.html`;
      }

      if (typeof config.tags.skipMetadata !== 'boolean') config.tags.skipMetadata = true;
    }

    // Set defaults for metalsmith-collections
    if (config.collections) {
      for (let collectionName in config.collections) {
        const data = _.get(config.collections, collectionName);
        let pattern = _.get(data, 'pattern');
        let permalink = _.get(data, 'permalink') || path.join(collectionName, ':slug');
        let date = _.get(data, 'date');
        let paginate = _.get(data, 'paginate');

        if (typeof data.layout !== 'string') data.layout = collectionName;

        if (_.isEmpty(path.extname(data.layout))) {
          data.layout = `${data.layout}.${config.layouts.engine}`;
        }

        if (data.metadata && (typeof data.metadata.layout === 'string') && _.isEmpty(path.extname(data.metadata.layout))) {
          data.metadata.layout = `${data.metadata.layout}.${config.layouts.engine}`;
        }

        if (paginate) {
          if ((typeof paginate.layout === 'string') && _.isEmpty(path.extname(paginate.layout)))
            paginate.layout = `${paginate.layout}.${config.layouts.engine}`;

          if (typeof paginate.path === 'string' && _.isEmpty(path.extname(paginate.path))) {
            if (!_.endsWith(paginate.path, '/')) paginate.path = `${paginate.path}/`;
            paginate.path = `${paginate.path}index.html`;
          }

          if (typeof paginate.first === 'string' && _.isEmpty(path.extname(paginate.first))) {
            if (!_.endsWith(paginate.first, '/')) paginate.first = `${paginate.first}/`;
            paginate.first = `${paginate.first}index.html`;
            paginate.noPageOne = true;
          }

          config.pagination[`collections.${collectionName}`] = paginate;
        }

        if (pattern) {
          metadataConfig[collectionName] = {
            pattern: pattern,
            metadata: _.merge(data.metadata || {}, {
              layout: data.layout
            })
          }
        }

        if (permalink) {
          if (_.startsWith(permalink, '/')) permalink = permalink.substr(1);
          config.permalinks.linksets.push({
            match: { collection: collectionName },
            pattern: permalink,
            date: date
          });
        }
      }
    }

    // Spoof i18n metadata so it can bind its API.
    if (config.i18n) {
      if ((config.i18n.locales instanceof Array) && (typeof config.i18n.defaultLocale !== 'string'))
        config.i18n.defaultLocale = config.i18n.locales[0] || 'en';
      config.metadata.headers = {};
      i18n.configure(config.i18n);
      i18n.init(config.metadata);
    }

    metalsmith(config.base || __dirname)
      .clean(false)
      .source(config.src)
      .ignore(config.ignore)
      .destination(config.dest)
      .metadata(config.metadata)
      .use(collections(config.collections))
      .use(related(config.related))
      .use((config.tags) ? tags(config.tags) : noop())
      .use(pagination(config.pagination))
      .use(metadata(metadataConfig))
      .use(markdown(config.markdown))
      .use(permalinks(config.permalinks))
      .use(pathfinder())
      .use(layouts(config.layouts))
      .use(inPlace(config.inPlace))
      .use((config.prism !== false) ? prism(config.prism) : noop())
      .use((config.mathjax !== false) ? mathjax((typeof config.mathjax === 'object') ? config.mathjax : {}) : noop())
      .use(permalinks(config.permalinks))
      .use(reporter())
      .use((!_.isEmpty(_.get(config, 'sitemap.hostname'))) ? sitemap(config.sitemap) : noop())
      .build(function(err) {
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

function getDefaults(context, options) {
  const defaults = _.cloneDeep(DEFAULT_CONFIG);
  const taskName = context && context.seq[0];

  if (options.src) {
    if (taskName)
      defaults.watch = {
        files: [$.glob('**/*', { base: $.glob(options.src, { base: options.base }), exts: FILE_EXTENSIONS })],
        tasks: [taskName]
      };

    defaults.jade.basedir = $.glob(options.src, { base: options.base });
    defaults.pug.basedir = $.glob(options.src, { base: options.base });
  }

  return defaults;
}

function getConfig(context, options, extendsDefaults) {
  const defaults = getDefaults(context, options);
  return $.config(options, defaults, (typeof extendsDefaults !== 'boolean') || extendsDefaults);
}
