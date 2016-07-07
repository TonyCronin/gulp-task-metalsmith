// (c) Andrew Wei

const _ = require('lodash');
const async = require('async');
const jsdom = require('jsdom');
const path = require('path');
const util = require('gulp-util');
const Prism = require('prismjs');
require(`prismjs/components/prism-c`);

/**
 * Metalsmith plugin for syntax highlighting code blocks using Prism.
 *
 * @return {Function} Metalsmith plugin.
 */
module.exports = function() {
  return function(files, metalsmith, done) {
    async.eachSeries(Object.keys(files), prerender, done);

    function prerender(file, done) {
      const data = files[file];

      if ((path.extname(file) !== '.html') || !data.prism) {
        done();
      }
      else {
        const contents = data.contents.toString('utf8');

        jsdom.env({
          html: contents,
          done: function(err, window) {
            if (err) {
              util.log(util.colors.blue('[metalsmith]'), util.colors.red('Error occured when attempting syntax highlighting on'), util.colors.magenta(file));
              throw(err);
            }

            const selectors = 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code';
            const elements = window.document.querySelectorAll(selectors);

            async.eachSeries(elements, (element, next) => {
              const language = element.className.match(/\b(language|lang)-(\w+)\b/)[2];

              if (!Prism.languages[language]) {
                try {
                  require(`prismjs/components/prism-${language}`);
                }
                catch (err) {
                  util.log(util.colors.blue('[metalsmith]'), 'Unrecognized language', util.colors.yellow(language), 'in file', util.colors.magenta(file), 'defaulting to', util.colors.yellow('markup'));
                  element.className = 'language-markup';
                }
              }

              Prism.highlightElement(element, true, next);
            }, () => {
              const html = '<!DOCTYPE html>\n' + window.document.documentElement.outerHTML.replace(/^(\n|\s)*/, '');
              data.contents = new Buffer(html);
              done();
            });
          }
        });
      }
    }
  };
};
