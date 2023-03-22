require('dotenv').config();

const
  { EleventyServerlessBundlerPlugin } = require('@11ty/eleventy'),
  yaml = require('js-yaml'),
  glob = require('fast-glob');


module.exports = (eleventyConfig) => {

  eleventyConfig.addPlugin(EleventyServerlessBundlerPlugin, {
    name: 'serverless',
    functionsDir: './netlify/functions/',
    copy: [
      'package.json'
    ]
  });


  // Custom Data file formats: yaml
  eleventyConfig.addDataExtension("yaml", contents => yaml.load(contents));


  // Filters
  glob.sync(['./site/_filters/*.js']).forEach(file => {
    let filters = require('./' + file);
    Object.keys(filters).forEach(name => eleventyConfig.addFilter(name, filters[name]));
  });


  // Engine & Filter: Markdown
  const Markdown = require('markdown-it')({
    html: true,         // Enable HTML tags in source
    breaks: true,       // Convert '\n' in paragraphs into <br>
    linkify: true,      // Autoconvert URL-like text to links
    typographer: true,  // Enable some language-neutral replacement + quotes beautification
  })
    .use(require('markdown-it-link-attributes'), {
      pattern: /^(https?:)?\/\//,
      attrs: {
        target: '_blank',
        rel: 'noopener'
      }
    });
  eleventyConfig.setLibrary('md', Markdown);
  eleventyConfig.addFilter('markdown', content => Markdown.render(String(content)));


  // Engine: Nunjucks
  eleventyConfig.setNunjucksEnvironmentOptions({ trimBlocks: true, lstripBlocks: true });


  eleventyConfig.addPassthroughCopy({ 'site/static': '.' });
  eleventyConfig.addPassthroughCopy({ 'node_modules/@fontsource/inter/files/inter-*-variable-full-normal.woff2': 'css/files' });
  eleventyConfig.setServerPassthroughCopyBehavior('passthrough');


  eleventyConfig.addGlobalData('isProduction', process.env.NODE_ENV !== 'development');


  return {
    templateFormats: ['md', 'njk'],
    markdownTemplateEngine: 'njk',

    dir: {
      input: './site',
      includes: '_theme/layouts',
      output: './public'
    }
  };
};
