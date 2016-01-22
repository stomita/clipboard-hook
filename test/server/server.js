import path from 'path';
import express from 'express';
import browserify from 'browserify-middleware';
import babelify from 'babelify';

const app = express();

app.use('/scripts', browserify(path.join(__dirname, 'scripts'), {
  transform: [
    babelify.configure({ presets: ["es2015"] })
  ],
  debug: true
}));
app.use(express.static(path.join(__dirname, 'public')));

let server;

function listen(callback) {
  server = app.listen(process.env.PORT || 9000, (err) => {
    console.log('Test server started up, listening on port ' + server.address().port);
    if (callback) { callback(err); }
  });
}

function close() {
  if (server) {
    server.close();
    server = null;
  }
}

export default { listen, close };

if (require.main === module) {
  listen();
}
