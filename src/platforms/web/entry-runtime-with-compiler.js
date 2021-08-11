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
 * 发现Vue构造函数内只做了一件事 this._init(options) 在哪里定义了这个方法呢？
 * 检索了一下 在initMixin(Vue) 这个方法里 core/instance/init.js  Vue.prototype._init = function (options?: Object) {}
 * 然后把自己（函数）本身当作参数传入了 xxxMixn 方法中 执行完毕后把Vue导出
 * initMixin(Vue) 初始化 生命周期错误
 * stateMixin(Vue) vuex相关？
 * eventsMixin(Vue) 初始化事件 methods
 * lifecycleMixin(Vue) 初始化 生命周期？
 * renderMixin(Vue) 初始化渲染相关？
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

const mount = Vue.prototype.$mount;
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
