const addon = require('./build/Release/addon');

// Store stdout/stderr paths from when we started
let stdoutPath = addon.pathFromFd(process.stdout.fd);
let stderrPath = addon.pathFromFd(process.stderr.fd);

/**
 * Redirects the specified file descriptor to the specified target path.
 * @param {number} fd - The file descriptor to redirect.
 * @param {string} targetPath - The target path to redirect to.
 * @returns {Promise<void>} - A Promise that resolves when the redirection is complete.
 */
exports.redirectFd = async function redirectFd(fd, targetPath) {
  return addon.redirectFd(fd, targetPath);
}

/**
 * Redirect stderr to the specified path.
 * @param {string} path - The path to redirect stderr to.
 * @returns {Promise<void>} - A Promise that resolves when the redirection is complete.
 */
exports.redirectStderr = function redirectStderr(path) {
  stderrPath = path;
  return exports.reopenStderr();
}

/**
 * Redirect stdout to the specified path.
 * @param {string} path - The path to redirect stdout to.
 * @returns {Promise<void>} - A Promise that resolves when the redirection is complete.
 */
exports.redirectStdout = function redirectStdout(path) {
  stdoutPath = path;
  return exports.reopenStdout();
}

/**
 * Reopen stderr with the current stderr path.
 * @returns {Promise<void>} - A Promise that resolves when the reopening is complete.
 */
exports.reopenStderr = function reopenStderr() {
  return exports.redirectFd(process.stderr.fd, stderrPath);
}

/**
 * Reopen stdout with the current stdout path.
 * @returns {Promise<void>} - A Promise that resolves when the reopening is complete.
 */
exports.reopenStdout = function reopenStdout() {
  return exports.redirectFd(process.stdout.fd, stdoutPath);
}

/**
 * Get the path for the specified file descriptor.
 * @param {number} fd - The file descriptor to get the path for.
 * @returns {string} - The path for the specified file descriptor.
 */
exports.pathFromFd = function pathFromFd(fd) {
  return addon.pathFromFd(fd);
}
