/*
var http = require('http'),

    server = http.createServer(function(req, res)
    {
        res.writeHead(200, {
            'Content-Type': 'text/plain'
        });
        //res.write('hello world!');
        res.write('<h1> hello world! </h1>');
        res.end();
    });

    server.listen(3000);
    console.log('server started');

    */

    var express = require('express'),
        app = express();
        server = require('http').createServer(app),
        io = require('socket.io').listen(server),        //bind socket.io to the server
        users = [];
    app.use('/', express.static(__dirname + '/www'));


    server.listen(3000);
    console.log('server started');


    io.on('connection', function(socket){
        socket.on('login', function(nickname){
            if(users.indexOf(nickname) > -1)
            {
                socket.emit('nickexisted');
            }
            else
            {
                socket.userIndex = users.length; //?
                socket.nickname = nickname;      //?
                users.push(nickname);
                socket.emit('loginSuccess');
                io.sockets.emit('system', nickname, users.length, 'login');
            };
        });


        socket.on('disconnect', function(){
            users.splice(socket.userIndex, 1);
            socket.broadcast.emit('system',socket.nickname,users.length, 'logout');

        });

        socket.on('postMsg', function(msg,color){
            socket.broadcast.emit('newMsg', socket.nickname, msg, color);
        });

        socket.on('isTyping', function(color){
            socket.broadcast.emit('isTyping', socket.nickname, color);
        });

        socket.on('img', function(imgData, color) {
            socket.broadcast.emit('newImg', socket.nickname, imgData, color);
        });

        socket.on('newImg', function(user,img){
            that._displayImage(user,img);
        });
    });
  
