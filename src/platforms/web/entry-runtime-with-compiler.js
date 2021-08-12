/* @flow */

import config from "core/config";
import { warn, cached } from "core/util/index";
import { mark, measure } from "core/util/perf";

/**
 * 20210811 从自己的同目录下platforms/runtime/index中引入了Vue
 * 继续向上追溯 import Vue from 'core/index'
 * 继续向上追溯 import Vue from './instance/index' (core目录下)这里定义了真正的Vue 本质上是一个构造函数、
 * ==================
 * 在代码的最后面 又把Vue导出了 我们在项目中引入使用Vue的时候 其实就是使用的当前这个文件导出的Vue
 * 在我们去New Vue(options)的时候做了什么？要追溯到 定义Vue构造函数的文件下 core/instance/index.js
 * 发现Vue构造函数内只做了一件事 this._init(options)
 * 然后把自己（函数）本身当作参数传入了 xxxMixn 方法中 依次执行
 * initMixin(Vue) 初始化 生命周期错误
 * stateMixin(Vue) vuex相关？
 * eventsMixin(Vue) 初始化事件 methods
 * lifecycleMixin(Vue) 初始化 生命周期？
 * renderMixin(Vue) 初始化渲染相关？
 * 执行完毕后把Vue导出
 *
 * 在initMixin(Vue) 这个方法里 core/instance/init.js 里面定义了this._init方法
 * Vue.prototype._init = function (options?: Object) {}
 * Vue 初始化主要就干了几件事情，合并配置，初始化生命周期，初始化事件中心，初始化渲染，初始化 data、props、computed、watcher 等等。
 *
 */
import Vue from "./runtime/index";
import { query } from "./util/index";
import { compileToFunctions } from "./compiler/index";
import {
  shouldDecodeNewlines,
  shouldDecodeNewlinesForHref,
} from "./util/compat";

const idToTemplate = cached((id) => {
  const el = query(id);
  return el && el.innerHTML;
});

// 缓存了原型上的 $mount 方法，再重新定义该方法
const mount = Vue.prototype.$mount;
/**
 * 如果没有定义 render 方法，则会把 el 或者 template 字符串转换成 render 方法。
 * 在 Vue 2.0 版本中，所有 Vue 的组件的渲染最终都需要 render 方法，无论我们是用单文件 .vue 方式开发组件，
 * 还是写了 el 或者 template 属性，最终都会转换成 render 方法，那么这个过程是 Vue 的一个“在线编译”的过程，
 * 它是调用 compileToFunctions 方法实现的编译过程。最后，调用原先原型上的 $mount 方法挂载。
 * @param {*} el
 * @param {*} hydrating
 * @returns
 * 原先原型上的 $mount 方法在 src/platform/web/runtime/index.js 中定义，
 * 之所以这么设计完全是为了复用，因为它是可以被 runtime only 版本的 Vue 直接使用的
 * ======   ======
 * $mount 方法实际上会去调用 mountComponent 方法，这个方法定义在 src/core/instance/lifecycle.js 文件中
 */
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el);

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== "production" &&
      warn(
        `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
      );
    return this;
  }

  const options = this.$options;
  // resolve template/el and convert to render function
  if (!options.render) {
    let template = options.template;
    if (template) {
      if (typeof template === "string") {
        if (template.charAt(0) === "#") {
          template = idToTemplate(template);
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== "production" && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            );
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML;
      } else {
        if (process.env.NODE_ENV !== "production") {
          warn("invalid template option:" + template, this);
        }
        return this;
      }
    } else if (el) {
      template = getOuterHTML(el);
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== "production" && config.performance && mark) {
        mark("compile");
      }

      const { render, staticRenderFns } = compileToFunctions(
        template,
        {
          shouldDecodeNewlines,
          shouldDecodeNewlinesForHref,
          delimiters: options.delimiters,
          comments: options.comments,
        },
        this
      );
      options.render = render;
      options.staticRenderFns = staticRenderFns;

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== "production" && config.performance && mark) {
        mark("compile end");
        measure(`vue ${this._name} compile`, "compile", "compile end");
      }
    }
  }
  /**
   * 最后，调用原先原型上的 $mount 方法挂载
   * 这个方法定义在  src\platforms\web\runtime\index.js
   * 他实质上去调用了 mountComponent(this, el, hydrating) 这个方法
   */
  return mount.call(this, el, hydrating);
};

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML(el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML;
  } else {
    const container = document.createElement("div");
    container.appendChild(el.cloneNode(true));
    return container.innerHTML;
  }
}

Vue.compile = compileToFunctions;

export default Vue;
