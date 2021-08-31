const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

function PackageJSON(filepath) {
  const PackageJSONPath = filepath
    ? filepath
    : path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(PackageJSONPath)) {
    throw 'cannot find package.json';
  }

  try {
    return JSON.parse(fs.readFileSync(PackageJSONPath, { encoding: 'utf-8' }));
  } catch (error) {
    console.log(chalk.red(error));
    throw error;
  }
}

module.exports = PackageJSON;
