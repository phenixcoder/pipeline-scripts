#!/usr/bin/env node

import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import WEB from './package/web';
import DEPLOY_WEB from './deploy/web';
import LIB from './package/lib';
import SERVICE from './package/service';
import Version from './generate/version';
import PackageJSON from '../lib/package-json';
import yargs from 'yargs';
import { DeployArgs, GenerateArgs, PackageArgs } from '../types';

const currentProject = PackageJSON();

function PrintHeader() {
  console.log(
    `${chalk.white(currentProject.name.toLocaleUpperCase())} ${chalk.blackBright(currentProject.version)} `,
  );
  console.log(chalk.white(currentProject.description));
}

function deployCommandConfig(yargs: yargs.Argv): yargs.Argv {
  return yargs
    .option('e', {
      alias: 'environment',
      default: 'production',
      describe: 'Deployment environment',
    })
    .option('r', {
      alias: 'release',
      demandOption: true,
      type: 'string',
      describe: 'Release version. \nE.g.: 1.1.0',
    })
    .option('debug', {
      describe: 'Enable debugging',
      type: 'boolean',
    })
    .option('dry-run', {
      describe: 'Dry run deploy script. No write actions are performed.',
      type: 'boolean',
    });
}

function deployCommandHandler(argv: DeployArgs): void {
  PrintHeader();
  switch (argv.type) {
    case 'lib':
      // LIB(argv);
      break;
    case 'web':
      console.log(
        `Deploying ${chalk.yellow('Website')}\n${chalk.white(argv.release)} to ${chalk.white(argv.environment)}`,
      );
      DEPLOY_WEB(argv);
      break;
    case 'service':
      // SERVICE(argv);
      break;

    default:
      console.log(chalk.red(`Invalid package type "${argv.type}"`));
      break;
  }
  // console.log('Deploy', argv.type, 'type');
}

function CLI() {
  return (
    yargs(hideBin(process.argv))
      // .name('Pipeline Scripts CLI')
      .version(currentProject.version)
      .usage('Usage: pipeline <command> [options]')
      .epilogue(
        `
===========================================
${chalk.greenBright('Pipeline Scripts CLI')}

CLI for automation script for package, deploy and generate version.json. for various project types.

Version: ${currentProject.version}
===========================================
    `,
      )
      .command<PackageArgs>(
        ['package <type>'],
        'Package command to test, build and package an artifact.',
        (yargs) => {
          return yargs
            .option('h', {
              alias: 'host',
              type: 'string',
              describe: 'Base domain for this build.',
              requiresArg: true,
            })
            .option('p', {
              alias: 'package-path',
              type: 'string',
              describe: 'Build directory relative to current directory.',
              requiresArg: true,
            })
            .option('debug', {
              describe: 'Enable debugging',
              type: 'boolean',
            });
        },
        (argv: PackageArgs) => {
          PrintHeader();
          switch (argv.type) {
            case 'lib':
              console.log(`Packaging ${chalk.yellow('Library')}`);
              LIB(argv);
              break;
            case 'web':
              console.log(`Packaging ${chalk.yellow('Website')}`);
              WEB(argv);
              break;
            case 'service':
              console.log(`Packaging ${chalk.yellow('Service')}`);
              SERVICE(argv);
              break;

            default:
              console.log(chalk.red(`Invalid package type "${argv.type}"`));
              break;
          }
        },
      )
      .command<DeployArgs>(
        ['deploy <type>'],
        'Deploy a release to an environment',
        deployCommandConfig,
        deployCommandHandler,
      )
      .command(
        ['generate-config'],
        'Generates version.json for passed environment',
        (yargs) => {
          return yargs
            .option('e', {
              alias: 'environment',
              default: 'production',
              describe: 'Deployment environment',
            })
            .option('debug', {
              describe: 'Enable debugging',
            });
        },
        (argv) => {
          PrintHeader();
          Version(argv as GenerateArgs);
        },
      )
      .command(
        ['init-repo <type>'],
        'Intialise pipeline of app type',
        {},
        (argv) => {
          console.log('init-repo', argv.type, 'type');
        },
      )
      .demandCommand().argv
  );
}

CLI();
