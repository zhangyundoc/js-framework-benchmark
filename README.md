# js-framework-benchmark

这是几个javascript框架的简单基准。 基准测试创建一个包含随机条目的大表，并测量各种操作的时间，包括渲染持续时间。

![Screenshot](images/screenshot-intact.jpg?raw=true "Screenshot")

## 关于基准测试

以下操作针对每个框架进行基准测试：

* 创建行： 页面加载完毕后创建1,000行所需要的时间 (没有预热)。
* 替换所有行： 更新表格里全部的1,000行所需要的时间 (包括 5 次预热迭代)。
* 部分更新： 对于一个1,000行的表格每10行一更新所需要的时间 (包含 3 次预热迭代)。
* 选择行： 点击某一行后该行倍高亮显示所需要的时间 (包含 5 次预热迭代)。
* 交换行： 在一个1,000行的表格中交换两行所需要的时间 (包含 5 次预热迭代)。
* 移除行： 移除一行所需要的时间 (包含 5 次预热迭代)。
* 创建多行： 页面加载完毕后创建10,000行所需要的时间 (没有预热迭代)。
* 向大型表格尾部追加行： 向一个10,000行的表格添加1000行所需要的时间。 (没有预热)。
* 清空行： 清空一个填充了1,000行的表格所需要的时间。 (没有预热)。
* 内存数据： 页面加载后的内存使用情况。
* 运行 内存： 添加1,000行后的内存使用情况。
* 更新 内存： 对具有1,000行的表单击5次更新后的内存使用情况。 
* 替换 内存： 单击5次创建1,000行后的内存使用情况。
* 重复清除 内存： 创建和清除1,000行5次后的内存使用情况。
* 更新 内存： 对具有1,000行的表单击5次更新后的内存使用情况。
* 启动时间： 加载和解析javascript代码并渲染页面的持续时间。
* 始终如一的互动： lighthouse指标TimeToConsternallyInteractive：一种悲观的TTI  - 当CPU和网络都非常空闲时。 （不再超过50ms的CPU任务）。
* 脚本启动时间： lighthouse指标ScriptBootUpTtime：解析/编译/评估所有页面脚本所需的总ms。
* 主线程工作成本： lighthouse指标MainThreadWorkCost：在主线程上工作所花费的总时间。 包括样式/布局/等。
* 总字节权重： lighthouse指标TotalByteWeight：加载到页面中的所有资源的网络传输成本（压缩后）。

对于所有基准测试，测量持续时间包括渲染时间。

## 结果快照

![Results](images/results.jpg?raw=true "Results")

## 如何开始 - 构建和运行

### 1. 先决条件

安装了node.js（> = 7.6）。基准测试已通过节点8.4.0进行测试。 对于某些框架，您还需要java（> = 8，例如ubuntu上的openjdk-8-jre）。 在尝试构建之前，请确保以下命令有效：
```
> npm
npm -version
6.4.1
> node --version
v8.9.4
> echo %JAVA_HOME% / echo $JAVA_HOME
> java -version
java version "1.8.0_171" ...
> javac -version
javac 1.8.0_171
```

### 2. 开始安装

如上所述，构建和运行所有框架的基准可能具有挑战性，因此我们一步一步地开始...

安装全局依赖项
这只为构建框架和http服务器安装了一些顶级依赖项。
```
npm install
```
在根目录中启动http-server
```
npm start
```
验证http服务器是否正常工作：
尝试打开 [http://localhost:8080/index.html](http://localhost:8080/index.html). 如果你看到类似的东西，说明你已经走在正确的轨道上：
![Index.html](images/index.jpg?raw=true "Index.html")

现在打开一个新的终端窗口并保持http-server在后台运行。

### 3. 构建和运行单个框架

我们现在尝试构建第一个框架。 转到Vue.js目录下
```
cd frameworks/keyed/vue
```
安装依赖
```
npm install
```
构建框架
```
npm run build-prod
```
应该没有构建错误，我们可以在浏览器中打开框架：
[http://localhost:8080/frameworks/keyed/vue/](http://localhost:8080/frameworks/keyed/vue/)

打开浏览器控制台并单击页面上的一些按钮，你应该会在控制台上看到一些测量值。
![First Run](images/run-vue.jpg?raw=true "First run")

> 控制台上打印的内容不是自动基准驱动程序实际测量的内容。 基准驱动程序从chrome的时间轴中提取事件以计算操作的持续时间。 在控制台上方打印的是实际持续时间的近似值，它非常接近实际持续时间。

## 4. 使用自动基准驱动程序运行所有框架

如上所述，基准测试使用自动基准驱动程序，使用chromedriver使用chrome的时间轴测量每个操作的持续时间。 以下是针对单个框架运行的步骤：

```
cd ../../..
cd webdriver-ts
```
安装依赖
```
npm install
```
构建基准驱动程序
```
npm run build-prod
```
运行所有框架的基准驱动程序：
```
npm run selenium
```
然后就可以观看基准测试的运行情况

应该保持chrome窗口可见，否则看起来可能会跳过绘制事件导致错误的结果。在终端上会出现各种日志声明。

该运行的结果将保存在 `webdriver-ts/results` 目录中。 我们可以看看任一个单一操作的结果：
```
cat results/results/intact-v2.4.2-keyed_01_run1k.json
{"framework":"intact-v2.4.2-keyed","keyed":true,"benchmark":"01_run1k","type":"cpu","min":137.671,"max":161.885,"mean":147.23069999999998,"median":146.2935,"geometricMean":147.06972786734943,"standardDeviation":7.319137002103155,"values":[161.885,153.279,143.897,148.762,140.031,148.588,152.656,137.671,143.999,141.539]}
```
如你所见，创建1000行的平均持续时间为147毫秒。

## 5. 更新index.html文件
```
npm run index
```

## 6. 构建并运行所有框架的基准。

你可以通过发布来构建所有框架。
```
cd ..
npm run build-prod
```
从物联网下载依赖后，它开始构建它。 基本上在构建期间应该没有错误，但不能保证依赖关系不会中断。
`npm run selenium`
在根目录下。

然后可以检查所有结果 [http://localhost:8080/webdriver-ts/table.html](http://localhost:8080/webdriver-ts/table.html).
