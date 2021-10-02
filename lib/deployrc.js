const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

function DeployRC(filepath) {
  const DeployRCPath = filepath
    ? filepath
    : path.join(process.cwd(), '.deployrc');

  if (!fs.existsSync(DeployRCPath)) {
    throw 'cannot find .deployrc';
  }

  try {
    return JSON.parse(fs.readFileSync(DeployRCPath, { encoding: 'utf-8' }));
  } catch (error) {
    console.log(chalk.red(error));
    throw error;
  }
}

module.exports = DeployRC;
