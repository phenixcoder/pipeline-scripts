#!/usr/bin/env node

import { GenerateArgs } from '../../types';

import chalk from 'chalk';
import shell from 'shelljs';
import { exit } from 'process';
import Log from '../../lib/logger';
import DeployRC from '../../lib/deployrc';
import GenerateVersion from '../../lib/generate-version';

async function Version(args: GenerateArgs): Promise<void> {
  try {
    // Usage Example : pipeline generate-version --environment production
    if (args.debug) {
      Log(args);
    }
    const environment = args.e || 'production';
    const deployrc = DeployRC();

    if (!deployrc.environments[environment]) {
      Log(chalk.redBright('🚫 Cannot continue. Invalid environment passed.'));
      Log(
        `Valid environments:\n${Object.keys(deployrc.environments)
          .map((env) => chalk.yellow(' - ') + env)
          .join('\n')}`,
      );
      exit(1);
    }

    // fetch site info from terraform cloud
    Log(chalk.yellowBright('\nFetch site information'));
    Log(
      chalk.gray(`
  Terraform workspace Id: ${deployrc.environments[environment]}
  Environment: ${environment}

  Executing:
    tfc output get --workspace ${deployrc.environments[environment]}
  `),
    );
    const { stdout, stderr, code } = shell.exec(
      `tfc output get --workspace ${deployrc.environments[environment]}`,
      { silent: true },
    );
    let Output;
    try {
      if (code !== 0) {
        throw `Error fetching Site information (${code})`;
      }
      Output = JSON.parse(stdout);
    } catch (error) {
      console.log(
        chalk.redBright('Error: Could not get Output of Infrastructure.'),
      );
      console.log(error);
      console.log(stderr);
      exit(1);
    }

    console.log(JSON.stringify(GenerateVersion(Output), null, '  '));
  } catch (error) {
    console.log(chalk.redBright(`Error: ${error}`));
    if (error instanceof Error && 'stack' in error && args.dryRun) {
      console.log(chalk.gray(error.stack));
    }
    exit(1);
  }
}

export default Version;
