const http = require('http');
const app = require('./app');
let port = 4000

if(process.env.NODE_PORT){
    port=process.env.NODE_PORT
}

const server = http.createServer(app);

server.listen(port,() => console.log('Server started on port ' + port) );


