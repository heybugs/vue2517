# 变化侦测

## 问题一：JS 中如何侦测变化？

有两种方法可以侦测到变化：使用 Object.defineProperty 和 ES6 的 Proxy。

每当从 data 的 key 中读取数据时，get 函数被触发；每当往 data 的 key 中设置数据时，set 函数被触发。

```js
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
```

## 问题二：如何收集依赖

- 我们之所以要观察数据，其目的是当数据的属性发生变化时，可以通知那些曾经使用了该数据的地方。

- 注意　在 Vue.js 2.0 中，模板使用数据等同于组件使用数据，所以当数据发生变化时，会将通知发送到组件，然后组件内部再通过虚拟 DOM 重新渲染。

所以需要先收集依赖，即把用到数据的地方收集起来，然后等属性发生变化时，把之前收集好的依赖循环触发一遍就好了。

总结起来，其实就一句话，`在 getter 中收集依赖，在 setter 中触发依赖。`

## 问题三：依赖收集在哪里