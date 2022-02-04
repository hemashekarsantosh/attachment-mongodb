const http = require('http');
const app = require('./app');

const port = process.env.OPENSHIFT_NODEJS_PORT || 4000;

const server = http.createServer(app);

server.listen(port,() => console.log('Server started on port ' + port) );
console.log('Open Shift Node JS PORT '+process.env.OPENSHIFT_NODEJS_PORT);
console.log('NODE PORT'+process.env.NODE_PORT);
