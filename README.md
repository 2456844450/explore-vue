# explore-vue

### concept

- Vue Constructor

  Vue构造函数要做的事情，实例化一个Vue实例，添加$el,$data,$options三个属性

  建立观察者(Observer)，处理模板编译部分(Compiler)，将data中的所有属性与vue直接绑定

- Observer

  通过递归遍历，Object.defineProperty对data中的所有属性进行数据劫持

- Compiler

  模板编译部分，主要是通过node的attribute属性来匹配到相应的指令，将对应的node与数据绑定起来

- Watcher

  监听者，监听者主要做的工作是保存一个oldValue，如果数据发生了改变，匹配oldValue和newValue必然不相等，这时候进行node值的更新

  实质上就是将数据与模板建立联系

- Dep

  依赖的收集，每次getter劫持的时候，将新的监听者添加到Dep数组中，每次setter劫持时，将Dep数组中的所有监听者执行回调，更新node的数据

  Dep和Watcher的关系是，Watcher是对每次getter操作都进行监听  Dep包含一个Watcher数组  又有一个notify回调可以遍历执行所有的Watcher

### reflection

- Vue初始化实例的时候发生了什么？

  将Vue构造函数实例化，添加属性$data,$el,$options,并先后执行 Observer（用来将data中所有的数据都进行数据劫持），Compiler（模板编译部分，将对应的node与数据绑定起来），最后又一次通过Object.defineProperty将Vue实例上的属性与data中的属性进行关联起来

- Vue双向绑定的原理 v-model

  两部分，一部分是如何实现数据更新视图跟着更新，一部分是如何实现视图更新数据跟着更新

  1.实现数据更新视图跟着更新

  数据getter时，在dep中添加watcher，数据setter时，执行dep的notify回调，遍历每一个watcher，执行函数（通过匹配旧值和新值，如果不相等，对应node的value进行更新）

  2.实现视图更新数据跟着更新

  Compiler会将有v-model的node添加一个input的事件监听，每次输入数据都会更新data中对应属性的值，而每次更新值又会触发setter劫持，进行dep的notify回调。

- 如何匹配到{{msg}}像这样双括号中的变量

  第一，需要知道的是元素标签（elementnode）中的文本值，本身会被一个文本标签(textnode)所包裹住。

  通过Compiler进行模板编译的时候，找到文本标签，用正则匹配来解析node.textContent，如果匹配到{{}}，解析出{{}}中的变量,添加watcher，返回data中对应变量的value，当value更新时，又会触发setter劫持，将watcher执行，匹配新旧值，更新node.textContent

[流程图](https://i.loli.net/2020/07/04/WJsg6MoGAkrEzN7.png)