var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var index = require('./routes/index');
var http = require('http');

var app = express();
var Websocket = require('ws');
var worker = require('./routes/websocket');

const server = http.createServer(app);
const wss = new Websocket.Server({ server });

mongoose.connect('mongodb://115.159.1.222:27016/Bird');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

worker.connection(wss);

server.listen(5500);

module.exports = app;
