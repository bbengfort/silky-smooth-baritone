/**
 * Silky Smooth Baritone Chat Client v0.0.3
 * https://github.com/bbengfort/silky-smooth-baritone/
 *
 * Copyright 2013 Benjamin Bengfort
 * Released under an Apache License
 *
 * Dependencies: 
 *     1. Klaus Hartl's jquery.cookie.js
 *     2. socket.io browser Javascript
 */

$(function() {

    // Configuration
    $.cookie.json = true;

    // Global Variables.
    var socket   = io.connect();
    var msgInput = $('#msgInput');
    var chatForm = $('#chatForm');
    var messageList = $('#messages');
    var userList    = $('#users');
    var userState   = $.cookie('ssbc_user_state');

    // Socket Handlers
    socket.on('connect', function() {

        function getNickname() {

            function promptForName() {
                nickname = prompt('Enter a chat name:');
                if (!nickname) {
                    nickname = promptForName();
                }
                return nickname;
            }

            // Attempt to fetch the nickname from a cookie
            if (userState && userState.nickname) {
                return userState.nickname;
            } else {
                // Prompt for name, set cookie and return.
                nickname = promptForName();
                $.cookie('ssbc_user_state', {nickname:nickname}, {expires:1, path:'/'});
                return nickname;
            }   
        }

        // Send a join event with your name.
        socket.emit('join', getNickname());

        // Show the chat
        $('.hideblock').fadeOut('slow');

        // Finally, set chat bar to focus:
        msgInput.focus();
    });

    socket.on('announcement', function(msg) {
        addMessage(msg, 'announcement');
    });

    socket.on('text', addChat);
    socket.on('user_connected', addUser);

    socket.on('user_disconnected', function(data) {
        $('#' + data.nickname).remove();
        $('#user_count').text(data.count);
    });

    // Utility Functions
    function addMessage(messageHtml, messageClass) {
        messageClass = messageClass || 'chat-message';
        var li = $('<li></li>');
        li.addClass(messageClass);
        messageHtml = linkSearcher(messageHtml);
        li.html(messageHtml);
        messageList.append(li);

        // Ensure that autoscrolling is ocurring
        messageList.scrollTop(messageList[0].scrollHeight);
    }

    function addChat(data) {
        var msg = "<strong>" + data.nickname + '</strong>: ' + data.message;
        addMessage(msg);
    }

    function addUser(data) {
        var li = $('<li></li>');
        li.addClass('user');
        li.attr('id', data.nickname);
        li.html('<i class="icon-user"></i> '+ data.nickname);
        userList.append(li);
        $('#user_count').text(data.count);
    }

    function escape_tags(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function linkSearcher (str) {
        var urlre = new RegExp('(https?://([-\\w]+\\.)?[-\\w]+\\.[\\w\\.]{2,5}([-/\\w=\\+\\%\\.\\?&;:#,\'\"]+)?)', "gi");
        str = str.replace(urlre, '<a href="$1">$1</a>');
        console.log(str);
        return str;
    }

    // Event Handlers
    chatForm.submit(function(event) {
        event.preventDefault();
        var msg = escape_tags(msgInput.val());
        addChat({nickname:'me', message: msg});
        socket.emit('text', msg);

        msgInput.val('');
        msgInput.focus();
        return false;
    });

});