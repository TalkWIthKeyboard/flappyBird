/**
 * Created by CoderSong on 17/5/13.
 */

const pub = {};
const WebSocket = require('ws');
const Score = require('./../model/score');
const _ = require('underscore');
const moment = require('moment');
let position = new Map();
let oldColumns = new ColumnList();
let columns = new ColumnList();

/**
 * 广播
 * @param wss
 * @param ws
 * @param otherData 发送给非自己客户端的信息
 * @param myData 发送给自己客户端的信息
 */
let broadcast = (wss, ws, otherData, myData) => {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client !== ws
        ? client.send(otherData)
        : client.send(myData)
    }
  });
};

/**
 * 单播给自己
 * @param wss
 * @param ws
 * @param data
 */
let sendToMe = (wss, ws, data) => {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN)
      if (client === ws) client.send(data)
  });
};

/**
 * 获取当前会话的id
 * @param wss
 * @param ws
 * @param cb
 */
let getWsNumber = (wss, ws, cb) => {
  wss.clients.forEach((client) => {
    if (client === ws)
      cb(client._ultron.id);
  })
};

/**
 * map转字符串
 * @param map
 */
let mapToString = (map) => {
  let str = '';
  for (let item of map.entries()) {
    str += `${item[0]}:${item[1].x}|${item[1].y}|${item[1].name}/`;
  }
  return str;
};

/**
 *
 * @param len
 */
let nSpace = (len) => {
  let str = '';
  for (let i = 0; i < len; i++) str += ' ';
  return str;
};

/**
 * list转字符串
 * @param list
 * @returns {string}
 * @constructor
 */
let listToString = (list) => {
  let str = '';
  for (let i = 0; i < list.length; i++)
    str +=  `${i}.    ${list[i].name}\r`;
  str += ',';
  for (let i = 0; i < list.length; i++)
    str += `${list[i].score}\r`;
  return str;
};


let savePromise = (score) => {
  return new Promise((resolve, reject) => {
    score.save((err,data) => {
      if (err) reject(err);
      else resolve(data);
    })
  })
};

let findPromise = () => {
  return new Promise((resolve, reject) => {
    Score.findTopTen((err, data) => {
      if (err) reject(err);
      else resolve(data);
    })
  })
};


function Column(number) {

  const columnWidth = 53;
  const columnHeight = 320;
  const stageW = 414;

  this.x = stageW + columnWidth / 2;
  this.height = Math.floor(Math.random() * columnHeight);
  this.number = number;

  this.setX = (x) => {
    this.x = x;
  };
}

/**
 *
 * @constructor
 */
function ColumnList() {

  const columnWidth = 53;
  const stageW = 414;

  this.shift = () => {
    this.columnList.shift();
  };

  this.push = () => {
    let column = new Column(this.number);
    this.columnList.push(column);
  };

  this.change = () => {
    for (let i = 0; i < this.columnList.length; i++) {
      this.columnList[i].setX(this.columnList[i].x - 20);
    }
  };

  this.print = () => {
    let str = '';
    for (let i = 0; i < this.columnList.length; i++) {
      str += `${this.columnList[i].number}/${this.columnList[i].height}/${this.columnList[i].x}?`;
    }
    return str;
  };

  this.checkPush = () => {
    let len = this.columnList.length;
    if (len == 0 || this.columnList[len - 1].x < stageW - 200) {
      this.push();
      this.number = (this.number + 1) % 100;
    }
  };

  this.checkShift = () => {
    if (this.columnList[0].x + columnWidth < 0) this.columnList.shift();
  };

  this.clear = () => {
    this.number = 0;
    this.columnList = [];
  };

  this.copy = (col) => {
    col.clear();
    for (let i = 0; i < this.columnList.length; i++) {
      let _col = {};
      _col.number = this.columnList[i].number;
      _col.x = this.columnList[i].x;
      _col.height = this.columnList[i].height;
      col.columnList.push(_col);
    }
    col.number = this.number;
  };

  this.columnList = [];
  this.number = 0;
  this.checkPush();
}

// 每120毫秒更新一下管子状态并广播所有用户
setInterval(() => {
  // 保留这一时刻
  columns.copy(oldColumns);
  // 修改栏杆的x
  columns.change();
  // 删除屏幕外的栏杆（每次最多删除一个）
  columns.checkShift();
  // 添加新栏杆（每次最多添加一个）
  columns.checkPush();
}, 120);

/**
 * Websocket事件
 * @param wss
 */
pub.connection = (wss) => {
  wss.on('connection', (ws) => {

    // 单播用户
    setInterval(() => {
      // 水管的上一时刻坐标 和 水管的当前时刻坐标
      sendToMe(wss, ws, `oldColumn,${oldColumns.print()},column,${columns.print()}`);
      // 所有小鸟的坐标
      sendToMe(wss, ws, `position,${mapToString(position)}`);
    }, 120);

    ws.on('message',(message) => {
      getWsNumber(wss, ws, (num) => {
        let list = message.split(',');
        switch (list[0]) {
          case 'start':
            position.set(num, {x: parseFloat(list[1]), y: parseFloat(list[2]), name: list[3]});
            broadcast(wss, ws,
              // start 别人进入游戏 这名玩家的信息
              `start,1,${num}:${position.get(num).x}|${position.get(num).y}|${position.get(num).name}`,
              // start 自己进入游戏 其他玩家的信息
              `start,0,${mapToString(position)}`
            );
            break;
          case 'jump':
            // 当有玩家跳跃时，广播所有玩家谁跳跃
            broadcast(wss, ws, `jump,${num}`, `jump,${num}`);
            break;
          case 'dead':
            position.delete(num);
            // 当有玩家死亡的时候，广播所有玩家
            let score = new Score({username: list[2], score: parseInt(list[3])});
            savePromise(score)
              .then(findPromise)
              .then(data => {
                let list = [];
                _.each(data, (each) => {
                  let obj = {};
                  obj.name = each.username;
                  obj.score = each.score;
                  obj.date = new moment(each.meta.createAt).format("YYYY-MM-DD HH:mm:ss");
                  list.push(obj);
                });
                broadcast(wss, ws, `dead,${num}`, `dead,,${listToString(list)}`);
              })
              .catch(err => {console.log(err)});
            break;
          case 'high':
            // 同步客户端的小鸟高度
            if (position.has(parseInt(list[1]))) {
              let obj = position.get(parseInt(list[1]));
              position.set(parseInt(list[1]), {x: obj.x, y:parseFloat(list[2]), name: obj.name});
            }
        }
      })
    });

    ws.on('close', () => {
      getWsNumber(wss, ws, (num) => {
        position.delete(num);
        // 当有玩家退出游戏时，广播其他玩家它退出
        broadcast(wss, ws, 'close,' + num, null);
      })
    })
  });
};



module.exports = pub;