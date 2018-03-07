window.onload = function() 
{

    var client = new ChatClient();
    
    client.init();
};

var firstTimeTyping = false; // global variable to detect if the user is typing in chat, 
//but I've heard global variables are bad, yet I haven't come up with a better solution to replace this way

var ChatClient = function()
{
    this.socket = null;
};


ChatClient.prototype = {
    init: function(){
        var that = this;
        this.socket = io.connect();
        this.socket.on('connect', function(){
            document.getElementById('info').textContent = 'Please enter a nickname: ';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();

        });

        document.getElementById('loginBtn').addEventListener('click', function() {
            var nickName = document.getElementById('nicknameInput').value;
            if (nickName.trim().length != 0) {
                that.socket.emit('login', nickName);
            } else {
                document.getElementById('nicknameInput').focus();
            };
        }, false);

        document.getElementById('nicknameInput').addEventListener('keyup', function(e){
            if(e.keyCode == 13) {
                var nickName = document.getElementById('nicknameInput').value;
                if(nickName.trim().length != 0){
                    that.socket.emit('login', nickName);
                };
            };
        }, false);

        
        document.getElementById('messageInput').addEventListener('keyup', function(e){
                var messageInput = document.getElementById('messageInput'),
                    msg = messageInput.value,
                    color = document.getElementById('colorStyle').value;
                if(e.keyCode == 13 && msg.trim().length != 0){
                    messageInput.value = '';
                    that.socket.emit('postMsg', msg, color);
                    that._displayNewMsg('me', msg, color);
                }
                else{
                    
                    if(firstTimeTyping == false)
                    {
                        var nickName = document.getElementById('nicknameInput').value;
                        that.socket.emit('isTyping', nickName, color);
                        firstTimeTyping = true;
                    }

                };
                
        }, false);       

        this.socket.on('nickexisted', function() {
            document.getElementById('info').textContent = 'nickname already exist!';
        });

        this.socket.on('loginSuccess', function(){
            document.title = 'chatHub | ' +document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display = 'none';
            document.getElementById('messageInput').focus();

        });

        this.socket.on('system', function(nickName, userCount, type) {
            var msg = nickName + (type == 'login' ? ' has joined the channel!' : ' left the channel!');
            /*
            var p = document.createElement('p'); // ?
            p.textContent = msg;
            document.getElementById('historyMsg').appendChild(p); 
            */
            that._displayNewMsg('System',msg,'red');

            document.getElementById('status').textContent = userCount + (userCount > 1 ? ' users are': ' user is') + ' currently online';

        });

        this.socket.on('isTyping', function(nickName,color){
            var msg = nickName + ' is typing...';
            color = document.getElementById('colorStyle').value;
            that._displayNewMsg('System', msg, 'red');

        });

        document.getElementById('sendBtn').addEventListener('click', function() {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value;
                color = document.getElementById('colorStyle').value;
            messageInput.value = '';
            messageInput.focus();
            if(msg.trim().length != 0){
                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg('me', msg, color);
            };
        }, false);

        this.socket.on('newMsg', function(user, msg, color) {
            that._displayNewMsg(user,msg,color);
        });
        this.socket.on('newImg', function(user, img, color) {
            that._displayImage(user, img, color);
        });
        
        document.getElementById('clearBtn').addEventListener('click', function() {
            document.getElementById('historyMsg').innerHTML = '';
        }, false);

        document.getElementById('sendImage').addEventListener('change',function(){
            if(this.files.length !=0){
                var file = this.files[0],
                reader = new FileReader();
            
                if(!reader) {
                    that._displayNewMsg('system', 'your browser doesn\'t support our FileReader' ,'red');
                    this.value = '';
                    return;
                };

                reader.onload = function(e) {
                    
                    this.value = '';
                    that.socket.emit('img', e.target.result);
                    that._displayImage('me', e.target.result);
                };

                reader.readAsDataURL(file);
            }
        },false);



        this._initialEmoji();
        document.getElementById('emoji').addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            emojiwrapper.style.display = 'block';
            e.stopPropagation();
        }, false);
        document.body.addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            if (e.target != emojiwrapper) {
                emojiwrapper.style.display = 'none';
            };
        });
        document.getElementById('emojiWrapper').addEventListener('click', function(e) {
            var target = e.target;
            if (target.nodeName.toLowerCase() == 'img') {
                var messageInput = document.getElementById('messageInput');
                messageInput.focus();
                messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
            };
        }, false);
    },
    _initialEmoji: function() {
        var emojiContainer = document.getElementById('emojiWrapper'),
            docFragment = document.createDocumentFragment();
        for (var i = 69; i > 0; i--) {
            var emojiItem = document.createElement('img');
            emojiItem.src = '../content/emoji/' + i + '.gif';
            emojiItem.title = i;
            docFragment.appendChild(emojiItem);
        };
        emojiContainer.appendChild(docFragment);
    },
    _displayNewMsg: function(user, msg, color) {
        var container = document.getElementById('historyMsg'),
        msgToDisplay = document.createElement('p'),
        date = new Date().toTimeString().substr(0, 8),
        //determine whether the msg contains emoji
        msg = this._showEmoji(msg);
    msgToDisplay.style.color = color || '#000';
    msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg;
    container.appendChild(msgToDisplay);
    container.scrollTop = container.scrollHeight;
    firstTimeTyping = false;
    },

    
    _displayImage: function(user, imgData, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _showEmoji: function(msg) {
        var match, result = msg,
            reg = /\[emoji:\d+\]/g,
            emojiIndex,
            totalEmojiNum = document.getElementById('emojiWrapper').children.length;
        while (match = reg.exec(msg)) {
            emojiIndex = match[0].slice(7, -1);
            if (emojiIndex > totalEmojiNum) {
                result = result.replace(match[0], '[X]');
            } else {
                result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />');//todo:fix this in chrome it will cause a new request for the image
            };
        };
        return result;
    }

}

