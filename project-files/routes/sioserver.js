const fs = require('fs');

var socket = require('socket.io')

var io = socket();

const testFolder = 'C:/projects/docsmeet/project-files/reports/';



io.on('connection',function(socket){
  console.log("made socket conn");

  fs.readdir(testFolder, (err, files) => {
   
      console.log(files);
      io.emit('files',files);
  });
  

  socket.on('chat',function(data){
      io.sockets.emit('chat',data);
      let chatsm = data.handle+":"+data.message+"\n";
      fs.appendFile('C:/projects/docsmeet/project-files/chats/chatMeet.txt', chatsm, (err) => {

          if (err) throw err;
      })
  });

  socket.on('join-room', (roomId, userId) => {
    console.log("user join room", roomId, userId)
    socket.join(roomId)
    socket.broadcast.to(roomId).emit('user-connected', userId)

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId)
    })
  });

})

module.exports = io;