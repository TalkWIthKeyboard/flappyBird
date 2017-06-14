# FlappyBirdOnline
![node-icon](https://img.shields.io/badge/node-6.2.2-blue.svg) ![egret](https://img.shields.io/badge/egret-4.0.3-blue.svg) ![express-icon](https://img.shields.io/badge/express-4.15.2-yellow.svg) ![mongoose-icon](https://img.shields.io/badge/mongoose-4.9.6-yellow.svg) ![build-icon](https://img.shields.io/badge/build-passing-brightgreen.svg) 

> This is a online game **flappy bird**.
> Version: 1.1.0

![flappybird-img](http://oj7mt8loy.bkt.clouddn.com/2017-06-14%2014.29.56.gif)

## Update
日期 | 版本 | 功能
----|------|----
2016-6-12 | v1.1.0 | 添加排行榜功能
2016-6-6 | v1.0.0 | 完成网络基础功能

## Explain
这是一个 ```H5``` 游戏，前端使用 ```Egret``` 引擎开发，打包后通过 ```Express``` 进行发布。所以该库只是**发布库**，**游戏开发库**见下。游戏开发库的编写推荐```Egret``` 官方的IDE：**EgretWing3**。

[FlappyBird-Egret](https://github.com/TalkWIthKeyboard/FlappyBird-Egret.git)

## Installation & Start
+ 克隆游戏开发库

```
$ git clone https://github.com/TalkWIthKeyboard/FlappyBird-Egret.git
```

+ 修改Websocket服务器地址并**发布**

```
$ cd FlappyBird-Egret/src
$ vim Websocket.ts
```

+ 克隆发布库

```
$ git clone https://github.com/TalkWIthKeyboard/flappyBird.git
```

+ 将在 ```FlappyBird-Egret/bin-release/web``` 中的发布文件对 ```flappyBird/public``` 进行覆盖


+ 启动项目**（默认5500端口，可以修改）**

```
$ cd flappyBird
$ node app.js
```

**最新版本添加了与数据库的交互，所以需要手动到 ```app.js``` 里配置数据库的端口**

## Game-design

```
.
├── BackgroundImage.ts    // 背景类 
├── Bird.ts               // 小鸟类
├── Birds.ts              // 小鸟数组类 
├── Column.ts             // 障碍物类  
├── Columns.ts            // 障碍物数组类  
├── Floor.ts              // 地板类  
├── LoadingUI.ts          // 加载UI类  
├── Main.ts               // 主逻辑类
├── Score.ts              // 通用的分数类
├── TextInput.ts          // 通用的输入框类
└── Websocket.ts          // 处理Websocket通信逻辑类
```
物理引擎使用的是 ```Egret``` 官方推荐的 ```p2```，小鸟和障碍物的背后都创建了**配套的刚体**进行物理碰撞的模拟，并且整个游戏场景是设有重力场，让小鸟的跳跃与降落更加的自然。 

## Server-design
### 通信协议：**Websocket**
通过 ```Websocket``` 对**正则字符串**进行传递，主要监听：

+ message
    + start
    + jump
    + high
    + dead 
+ close 

### 同步策略：**共享玩家状态的帧同步**
+ **玩家同步**
    + 客户端定时向服务端汇报该客户端玩家的状态
    + 服务端维护一个玩家的状态数组
    + 服务端定时向客户端广播所有玩家的状态
    + 客户端插值向新状态转移 
    
+ **障碍物同步**
    + 由服务端统一生成所有的障碍物，并更新障碍物位置，使用定长队列进行维护
    + 服务端统一向客户端广播现在存活的客户端位置
    + 客户端插值向障碍物新状态转移
    + 客户端会自动释放已经淘汰的障碍物


