#!/usr/bin/env node

import chalk from 'chalk';
import fs from 'fs';
import { exit } from 'process';
import shell from 'shelljs';
import PackageJSON from '../../lib/package-json';
import { PackageArgs as Args } from '../../types';

function SERVICE(args: Args): void {
  const BUILD_ENV = args.env || 'production';
  const currentProject = PackageJSON();

  console.log(chalk.white(`📦 Packaging Service ${currentProject.name}`));
  console.log(chalk.yellow('Environment: '), BUILD_ENV);

  // # Cleanup
  console.log(chalk.green('🧹 Cleaning up'));
  ['build'].forEach((dir) => {
    if (fs.existsSync(dir)) {
      console.log(chalk.blackBright(`Removing ${dir}`));
      shell.rm('-rf', dir);
    }
  });

  console.log(chalk.green('🏗  Generating Build'));
  const x = shell.exec('npm run package');

  if (x.code === 0) {
    console.log(chalk.blackBright('Build Created. Ready to publish to NPM.'));
  } else {
    console.log(chalk.red('Build Failure'));
    exit(x.code);
  }

  return;
}

export default SERVICE;
