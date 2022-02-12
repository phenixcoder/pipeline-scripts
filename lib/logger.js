function Log(...rest) {
  if (process.DEBUG) {
    console.log(...rest);
  }
}

module.exports = Log;