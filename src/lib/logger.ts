function Log(...rest: unknown[]): void {
  if (process.env.DEBUG) {
    console.log(...rest);
  }
}

export default Log;
