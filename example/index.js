const { reopenStderr, reopenStdout } = require('./index');

process.title = "fd-test";

process.on('SIGUSR2', function() {
  reopenStdout();
  reopenStderr();
});

let x = 0;

setInterval(() => console.log(x += 1), 1000);
