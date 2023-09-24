const assert = require("assert");
const fs = require("fs");
const { makeChild, sendMessage } = require("./support");

describe("redirect-stdio", function () {
  beforeEach(() => {
    const files = fs.readdirSync("tmp");

    for (const file of files) {
      if (file.endsWith(".log") || file.endsWith(".err")) {
        fs.unlinkSync(`tmp/${file}`);
      }
    }
  });

  describe("#redirectStdout()", async function () {
    it("redirects stdout to a new location", async function () {
      let child;
      try {
        child = makeChild();

        await sendMessage(child, { log: "Hello, world!" });
        assert.strictEqual(
          fs.readFileSync("tmp/original.log", "utf8"),
          "Hello, world!\n"
        );

        await sendMessage(child, {
          redirect: { type: "stdout", path: "tmp/redirected.log" },
        });
        await sendMessage(child, { log: "Another message" });

        assert.strictEqual(
          fs.readFileSync("tmp/original.log", "utf8"),
          "Hello, world!\n"
        );
        assert.strictEqual(
          fs.readFileSync("tmp/redirected.log", "utf8"),
          "Another message\n"
        );
      } finally {
        child.kill();
      }
    });

    it("continues appending when file was not moved", async function () {
      let child;

      try {
        child = makeChild();

        await sendMessage(child, { log: "Hello, world!" });
        assert.strictEqual(
          fs.readFileSync("tmp/original.log", "utf8"),
          "Hello, world!\n"
        );

        await sendMessage(child, {
          redirect: { type: "stdout", path: "tmp/original.log" },
        });
        await sendMessage(child, { log: "Another message" });

        assert.strictEqual(
          fs.readFileSync("tmp/original.log", "utf8"),
          "Hello, world!\nAnother message\n"
        );
      } finally {
        child.kill();
      }
    });
  });

  describe("#redirectStderr()", async function () {
    it("redirects stderr to a new location", async function () {
      let child;
      try {
        child = makeChild();

        await sendMessage(child, { err: "an error occurred" });
        assert.strictEqual(
          fs.readFileSync("tmp/original.err", "utf8"),
          "an error occurred\n"
        );

        await sendMessage(child, {
          redirect: { type: "stderr", path: "tmp/redirected.err" },
        });
        await sendMessage(child, { err: "another error" });

        assert.strictEqual(
          fs.readFileSync("tmp/original.err", "utf8"),
          "an error occurred\n"
        );
        assert.strictEqual(
          fs.readFileSync("tmp/redirected.err", "utf8"),
          "another error\n"
        );
      } finally {
        child.kill();
      }
    });
  });

  describe("#reopenStdout()", async function () {
    it("reopens stdout to its original location", async function () {
      let child;
      try {
        child = makeChild();

        await sendMessage(child, { log: "Hello, world!" });
        assert.strictEqual(
          fs.readFileSync("tmp/original.log", "utf8"),
          "Hello, world!\n"
        );

        fs.renameSync("tmp/original.log", "tmp/moved.log");

        await sendMessage(child, {
          reopen: { type: "stdout" },
        });
        await sendMessage(child, { log: "Another message" });

        assert.strictEqual(
          fs.readFileSync("tmp/moved.log", "utf8"),
          "Hello, world!\n"
        );
        assert.strictEqual(
          fs.readFileSync("tmp/original.log", "utf8"),
          "Another message\n"
        );
      } finally {
        child.kill();
      }
    });

    it("does not leak file descriptors", async function () {
      let child;
      try {
        child = makeChild();

        for (let i = 0; i < 10000; i++) {
          await sendMessage(child, { log: "Hello, world!" });
          await sendMessage(child, { reopen: { type: "stdout" } });
        }

        assert.strictEqual(
          fs.readFileSync("tmp/original.log", "utf8").length,
          "Hello, world!\n".length * 10000
        );
      } finally {
        child.kill();
      }
    }).timeout(10000);
  });

  describe("#reopenStderr()", async function () {
    it("reopens stderr to its original location", async function () {
      let child;
      try {
        child = makeChild();

        await sendMessage(child, { err: "an error occurred" });
        assert.strictEqual(
          fs.readFileSync("tmp/original.err", "utf8"),
          "an error occurred\n"
        );

        fs.renameSync("tmp/original.err", "tmp/moved.err");

        await sendMessage(child, {
          reopen: { type: "stderr" },
        });
        await sendMessage(child, { err: "another error" });

        assert.strictEqual(
          fs.readFileSync("tmp/moved.err", "utf8"),
          "an error occurred\n"
        );
        assert.strictEqual(
          fs.readFileSync("tmp/original.err", "utf8"),
          "another error\n"
        );
      } finally {
        child.kill();
      }
    });
  });
});
