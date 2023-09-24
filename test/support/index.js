const { fork } = require("child_process");
const fs = require("fs");

exports.makeChild = function makeChild() {
  const originalStdout = fs.openSync("tmp/original.log", "a");
  const originalStderr = fs.openSync("tmp/original.err", "a");

  const child = fork("test/support/child.js", [], {
    stdio: [0, originalStdout, originalStderr, "ipc"],
  });

  child.on("message", (message) => {
    if (message.error) {
      throw new Error(message.error);
    }
  });

  child.on("exit", (code, signal) => {
    if (signal !== "SIGTERM") {
      console.error(`Child exited with code ${code} and signal ${signal}`);
    }

    fs.closeSync(originalStdout);
    fs.closeSync(originalStderr);
  });

  return child;
};

exports.sendMessage = function sendMessage(child, message) {
  return new Promise((resolve, reject) => {
    child.once('message', (response) => {
      if (response.error) {
        reject(new Error(response.error));
      } else if (response.success) {
        resolve(response.success);
      }
    });

    child.send(message);
  });
};
