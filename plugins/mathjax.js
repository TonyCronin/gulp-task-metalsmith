// (c) Andrew Wei

const _ = require('lodash');
const async = require('async');
const jsdom = require('jsdom');
const path = require('path');
const util = require('gulp-util');
const MathJax = require('mathjax-node/lib/mj-page');

/**
 * Metalsmith for prerendering math equations in HTML files in MathJax.
 *
 * @param {Object} [options] - Options for MathJax.
 * @param {string} [locale] - Current locale.
 *
 * @return {Function} Metalsmith plugin.
 */
module.exports = function(options, locale) {
  return function(files, metalsmith, done) {
    async.eachSeries(Object.keys(files), prerender, done);

    function prerender(file, done) {
      const data = files[file];

      if ((path.extname(file) !== '.html') || !data.mathjax) {
        done();
      }
      else {
        const contents = data.contents.toString('utf8');

        jsdom.env({
          html: contents,
          done: function(err, window) {
            if (err) {
              if (locale)
                util.log(util.colors.blue('[metalsmith]'), util.colors.green(`[${locale}]`), util.colors.red('Error occured when attempting MathJax rendering on'), util.colors.magenta(file));
              else
                util.log(util.colors.blue('[metalsmith]'), util.colors.red('Error occured when attempting MathJax rendering on'), util.colors.magenta(file));
              throw(err);
            }

            MathJax.start();
            MathJax.typeset(_.merge({
              html: window.document.body.innerHTML,
              renderer: 'SVG',
              inputs: ['TeX']
            }, options || {}), result => {
              window.document.body.innerHTML = result.html;
              const html = '<!DOCTYPE html>\n' + window.document.documentElement.outerHTML.replace(/^(\n|\s)*/, '');
              data.contents = new Buffer(html);
              if (locale)
                util.log(util.colors.blue('[metalsmith]'), util.colors.green(`[${locale}]`), 'Prerendered MathJax for', util.colors.magenta(file));
              else
                util.log(util.colors.blue('[metalsmith]'), 'Prerendered MathJax for', util.colors.magenta(file));
              done();
            });
          }
        });
      }
    }
  };
};
