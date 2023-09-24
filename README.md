# redirect-stdio

Utilities for redirecting node process stdout and stderr.

## Motivation

Imagine you have a node app that logs to stdout and a bash script that
runs your node process like this:

```
node myapp.js >> access.log
```

Later, you want to add logrotate, which moves `access.log` to
`access.log.2` and then calls `SIGUSR2` on your node process. But your
node process is logging to stdout, and can't exactly "reopen"
`process.stdout`.

With `redirect-stio`, you can:
* use `pathFromFd` to find where your process's stdout is actually going
* on `SIGUSR2`, re-open the log path you just found, and write that file
descriptor over the old one to rotate logs

## Usage

```javascript
const { reopenStdout, reopenStderr } = require('redirect-stdio');

process.on('SIGUSR2', function() {
  reopenStdout();
  reopenStderr();
});
```

## License

Copyright 2023 Movable, Inc. See LICENSE.md.
