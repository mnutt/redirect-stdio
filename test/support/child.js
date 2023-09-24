const {
  redirectStdout,
  redirectStderr,
  reopenStdout,
  reopenStderr,
} = require("../../index");

process.title = "redirect-stdio-child";

function redirect({ type, path }) {
  if (type === "stdout") {
    redirectStdout(path);
  } else if (type === "stderr") {
    redirectStderr(path);
  } else {
    throw new Error(`Unknown stream type: ${type}`);
  }
}

function reopen({ type }) {
  if (type === "stdout") {
    reopenStdout();
  } else if (type === "stderr") {
    reopenStderr();
  } else {
    throw new Error(`Unknown stream type: ${type}`);
  }
}

process.on("message", (message) => {
  if (message.log) {
    console.log(message.log);
  } else if (message.err) {
    console.error(message.err);
  } else if (message.redirect) {
    redirect(message.redirect);
  } else if (message.reopen) {
    reopen(message.reopen);
  }

  process.send({ success: true });
});

process.on('uncaughtException', (err) => {
  process.send({ error: err.message });
})
