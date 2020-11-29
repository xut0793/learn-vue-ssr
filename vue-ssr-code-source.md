# vue-server-renderer 源码解析

[[toc]]

##  Vue SSR 渲染的几个阶段

1. webpack 编译阶段
   1. 入口 entry-client.js 生成用于客户端浏览器渲染的 js 文件和一份用于template组装的json 文件：vue-ssr-server-bundle.json
   2. 服务端打包入口 entry-server.js，生成客户端渲染的 json 文件：vue-ssr-server-bundle.json
2. 初始化 renderer 阶段：
   1. 使用 vue-server-renderer 的 API 会在node启动时初始化一个renderer 单例对象
3. 渲染阶段：
   1. 初始化完成，当用户发起请求时，renderer.renderToString 或者 renderer.renderToStream 函数将完成 vue组件到 html 片段的字符串的过程。
4. HTML 内容输出阶段：
   1. 渲染阶段我们已经拿到了vue组件渲染结果，它是一个html字符串，在浏览器中展示页面我们还需要css、js 等依赖资源的引入标签 和 通过 store 同步我们在服务端的渲染数据，这些最终组装成一个完整的 html 报文输出到浏览器中。
5. 客户端激活阶段
   1. 当客户端发起了请求，服务端返回 HTML，用户就已经可以看到页面渲染结果了，不用等待js加载和执行。但此时页面还不能交互，需要激活客户页面，即 hydirating 过程。

## 源码解析

针对上述各个阶段，通过 vue-server-renderer 的源码理清具体逻辑。

vue-server-renderer 基本完整实现了一个服务端的 vue ，包括模板编译、组件渲染、依赖收集、和状态更新的所有功能。核心代码都跟 vue 差不多，具体可以看 vue 源码相关的文章介绍，这里重点关注 renderer 的创建和回调的执行逻辑。

### 一、webpack 构建结果

当采用`VueServerRenderer.createBundleRenderer`创建 bundle render 渲染方式时：

1、通过 `entry-client.js / webpack.client.config.js` 构建出客户端依赖资源 ：

- Client Bundle 包含了所有需要在客户端运行的脚本和静态资源，如：js、css图片、字体等。

- 还有一份 clientManifest 文件清单：vue-ssr-client-manifest.json。

  - 清单中initial数组中的js将会在ssr输出时插入到html字符串中作为preload和script脚本引用。

  - async和modules将配合检索出异步组件和异步依赖库的js文件的引入，在输出阶段我们会详细解读。

```js
{ 
  "publicPath": "//cdn.xxx.cn/xxx/", 
  "all": [ 
    "static/js/app.80f0e94fe005dfb1b2d7.js", 
    "static/css/app.d3f8a9a55d0c0be68be0.css"
  ], 
  "initial": [ 
    "static/js/app.80f0e94fe005dfb1b2d7.js",
    "static/css/app.d3f8a9a55d0c0be68be0.css"
  ], 
  "async": [ 
    "static/js/xxx.29dba471385af57c280c.js" 
  ], 
  "modules": { 
    "00f0587d": [ 0, 1 ] 
    // 省略... 
    } 
}
```

2、通过 `entry-server.js / webpack.server.config.js`构建出的 vue-ssr-server-bundle.json 包含了所有要在服务端运行的代码列表，和一个入口文件名。

```js
{ 
  "entry": "static/js/app.80f0e94fe005dfb1b2d7.js", 
  "files": { 
    "app.80f0e94fe005dfb1b2d7.js": "module.exports=function(t...", // 所有服务端运行的代码
  } 
}
```

## 二、初始化 renderer

vue-server-renderer 提供了两种方式创建 renderer：`createRenderer / createBundleRenderer`

```js
// 第一种：简单的适合演示学习
const vueServerRenderer = require('vue-server-renderer')
const template = fs.readFileSync('./index.template.html', 'utf-8')
const renderer = vueServerRenderer.createRenderer({
  template: template
})
// 第二种：适合实际工程，需要配合构建工具和构建插件
const VueServerRenderer = require('vue-server-renderer')
const template = fs.readFileSync('./index.template.html'), 'utf-8')
const serverBundle = require('./dist/server/vue-ssr-server-bundle.json')
const clientManifest = require('./dist/client/vue-ssr-client-manifest.json')
const renderer = VueServerRenderer.createBundleRenderer(serverBundle, {
  runInNewContext: false,
  template,
  clientManifest
})
```

源码入口

```js
// const VueServerRenderer = require('vue-server-renderer') 所获得的对象
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
```

看下 从`createRenderer`到`createBundleRenderer` 的差异逻辑的关键函数`createBundleRendererCreator`

```js

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
```

可以看到，`createBundleRendererCreator`函数的关键是创建一个 run 函数和 renderer 函数。其中 run 执行函数就是为什么使用 bundle render 渲染方式时不需要我们手动在 server.js 中执行 createApp 的原因。

之后就是共同的核心代码 createRender 函数

```js
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
```

可以看到 createRenderer 函数的核心是创建了 render 和 templateRenderer 两个函数。

- render 用于渲染 vue 组件成 html 片段的字符串结果
- templateRenderer 用于根据我们传入的 template 来组装最终需要返回的 html 结果，用于浏览器渲染。

## 三、渲染阶段 renderToString

初始化完成，当用户发起请求时，renderer.renderToString 或者 renderer.renderToStream 函数将完成 vue组件到 html 片段的字符串的过程。

```js
server.get('*', (req, res) => {
  // 使用 createBundleRenderer 创建的 renderer 中会在内部添加 context.state / context.rendered 
  const context = {url: req.url}
  renderer.renderToString(context).then(html => {
    res.status(200)
    res.set('Content-Type', 'text/html')
    res.send(html)
  }).catch((err) => {
    console.error(err);
    res.status(500).end('Internal Server')
  })
})
```

所以我们看下 `renderToString` 的实现：

```js
function renderToString (component, context, cb) {
  var assign;

  if (typeof context === 'function') {
    cb = context;
    context = {};
  }
  if (context) {
    templateRenderer.bindRenderFns(context);
  }

  // no callback, return Promise
  var promise;
  if (!cb) {
    assign = createPromiseCallback()
    promise = assign.promise
    cb = assign.cb
  }

  var result = '';
  var write = createWriteFunction(function (text) {
    result += text;
    return false
  }, cb);
  try {
    //渲染阶段： renderer 用来渲染 vue 组件成 marker；
    render(component, write, context, function (err) {
      if (err) {
        return cb(err)
      }
      if (context && context.rendered) {
        // vue 组件渲染完成回调时机
        context.rendered(context);
      }
      if (template) {
        try {
          // 在渲染阶段的回调中，组装输出 HTL：templateRenderer 用来处理组装模板文件成最终输出的 html，此时就会使用 clientManifest
          var res = templateRenderer.render(result, context);
          if (typeof res !== 'string') {
            // function template returning promise
            res.then(function (html) { return cb(null, html); }).catch(cb);
          } else {
            cb(null, res);
          }
        } catch (e) {
          cb(e);
        }
      } else {
        cb(null, result);
      }
    });
  } catch (e) {
    cb(e);
  }

  return promise
}
```

其中回调的大部分代码都是为了兼容 `fn(err.html) / promise.then(html)`，关键逻辑就是调用 `createRender`函数生成的 `render / templateRender`方法。并且 templateRnder 是在 render 完成后的回调中执行。

所以我们先来关注创建 `render` 的 `createRenderFunction`的实现：

```js
function createRenderFunction ( modules, directives, isUnaryTag, cache) {
  return function render ( component, write, userContext, done ) {
    warned = Object.create(null);

    // 1. 生成渲染上下文
    var context = new RenderContext({
      activeInstance: component,
      userContext: userContext,
      write: write, 
      done: done, 
      renderNode: renderNode,
      modules: modules, 
      isUnaryTag: isUnaryTag, 
      directives: directives,
      cache: cache
    });

    // 2. 安装服务端渲染的工具函数
    installSSRHelpers(component);
    //3. 编译组件生成 $options.render 属性，即生成 compiled 编译模板，生成$options.render 和 $options.staticRenderFns，同 Vue 源码编译阶段一样 
    normalizeRender(component);

    var resolve = function () { 
      // 5. 渲染组件，比较下 vue 源码： vm._update(vm._render(), hydrating), 差异就是 _update 过程，即 patch 过程
      // Vue.prototype._render 关键代码就是执行编译生成的渲染函数，即 $options.render：
      // vnode = component.$options.render.call(vm, vm.$createElement);
      renderNode(component._render(), true, context);
    };
    // 4. 等待组件 serverPrefetch 执行，获取组件依赖的数据
    waitForServerPrefetch(component, resolve, done);
  }
}
```

深入到上面每一步函数的代码：

```js
/**
 * 1. 生成渲染上下文
 */
var RenderContext = function RenderContext (options) {
  this.userContext = options.userContext;
  this.activeInstance = options.activeInstance;
  this.renderStates = [];

  this.write = options.write;
  this.done = options.done;
  this.renderNode = options.renderNode;

  this.isUnaryTag = options.isUnaryTag;
  this.modules = options.modules;
  this.directives = options.directives;

  var cache = options.cache;
  if (cache && (!cache.get || !cache.set)) {
    throw new Error('renderer cache must implement at least get & set.')
  }
  this.cache = cache;
  this.get = cache && normalizeAsync(cache, 'get');
  this.has = cache && normalizeAsync(cache, 'has');

  this.next = this.next.bind(this);
};

RenderContext.prototype.next = function next () {
  // eslint-disable-next-line
  while (true) {
    var lastState = this.renderStates[this.renderStates.length - 1];
    if (isUndef(lastState)) {
      return this.done()
    }
    /* eslint-disable no-case-declarations */
    switch (lastState.type) {
      case 'Element':
      case 'Fragment':
        var children = lastState.children;
      var total = lastState.total;
        var rendered = lastState.rendered++;
        if (rendered < total) {
          return this.renderNode(children[rendered], false, this)
        } else {
          this.renderStates.pop();
          if (lastState.type === 'Element') {
            return this.write(lastState.endTag, this.next)
          }
        }
        break
      case 'Component':
        this.renderStates.pop();
        this.activeInstance = lastState.prevActive;
        break
      case 'ComponentWithCache':
        this.renderStates.pop();
        var buffer = lastState.buffer;
        var bufferIndex = lastState.bufferIndex;
        var componentBuffer = lastState.componentBuffer;
        var key = lastState.key;
        var result = {
          html: buffer[bufferIndex],
          components: componentBuffer[bufferIndex]
        };
        this.cache.set(key, result);
        if (bufferIndex === 0) {
          // this is a top-level cached component,
          // exit caching mode.
          this.write.caching = false;
        } else {
          // parent component is also being cached,
          // merge self into parent's result
          buffer[bufferIndex - 1] += result.html;
          var prev = componentBuffer[bufferIndex - 1];
          result.components.forEach(function (c) { return prev.add(c); });
        }
        buffer.length = bufferIndex;
        componentBuffer.length = bufferIndex;
        break
    }
  }
};

/**
 * 2. 安装服务端渲染的工具函数
 */
var ssrHelpers = {
  _ssrEscape: escape,
  _ssrNode: renderStringNode,
  _ssrList: renderStringList,
  _ssrAttr: renderAttr,
  _ssrAttrs: renderAttrs$1,
  _ssrDOMProps: renderDOMProps$1,
  _ssrClass: renderSSRClass,
  _ssrStyle: renderSSRStyle
};

function installSSRHelpers (vm) {
  if (vm._ssrNode) {
    return
  }
  var Vue = vm.constructor;
  // 向上找到根的 vue 构造函数
  while (Vue.super) {
    Vue = Vue.super;
  }
  extend(Vue.prototype, ssrHelpers);
  if (Vue.FunctionalRenderContext) {
    extend(Vue.FunctionalRenderContext.prototype, ssrHelpers);
  }
}

/**
 * 3. 编译组件生成 $options.render 属性，即生成 compiled 编译模板，生成$options.render 和 $options.staticRenderFns，
 * 同 Vue 源码编译阶段一样 
 */
var normalizeRender = function (vm) {
  var ref = vm.$options;
  var render = ref.render;
  var template = ref.template;
  var _scopeId = ref._scopeId;
  if (isUndef(render)) {
    if (template) {
      var compiled = compileToFunctions(template, {
        scopeId: _scopeId,
        warn: onCompilationError
      }, vm);

      vm.$options.render = compiled.render;
      vm.$options.staticRenderFns = compiled.staticRenderFns;
    } else {
      throw new Error(
        ("render function or template not defined in component: " + (vm.$options.name || vm.$options._componentTag || 'anonymous'))
      )
    }
  }
};

/**
 * 4. 等待组件 serverPrefetch 执行，获取组件依赖的数据
 */
function waitForServerPrefetch (vm, resolve, reject) {
  var handlers = vm.$options.serverPrefetch;
  if (isDef(handlers)) {
    if (!Array.isArray(handlers)) { handlers = [handlers]; }
    try {
      var promises = [];
      for (var i = 0, j = handlers.length; i < j; i++) {
        var result = handlers[i].call(vm, vm);
        if (result && typeof result.then === 'function') {
          promises.push(result);
        }
      }
      Promise.all(promises).then(resolve).catch(reject);
      return
    } catch (e) {
      reject(e);
    }
  }
  resolve();
}

/**
 * 5. 渲染组件，比较下 vue 源码： vm._update(vm._render(), hydrating), 差异就是 _update 过程，即 patch 过程
 */
function renderNode (node, isRoot, context) {
  /**
   * 根据节点的类型，使用不同方式处理
   */
  if (node.isString) {
    renderStringNode$1(node, context);
  } else if (isDef(node.componentOptions)) {
    renderComponent(node, isRoot, context);
  } else if (isDef(node.tag)) {
    renderElement(node, isRoot, context);
  } else if (isTrue(node.isComment)) {
    if (isDef(node.asyncFactory)) {
      // async component
      renderAsyncComponent(node, isRoot, context);
    } else {
      context.write(("<!--" + (node.text) + "-->"), context.next);
    }
  } else {
    context.write(
      node.raw ? node.text : escape(String(node.text)),
      context.next
    );
  }
}
```

renderNode 的结果就是调用传入的 `write`方法拼接出返回的 HTML 片段字符串。

看下传入的 `context.write`的实现，关键就是：` reslut += text` 字段串的拼接。

```js
var write = createWriteFunction(function (text) {
    result += text;
    return false
  }, cb);

```

## 四、HTML 内容输出阶段：

渲染阶段我们已经拿到了vue组件渲染结果，它是一个html 片段字符串，在浏览器中展示页面我们还需要css、js 等依赖资源的引入标签 和 通过 store 同步我们在服务端的渲染数据，这些最终组装成一个完整的 html 报文输出到浏览器中。

这些的实现就是 templateRender 函数，关键是我们传入的模板文件 `template` 和构建出来的 `clientManifest`

```js
var templateRenderer = new TemplateRenderer({
    template: template,
    inject: inject,
    shouldPreload: shouldPreload,
    shouldPrefetch: shouldPrefetch,
    clientManifest: clientManifest,
    serializer: serializer
  });
```

看下 `TemplateRenderer` 构建类的实现

```js
var TemplateRenderer = function TemplateRenderer (options) {
  this.options = options;
  this.inject = options.inject !== false;
  
  // 第一步：解析传入的模板文件 template  
  var template = options.template;
  this.parsedTemplate = template
    ? typeof template === 'string'
      ? parseTemplate(template)
      : template
    : null;

  // function used to serialize initial state JSON
  this.serialize = options.serializer || (function (state) {
    return serialize(state, { isJSON: true })
  });

  // 第二步：解析传入的 clientManifest
  // extra functionality with client manifest
  if (options.clientManifest) {
    var clientManifest = this.clientManifest = options.clientManifest;
    // ensure publicPath ends with /
    this.publicPath = clientManifest.publicPath === ''
      ? ''
      : clientManifest.publicPath.replace(/([^\/])$/, '$1/');
    // preload/prefetch directives
    this.preloadFiles = (clientManifest.initial || []).map(normalizeFile);
    this.prefetchFiles = (clientManifest.async || []).map(normalizeFile);
    // initial async chunk mapping
    this.mapFiles = createMapper(clientManifest);
  }
};
```

先看下对模板的解析函数处理逻辑：

```js
function parseTemplate (
  template,
  contentPlaceholder
) {
  if ( contentPlaceholder === void 0 ) contentPlaceholder = '<!--vue-ssr-outlet-->';

  if (typeof template === 'object') {
    return template
  }

  var i = template.indexOf('</head>');
  var j = template.indexOf(contentPlaceholder);

  if (j < 0) {
    throw new Error("Content placeholder not found in template.")
  }

  if (i < 0) {
    i = template.indexOf('<body>');
    if (i < 0) {
      i = j;
    }
  }

  return {
    head: compile$1(template.slice(0, i), compileOptions),
    neck: compile$1(template.slice(i, j), compileOptions),
    tail: compile$1(template.slice(j + contentPlaceholder.length), compileOptions)
  }
}
```

这里我们看到熟悉的服务端渲染的标记`<!--vue-ssr-outlet-->`，以此为基础，将模板文件分为 `head / neck / tail`三部分返回。

在 render 回调函数中，最终返回 HTML 的函数是调用 `var res = templateRenderer.render(result, context);`所以，我们看下 `TemplateRenderer.prototype.render`的定义：

```js
TemplateRenderer.prototype.render = function render (content, context) {
  var template = this.parsedTemplate;
  if (!template) {
    throw new Error('render cannot be called without a template.')
  }
  context = context || {};

  if (typeof template === 'function') {
    return template(content, context)
  }

  if (this.inject) {
    return (
      template.head(context) +
      (context.head || '') +
      this.renderResourceHints(context) +
      this.renderStyles(context) +
      template.neck(context) +
      content +
      this.renderState(context) +
      this.renderScripts(context) +
      template.tail(context)
    )
  } else {
    return (
      template.head(context) +
      template.neck(context) +
      content +
      template.tail(context)
    )
  }
};

```

看到这里就明白，最终是将 render 函数渲染的结果 content 与 head / neck / tail 完成拼装。关于每部分具体的工具函数 `renderResourceHints / renderStyles /renderState / renderScripts  ` 可以自行查看源码。

这里我们关注下实现同步应用数据状态同步 store.state 的实现 `renderState`

```js
TemplateRenderer.prototype.renderState = function renderState (context, options) {
  var ref = options || {};
  var contextKey = ref.contextKey; if ( contextKey === void 0 ) contextKey = 'state';
  var windowKey = ref.windowKey; if ( windowKey === void 0 ) windowKey = '__INITIAL_STATE__';
  var state = this.serialize(context[contextKey]);
  var autoRemove = '';
  var nonceAttr = context.nonce ? (" nonce=\"" + (context.nonce) + "\"") : '';
  return context[contextKey]
    ? ("<script" + nonceAttr + ">window." + windowKey + "=" + state + autoRemove + "</script>")
    : ''
};
```

## 五、客户端激活阶段

当客户端发起了请求，服务端返回 HTML，用户就已经可以看到页面渲染结果了，不用等待js加载和执行。

但此时页面还不能交互，需要激活客户页面，即 hydirating 过程。 这里就涉及 Vue 的源码部分

```js
/**
 * Vue 渲染流程
 * 1. HTML 模板，只有 <div id="app"></div>
 * 2. 加载 js，在 js 中执行 new Vue 里的一系列初始化代码
 * 3. 挂载：vm.$mount('#app')
 *    3.1 cmopile: 编译模板成渲染函数赋值给 vm.$option.render，即 with(this) {...}
 *    3.2 render: vm._render 执行 vm.$option.render 渲染生成 Vnode，依赖收集也在这步进行
 *    3.3 update：vm._update ：属性事件等数据更新，及挂载DOM
 *        3.3.1 执行旧 oldVnode 和新 Vnode 对比 patch / patchVnode，完成属性等数据到真实 DOM中；主要由 invokeCreateHooks 函数完成
 *        下面这步就是 SSR 的分界点：
 *        3.3.2 如果是服务端渲染：不执行挂载，直接退出。因为此时已经将相关节点的属性、事件等数据同步到 DOM 中。
 * 
 * 所以 SSR 操作中，同一份 HTML 片段同时在服务器和客户端被初始化、编译、到一半的 _update 过程，所以 SSR 也称为同构。
 */

// virtual DOM patching 算法主要逻辑
function createPatchFunction (backend) {
  // 省略代码...
  return function patch (oldVnode, vnode, hydrating, removeOnly) {
    if (isUndef(vnode)) {
      if (isDef(oldVnode)) { invokeDestroyHook(oldVnode); }
      return
    }

    var isInitialPatch = false;
    var insertedVnodeQueue = [];

    if (isUndef(oldVnode)) {
      // empty mount (likely as component), create new root element
      // 如果没有旧节点可对比，说明此时是首次初始化节点，不需要对比，直接用 vnode 创建DOM元素
      isInitialPatch = true;
      createElm(vnode, insertedVnodeQueue);
    } else {
      var isRealElement = isDef(oldVnode.nodeType);
      if (!isRealElement && sameVnode(oldVnode, vnode)) {
        // patch existing root node
        patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly);
      } else {
        if (isRealElement) {
          // 服务端渲染 SSR 视图更新的主要逻辑：hydrate 函数
          //  var SSR_ATTR = 'data-server-rendered';
          if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
            oldVnode.removeAttribute(SSR_ATTR);
            hydrating = true;
          }
          if (isTrue(hydrating)) {
            /**
             * 由于服务器已经渲染好了 HTML，我们显然无需将其丢弃再重新创建所有的 DOM 元素。
             * 相反，我们需要"激活"这些静态的 HTML，然后使他们成为动态的（能够响应后续的数据变化）。
             * 这步就是 hydrate 过程，最后返回的是服务渲染好的 oldVnode
             */
            /**
             * 在开发模式下， hydrate 过程中，Vue 将推断客户端生成的虚拟 DOM 树 (virtual DOM tree)，
             * 是否与从服务器渲染的 DOM 结构 (DOM structure) 匹配。
             * 
             * 在生产模式下，此检测会被跳过，以避免性能损耗。
             */
            if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
              invokeInsertHook(vnode, insertedVnodeQueue, true);
              // 执行的还是 componentVNodeHooks.insert 插入函数，挂载 insertedVnodeQueue 内子组件 callHook(componentInstance, 'mounted');
              return oldVnode

            } else {
              warn(
                'The client-side rendered virtual DOM tree is not matching ' +
                'server-rendered content. This is likely caused by incorrect ' +
                'HTML markup, for example nesting block-level elements inside ' +
                '<p>, or missing <tbody>. Bailing hydration and performing ' +
                'full client-side render.'
              );
            }
          }
          /**
           * hydrate 执行返回 False, 无法匹配，它将退出混合模式，丢弃现有的 DOM 并从头开始渲染。
           * 这是下面的代码：将服务器渲染出来拿到真实 Dom 元素 （oldVnode ）置为空节点，
           * 并且继续 if 下面的 createElm 函数，用浏览器端渲染出来的 vnode 创建真实 DOM 元素
           */
          // either not server-rendered, or hydration failed.
          // create an empty node and replace it
          oldVnode = emptyNodeAt(oldVnode);
        }

        // replacing existing element
        var oldElm = oldVnode.elm;
        var parentElm = nodeOps.parentNode(oldElm);

        // create new node
        // 省略调用 createElm() 函数
}
```

看下vue 源码中 `hydrating`实现：

```js
/**
 * hydrating 函数只在由服务端渲染的首屏时使用，主要执行一步操作：
 * 1. 执行旧 oldVnode 和新 Vnode 对比 patch / patchVnode，完成属性等数据到真实 DOM中；这一步在服务端渲染特有的,即 hydrating 激活阶段
 * 而页面 DOM 复用由服务端渲染出来的
 */
// Note: this is a browser-only function so we can assume elms are DOM nodes.
function hydrate (elm, vnode, insertedVnodeQueue, inVPre) {
  var i;
  var tag = vnode.tag;
  var data = vnode.data;
  var children = vnode.children;
  inVPre = inVPre || (data && data.pre);
  vnode.elm = elm;

  if (isTrue(vnode.isComment) && isDef(vnode.asyncFactory)) {
    vnode.isAsyncPlaceholder = true;
    return true
  }
  // assert node match 断言确定 vnode 是一个组件节点或与node 一样的节点类型
  {
    if (!assertNodeMatch(elm, vnode, inVPre)) {
      return false
    }
  }
  // componentVNodeHooks.init 主要渲染 vnode 及嵌套的子组件：child.$mount(hydrating ? vnode.elm : undefined, hydrating);
  if (isDef(data)) {
    if (isDef(i = data.hook) && isDef(i = i.init)) { i(vnode, true /* hydrating */); }
    if (isDef(i = vnode.componentInstance)) {
      // child component. it should have hydrated its own tree.
      initComponent(vnode, insertedVnodeQueue);
      return true
    }
  }
  if (isDef(tag)) {
    if (isDef(children)) {
      // empty element, allow client to pick up and populate children
      if (!elm.hasChildNodes()) {
        createChildren(vnode, children, insertedVnodeQueue);
      } else {
        // v-html and domProps: innerHTML
        if (isDef(i = data) && isDef(i = i.domProps) && isDef(i = i.innerHTML)) {
          if (i !== elm.innerHTML) {
            /* istanbul ignore if */
            if (typeof console !== 'undefined' &&
              !hydrationBailed
            ) {
              hydrationBailed = true;
              console.warn('Parent: ', elm);
              console.warn('server innerHTML: ', i);
              console.warn('client innerHTML: ', elm.innerHTML);
            }
            return false
          }
        } else {
          // iterate and compare children lists
          var childrenMatch = true;
          var childNode = elm.firstChild;
          for (var i$1 = 0; i$1 < children.length; i$1++) {
            if (!childNode || !hydrate(childNode, children[i$1], insertedVnodeQueue, inVPre)) {
              childrenMatch = false;
              break
            }
            childNode = childNode.nextSibling;
          }
          // if childNode is not null, it means the actual childNodes list is
          // longer than the virtual children list.
          if (!childrenMatch || childNode) {
            /* istanbul ignore if */
            if (typeof console !== 'undefined' &&
              !hydrationBailed
            ) {
              hydrationBailed = true;
              console.warn('Parent: ', elm);
              console.warn('Mismatching childNodes vs. VNodes: ', elm.childNodes, children);
            }
            return false
          }
        }
      }
    }
    if (isDef(data)) {
      var fullInvoke = false;
      for (var key in data) {
        if (!isRenderedModule(key)) {
          fullInvoke = true;
          // 组件的属性事件等如何映射到真实的 DOM 元素，就是此函数执行各类钩子函数生效的。
          invokeCreateHooks(vnode, insertedVnodeQueue);
          break
        }
      }
      if (!fullInvoke && data['class']) {
        // ensure collecting deps for deep class bindings for future updates
        traverse(data['class']);
      }
    }
  } else if (elm.data !== vnode.text) {
    elm.data = vnode.text;
  }
  return true
}

// 调用初始化元素各类属性、事件的钩子
function invokeCreateHooks (vnode, insertedVnodeQueue) {
  for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
    cbs.create[i$1](emptyNode, vnode);
  }
  i = vnode.data.hook; // Reuse variable
  if (isDef(i)) {
    if (isDef(i.create)) { i.create(emptyNode, vnode); }
    if (isDef(i.insert)) { insertedVnodeQueue.push(vnode); }
  }
}

/**
 * 在把 Vnode 转变成真实的 DOM 期间，有一系列钩子函数来将 Vnode 中的属性、事件等参数转称到真实 DOM 上。
 * var hooks = ['create', 'activate', 'update', 'remove', 'destroy']
 * 
 * 每个钩子函数，都会执行一系列操作，这些操作分为以下几类：
 * var platformModules = [ attrs, klass, events, domProps, style, transition ];
 * var baseModules = [ ref, directives ];
 * 
 * 每一个种类都定义了它会在哪种hooks中执行哪些逻辑：
 * var attrs = { create: updateAttrs, update: updateAttrs };
 * var klass = { create: updateClass, update: updateClass };
 * var events = { create: updateDOMListeners, update: updateDOMListeners };
 * var domProps = { create: updateDOMProps, update: updateDOMProps };
 * var style = { create: updateStyle, update: updateStyle };
 * var transition = inBrowser ? { 省略代码} : {};
 *   var ref = {省略 create / update / destory 钩子函数代码};
 *   var directives = {省略 create / update / destory 钩子函数代码};
 * 
 *   然后进行转换：从每个操作在哪些钩子执行 到 每个钩子要执行的哪些 update 操作：
 *   var hooks = ['create', 'activate', 'update', 'remove', 'destroy'];
 *   cbs: { create: [updatefn], activate: [updatefn], ...}
 *   modules: platformModules.concat(baseModules)
 *   相当于：[ attrs, klass, events, domProps, style, transition, ref, directive ]
 */
for (i = 0; i < hooks.length; ++i) {
  cbs[hooks[i]] = [];
  for (j = 0; j < modules.length; ++j) {
    if (isDef(modules[j][hooks[i]])) {
      cbs[hooks[i]].push(modules[j][hooks[i]]);
    }
  }
}

/**
 * 在处理一个 vue-component 组件节点时，在执行 createComponent 函数时会安装一系列钩子函数执行
 * var componentVNodeHooks = {init: fn, prepatch: fn, insert: fn, destory:fn}
 * 通过定义对应的执行函数：
 * init => invokeCreateHooks: 同时执行上面的 cbs.create, 即一系列 updateFn
 * insert => invokeInsertHooks
 * destory => invokeDestroyHook: 同时执行上面的 cbs.destory ，即一系列 updateFn
 */
function installComponentHooks (data) {
  var hooks = data.hook || (data.hook = {});
  for (var i = 0; i < hooksToMerge.length; i++) {
    var key = hooksToMerge[i];
    var existing = hooks[key];
    var toMerge = componentVNodeHooks[key];
    if (existing !== toMerge && !(existing && existing._merged)) {
      hooks[key] = existing ? mergeHook$1(toMerge, existing) : toMerge;
    }
  }
}
```





## 参考链接

[浅谈Vue SSR中的Bundle](https://juejin.im/post/6844904001285144589)

[Vue SSR深度剖析](https://zhuanlan.zhihu.com/p/61348429)