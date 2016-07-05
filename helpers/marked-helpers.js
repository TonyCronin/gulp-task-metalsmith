// (c) Andrew Wei

const marked = require('marked');
const Prism = require('prismjs');
require('prismjs/components/prism-actionscript');
require('prismjs/components/prism-bash');
require('prismjs/components/prism-batch');
require('prismjs/components/prism-c');
require('prismjs/components/prism-cpp');
require('prismjs/components/prism-csharp');
require('prismjs/components/prism-docker');
require('prismjs/components/prism-go');
require('prismjs/components/prism-haml');
require('prismjs/components/prism-handlebars');
require('prismjs/components/prism-ini');
require('prismjs/components/prism-jade');
require('prismjs/components/prism-java');
require('prismjs/components/prism-json');
require('prismjs/components/prism-jsx');
require('prismjs/components/prism-makefile');
require('prismjs/components/prism-markdown');
require('prismjs/components/prism-matlab');
require('prismjs/components/prism-nginx');
require('prismjs/components/prism-objectivec');
require('prismjs/components/prism-php');
require('prismjs/components/prism-python');
require('prismjs/components/prism-ruby');
require('prismjs/components/prism-sass');
require('prismjs/components/prism-scala');
require('prismjs/components/prism-scss');
require('prismjs/components/prism-sql');
require('prismjs/components/prism-stylus');
require('prismjs/components/prism-swift');
require('prismjs/components/prism-yaml');

const renderer = new marked.Renderer();

renderer.code = function(code, lang, escaped) {
  code = this.options.highlight(code, lang);
  if (!lang) return `<pre><code>${code}\n</code></pre>`;
  const langClass = `language-${lang}`;
  return `<pre class="${langClass}"><code class="${langClass}">${code}</code></pre>\n`;
};

/**
 * Marked renderer made compatible with Prism.
 *
 * @type {Object}
 */
exports.renderer = renderer;

/**
 * Marked highlighter made compatible with Prism.
 *
 * @type {Function}
 */
exports.highlight = function(code, lang) {
  if (!Prism.languages.hasOwnProperty(lang)) lang = 'markup';
  return Prism.highlight(code, Prism.languages[lang]);
};
