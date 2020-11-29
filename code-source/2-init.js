/**
 * 二、初始化阶段
 * 主要是创建 renderer 的两类函数：
 * 1. createRenderer
 * 2. createBundleRenderer
 * 
 * server.js 中会在node启动时初始化一个 renderer 单例对象
 */

/**
 * 1. createRenderer
 * 函数可以接受对象传入 template
 */
const vueServerRenderer = require('vue-server-renderer')
const template = fs.readFileSync('./index.template.html', 'utf-8')
const rendererWithTemplate = vueServerRenderer.createRenderer({
  template: template
})

/**
 * 2. createBundleRenderer
 * 函数接受两个参数，serverBundle 内容和 options 配置
 */
const template = fs.readFileSync(path.join(process.cwd(), './index.template.html'), 'utf-8')
const serverBundle = require('./dist/server/vue-ssr-server-bundle.json')
const clientManifest = require('./dist/client/vue-ssr-client-manifest.json')
const renderer = VueServerRenderer.createBundleRenderer(serverBundle, {
  runInNewContext: false,
  inject: true,
  template,
  clientManifest
})

/**
 * vue-server-renderer 相关源码
 */

/**
 * vue-server-renderer 入口
 * const vueServerRenderer = require('vue-server-renderer')
 * 
 */
process.env.VUE_ENV = 'server';

function createRenderer$1 (options) {
  if ( options === void 0 ) options = {};

  return createRenderer(extend(extend({}, options), {
    isUnaryTag: isUnaryTag,
    canBeLeftOpenTag: canBeLeftOpenTag,
    modules: modules,
    directives: extend(baseDirectives, options.directives)
  }))
}

var createBundleRenderer = createBundleRendererCreator(createRenderer$1);

exports.createRenderer = createRenderer$1;
exports.createBundleRenderer = createBundleRenderer;

/**
 * createBundleRendererCreator 包装函数
 */
function createBundleRendererCreator (createRenderer) {

  return function createBundleRenderer ( bundle,  rendererOptions  ) {
    if ( rendererOptions === void 0 ) rendererOptions = {};

    var files, entry, maps;
    var basedir = rendererOptions.basedir;

    // load bundle if given filepath
    if (
      typeof bundle === 'string' &&
      /\.js(on)?$/.test(bundle) &&
      path$2.isAbsolute(bundle) // var path$2 = require('path');
    ) {
      if (fs.existsSync(bundle)) {
        var isJSON = /\.json$/.test(bundle);
        basedir = basedir || path$2.dirname(bundle);
        bundle = fs.readFileSync(bundle, 'utf-8');
        if (isJSON) {
          try {
            bundle = JSON.parse(bundle);
          } catch (e) {
            throw new Error(("Invalid JSON bundle file: " + bundle))
          }
        }
      } else {
        throw new Error(("Cannot locate bundle file: " + bundle))
      }
    }

    /**
     * server bundle
     * { 
     *    "entry": "static/js/app.80f0e94fe005dfb1b2d7.js", 
     *    "files": { 
     *       "app.80f0e94fe005dfb1b2d7.js": "module.exports=function(t...", // 所有服务端运行的代码
     *  } 
     */
    if (typeof bundle === 'object') {
      entry = bundle.entry;
      files = bundle.files;

      basedir = basedir || bundle.basedir;
      maps = createSourceMapConsumers(bundle.maps);

      if (typeof entry !== 'string' || typeof files !== 'object') {
        throw new Error(INVALID_MSG)
      }

    } else if (typeof bundle === 'string') {
      entry = '__vue_ssr_bundle__';
      files = { '__vue_ssr_bundle__': bundle };
      maps = {};
    } else {
      throw new Error(INVALID_MSG)
    }

    var renderer = createRenderer(rendererOptions);
    /**
     * 这里创建的 run 就代替了我们在 server.js 手动执行 createApp(context) 代码的关键。
     */
    var run = createBundleRunner(
      entry,
      files,
      basedir,
      rendererOptions.runInNewContext
    );

    return {
      renderToString: function (context, cb) {
        // 省略到 渲染阶段分析
      },

      renderToStream: function (context) {
        // 省略到 渲染阶段分析
      }
    }
  }
}


/**
 * 共用的核心： createRenderer 
 * 
 * 关键代码：生成 render templateRenderer
 */
function createRenderer (ref) {
  if ( ref === void 0 ) ref = {};
  var modules = ref.modules; if ( modules === void 0 ) modules = [];
  var directives = ref.directives; if ( directives === void 0 ) directives = {};
  var isUnaryTag = ref.isUnaryTag; if ( isUnaryTag === void 0 ) isUnaryTag = (function () { return false; });
  var template = ref.template;
  var inject = ref.inject;
  var cache = ref.cache;
  var shouldPreload = ref.shouldPreload;
  var shouldPrefetch = ref.shouldPrefetch;
  var clientManifest = ref.clientManifest;
  var serializer = ref.serializer;

  var render = createRenderFunction(modules, directives, isUnaryTag, cache);
  var templateRenderer = new TemplateRenderer({
    template: template,
    inject: inject,
    shouldPreload: shouldPreload,
    shouldPrefetch: shouldPrefetch,
    clientManifest: clientManifest,
    serializer: serializer
  });

  return {
    renderToString: function renderToString (component, context, cb ) {
      // 省略到 渲染阶段分析
    },

    renderToStream: function renderToStream (component, context ) {
      // 省略到 渲染阶段分析
    }
  }
}