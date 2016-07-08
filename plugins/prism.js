// (c) Andrew Wei

const _ = require('lodash');
const async = require('async');
const fs = require('fs');
const jsdom = require('jsdom');
const path = require('path');
const util = require('gulp-util');
const vm = require('vm');
const Prism = require('prismjs');
require('prismjs/components/prism-c');

/**
 * Metalsmith plugin for syntax highlighting code blocks using Prism.
 *
 * @return {Function} Metalsmith plugin.
 */
module.exports = function(options) {
  options = options || {};

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

            let i = 0;

            async.eachSeries(elements, (element, next) => {
              let language = element.className.match(/\b(language|lang)-(\w+)\b/)[2];
              const code = element.innerHTML;
              const parent = (element.parentNode instanceof window.HTMLPreElement) && element.parentNode;

              if (!Prism.languages[language]) {
                try {
                  require(`prismjs/components/prism-${language}`);
                }
                catch (err) {
                  util.log(util.colors.blue('[metalsmith]'), 'Unrecognized language', util.colors.yellow(language), 'in file', util.colors.magenta(file), 'defaulting to', util.colors.yellow('markup'));
                  element.className = 'language-markup';
                  language = undefined;
                }
              }

              if (options.lineNumbers && parent) parent.className += ' line-numbers';

              // HACK ALERT: Until Prism plugins properly supports Node
              // environment, the easiest way is to copy and paste its code here
              // rather than trying to spoof the plugin.
              if (options.showLanguage && (typeof language === 'string')) {
                const Languages = {"html":"HTML","xml":"XML","svg":"SVG","mathml":"MathML","css":"CSS","clike":"C-like","javascript":"JavaScript","abap":"ABAP","actionscript":"ActionScript","apacheconf":"Apache Configuration","apl":"APL","applescript":"AppleScript","asciidoc":"AsciiDoc","aspnet":"ASP.NET (C#)","autoit":"AutoIt","autohotkey":"AutoHotkey","basic":"BASIC","csharp":"C#","cpp":"C++","coffeescript":"CoffeeScript","css-extras":"CSS Extras","fsharp":"F#","glsl":"GLSL","http":"HTTP","inform7":"Inform 7","json":"JSON","latex":"LaTeX","lolcode":"LOLCODE","matlab":"MATLAB","mel":"MEL","nasm":"NASM","nginx":"nginx","nsis":"NSIS","objectivec":"Objective-C","ocaml":"OCaml","parigp":"PARI/GP","php":"PHP","php-extras":"PHP Extras","powershell":"PowerShell","protobuf":"Protocol Buffers","jsx":"React JSX","rest":"reST (reStructuredText)","sas":"SAS","sass":"Sass (Sass)","scss":"Sass (Scss)","sql":"SQL","typescript":"TypeScript","vhdl":"VHDL","vim":"vim","wiki":"Wiki markup","yaml":"YAML"};
                language = parent.getAttribute('data-language') || Languages[language] || (language.substring(0, 1).toUpperCase() + language.substring(1));
                /* check if the divs already exist */
                let sib = parent.previousSibling;
                let div, div2;
                if (sib && /\s*\bprism-show-language\b\s*/.test(sib.className) &&
                  sib.firstChild &&
                  /\s*\bprism-show-language-label\b\s*/.test(sib.firstChild.className)) {
                  div2 = sib.firstChild;
                }
                else {
                  div = window.document.createElement('div');
                  div2 = window.document.createElement('div');
                  div2.className = 'prism-show-language-label';
                  div.className = 'prism-show-language';
                  div.appendChild(div2);
                  parent.parentNode.insertBefore(div, parent);
                }
                div2.innerHTML = language;
              }

              Prism.highlightElement(element, true, () => {
                // HACK ALERT: Until Prism plugins properly supports Node
                // environment, the easiest way is to copy and paste its code
                // here rather than trying to spoof the plugin.
                if (options.lineNumbers && parent) {
                  // Add line numbers
                  let match = code.match(/\n(?!$)/g);
                  let linesNum = match ? match.length + 1 : 1;
                  let lineNumbersWrapper;

                  let lines = new Array(linesNum + 1);
                  lines = lines.join('<span></span>');

                  lineNumbersWrapper = window.document.createElement('span');
                  lineNumbersWrapper.className = 'line-numbers-rows';
                  lineNumbersWrapper.innerHTML = lines;

                  if (parent.hasAttribute('data-start')) {
                    parent.style.counterReset = 'linenumber ' + (parseInt(parent.getAttribute('data-start'), 10) - 1);
                  }

                  element.appendChild(lineNumbersWrapper);
                }

                next();
              });
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
