const utils = {
  getValue(expr, vm) {
    return vm.$data[expr.trim()]
  },
  setValue(expr, vm, newValue) {
    vm.$data[expr] = newValue
  },
  model(node, value, vm) {
    const initValue = this.getValue(value, vm)

    node.addEventListener('input', (e) => {
      const newValue = e.target.value
      this.setValue(value, vm, newValue)
    }) 

  },
  text(node, value, vm) {
    let result
    if (value.includes('{{')) {
      result = value.replace(/\{\{(.+?)\}\}/g, (...args) => {
        const expr = args[1]
        new Watcher(expr, vm, (newVal) => {
          this.textUpdater(node, newVal)
        })
        return this.getValue(args[1], vm)
      })
    } else {
      result = this.getValue(value, vm)
    }

    this.textUpdater(node, result)
  },
  on(node, value, vm, eventName) {

  },
  textUpdater(node, value) {
    node.textContent = value
  } 
}


class Watcher {
  constructor(expr, vm, cb) {
    this.expr = expr
    this.vm = vm
    this.cb = cb
    this.oldValue = this.getOldValue()
  }

  getOldValue() {
    Dep.target = this
    const oldValue = utils.getValue(this.expr, this.vm)
    Dep.target = null
    return oldValue
  }

  update() {
    const newValue = utils.getValue(this.expr, this.vm)
    if (newValue !== this.oldValue) {
      this.cb(newValue)
    }
  }

}

class Dep {
  constructor() {
    this.collect = []
  }

  addWatcher (watcher) {
    this.collect.push(watcher)
  }

  notify() {
    this.collect.forEach(w => w.update())
  }
}

class Compiler {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el)
    this.vm = vm

    const fragment = this.compileFragment(this.el)

    this.compile(fragment)

    this.el.appendChild(fragment)
  }

  compile(fragment) {
    //需要注意的是 文档节点不是普通数组 而是一个节点数组
    const childNodes = Array.from(fragment.childNodes)
    childNodes.forEach(childNode => {
      //如果是标签节点
      if (this.isElementNode(childNode)) {
        this.compileElement(childNode)
      }
      //如果是文本节点 
      else if (this.isTextNode(childNode)) {
        this.compileText(childNode)
      }

      if (childNode.childNodes && childNode.childNodes.length) {
        //递归调用
        this.compile(childNode)
      }
    })
  }

  compileElement(node) {
    //attributes同样不是普通的数组
    const attributes = Array.from(node.attributes)
    attributes.forEach(attr => {
      const { name, value } = attr;
      if (this.isDirector(name)) {
        //director v-model, v-text, v-bind, v-on:click
        //es6 语法的解构赋值
        const [, directive] = name.split('-')
        const [compileKey, eventName] = directive.split(':')
        utils[compileKey](node, value, this.vm, eventName)
      }
    })
  }

  isDirector(name) {
    return name.startsWith('v-')
  }

  compileText(node) {
    const content = node.textContent
    // 匹配到 {{}}
    if (/\{\{(.+)\}\}/.test(content)) {

    }
  }
  compileFragment(el) {
    //创建文档片段
    const f = document.createDocumentFragment()
    let firstChild
    while(firstChild = el.firstChild) {
      //需要知道的是 appendChild方法会把el.firstChild删除掉 
      //也就是说每次el.firstChild都是变化的 
      //直到el的child为空
      f.appendChild(firstChild)
    }
    return f
  }

  isTextNode(el) {
    return el.nodeType === 3
  }

  isElementNode(el) {
    return el.nodeType === 1
  }
}

//观察者
class Observer {
  constructor(data) {
    this.observe(data)
  }

  observe(data) {
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(key => {
        this.defineReactive(data, key, data[key])
      })
    }
  }

  defineReactive(obj, key, value) {
    //递归调用 对象中的普通数据都变成响应式
    this.observe(value)
    const dep = new Dep()
    Object.defineProperty(obj, key, {
      get() {
        const target = Dep.target
        target && dep.addWatcher(target)
        return value
      },

      //这里对set要用箭头函数 而不能作为普通函数  因为你在函数内使用了this  这个指向你要弄清楚
      set: (newVal) => {
        if (value === newVal) return;
        //这里再次递归调用 是因为如果你对一个对象赋值，同样需要将新对象中的每一个属性都变成响应式的
        this.observe(newVal)
        value = newVal

        dep.notify()
      }
    })
  }
} 

//Vue构造函数
class Vue {
  constructor(options) {
    this.$el = options.el
    this.$data = options.data
    this.$options = options

    // 建立观察者  让data中所有的变量变成响应式的
    new Observer(this.$data)


    // 处理模板部分，将模板中使用的data部分的变量和模板绑定起来
    new Compiler(this.$el, this)
    this.proxyData(this.$data)
  }

  //可以通过 this.xx 更改this.$data.xx 的结果
  proxyData(data) {
    Object.keys(data).forEach(key => {
      Object.defineProperty(this, key, {
        get() {
          return data[key]
        },
        set(newVal) {
          data[key] = newVal
        }
      })
    })
  }
}