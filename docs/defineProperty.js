/**
 * Object的变化侦测
 *
 * 所谓更细粒度的更新，就是说：假如有一个状态绑定着好多个依赖，每个依赖表示一个具体的DOM节点，
 * 那么当这个状态发生变化时，向这个状态的所有依赖发送通知，让它们进行DOM更新操作。
 * 相比较而言，“拉”的粒度是最粗的。Vue则是”推“，但是它也有一定的代价，因为粒度越细，每个状态所绑定的依赖就越多，依赖追踪在内存上的开销就会越大。
 * 因此，从Vue.js 2.0开始，它引入了虚拟DOM，将粒度调整为中等粒度，即一个状态所绑定的依赖不再是具体的DOM节点，而是一个组件。
 * 这样状态变化后，会通知到组件，组件内部再使用虚拟DOM进行比对。这可以大大降低依赖数量，从而降低依赖追踪所消耗的内存。
 * Vue.js之所以能随意调整粒度，本质上还要归功于变化侦测。因为“推”类型的变化侦测可以随意调整粒度。
 * @param {*} data
 * @param {*} key
 * @param {*} val
 */

function defineReactive(data, key, val) {
  Object.defineProperty(data, key, {
    // writable: true,
    enumerable: true,
    configurable: true,
    get() {
      console.log(`get：我拿到${key}的值为${val}`);
      return val;
    },
    set(newVal) {
      if (val === newVal) {
        return;
      }
      console.log(`set：我设置${key}的值由${val}变成${newVal}`);
      val = newVal;
    },
  });
}
const obj = {};
defineReactive(obj, "age", 18);
// 这也就是Vue中 $set的原理
// this.$set(obj,key,value)
console.log(obj.age);
obj.age = 20;

// 增加收集依赖
// 每个key都有一个数组，用来存储当前key的依赖。假设依赖是一个函数，保存在window.target上
function defineReactive1(data, key, val) {
  let dep = []; // new add 用来存储被收集的依赖
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get() {
      console.log(`get：我拿到${key}的值为${val}`);
      dep.push(window.target); // new add
      return val;
    },
    set(newVal) {
      if (val === newVal) {
        return;
      }
      console.log(`set：我设置${key}的值由${val}变成${newVal}`);
      // new add 在set被触发时，循环dep以触发收集到的依赖。
      for (let i = 0; i < dep.length - 1; i++) {
        dep[i](newVal, val);
      }
      val = newVal;
    },
  });
}

// 解耦代码 封装收集依赖Dep类
export default class Dep {
  constructor() {
    this.subs = [];
  }

  addSub(sub) {
    this.subs.push(sub);
  }
  removeSub(sub) {
    remove(this.subs, sub);
  }
  depend() {
    if (window.target) {
      this.addSub(window.target);
    }
  }

  notify() {
    const subs = this.subs.slice();
    for (let i = 0; i < subs.length; i++) {
      subs[i].update();
    }
  }
}

function remove(arr, item) {
  if (arr.length) {
    const index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1);
    }
  }
}
