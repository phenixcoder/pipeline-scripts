#!/usr/bin/env node

import semanticRelease, { BranchSpec, PluginSpec } from 'semantic-release';

import chalk from 'chalk';
import fs from 'fs';
import shell from 'shelljs';
import path from 'path';
import PackageJSON from '../../lib/package-json';
import { PackageArgs as Args, IPackageJSON } from '../../types';

const { exit } = process;

function checkDependencyExists(
  dependency: string,
  config: IPackageJSON,
): boolean {
  return (
    !!config.dependencies[dependency] || !!config.devDependencies[dependency]
  );
}

function getCleanupList(style: string): string[] {
  switch (style) {
    case 'gatsby':
      return ['public', '.cache'];
    case 'cra':
      return ['build'];
    case 'vite':
      return ['dist'];
    default:
      return [];
  }
}

function WEB(args: Args): void {
  const currentProject = PackageJSON();
  const PACKAGE_PATH =
    args.packagePath || checkDependencyExists('vite', currentProject)
      ? 'dist'
      : 'build';
  const BUILD_ENV = args.env || 'production';
  const WEB_PROJECT_STYLES = {
    gatsby: 'Gatsby Js',
    cra: 'Create React App',
    vite: 'Vite',
    unknown: 'Unknown',
  };
  // const deployrc = DeployRC();
  console.log(
    chalk.white(`📦 Packaging WebApp ${currentProject.name} into`),
    `./${PACKAGE_PATH}`,
  );
  console.log(chalk.yellow('Environment: '), BUILD_ENV);

  const PROJECT_STYLE = checkDependencyExists('gatsby', currentProject)
    ? 'gatsby'
    : checkDependencyExists('react-scripts', currentProject)
      ? 'cra'
      : checkDependencyExists('vite', currentProject)
        ? 'vite'
        : 'unknown';
  console.log(
    `Current Project Style: ${chalk.green(WEB_PROJECT_STYLES[PROJECT_STYLE])}`,
  );

  if (PROJECT_STYLE !== 'gatsby' && PROJECT_STYLE !== 'vite') {
    console.log(
      chalk.redBright(
        '🚫 Cannot continue. Only Gatsby and Vite Projects are supported.',
      ),
    );
    exit(1);
  }

  // # Cleanup
  console.log(chalk.green('🧹 Cleaning up'));

  const cleanupList = getCleanupList(PROJECT_STYLE);
  cleanupList.push('build.zip');
  cleanupList.push(PACKAGE_PATH);

  cleanupList.forEach((dir) => {
    if (fs.existsSync(dir)) {
      console.log(chalk.blackBright(`Removing ${dir}`));
      shell.rm('-rf', dir);
    }
  });

  console.log(chalk.green('🏗  Generating Build'));
  const buildResponse = shell.exec('npm run build');

  if (buildResponse.code !== 0) {
    console.log(chalk.red('🚫 Build failed. Exiting.'));
    console.debug(buildResponse);
    exit(1);
  }

  console.log(chalk.green('🎁  Packaging artifact'));

  console.debug('Current Project:', PACKAGE_PATH);

  if (PROJECT_STYLE === 'gatsby') {
    shell.mv('public', PACKAGE_PATH);
  }

  // zip -r build.zip ./build/*
  const PWD = shell.pwd().toString();
  console.debug('PWD:', PWD);
  shell.cd(path.join(PWD, PACKAGE_PATH));
  const ArtifactPath = path.resolve('../build.zip');
  console.log(`zip -r ${ArtifactPath} ./*`);
  // shell.exec(`zip -r ${ArtifactPath} ./*`);
  shell.cd(PWD);
  console.log(
    chalk.blackBright('Artifact created at'),
    chalk.white(ArtifactPath),
  );

  // Releasing a version and publishing artifact to Github releases (Artifactory)
  console.log(chalk.green('\n📢 Publishing a release artifact'));

  // Get current branch
  const currentBranch = shell.exec('git branch --show-current').stdout.trim();
  console.log(chalk.blackBright('Current branch:'), chalk.white(currentBranch));
  const branches: BranchSpec[] = ['main'];

  // check if debug param is passed
  const isDebug = args.debug || false;
  if (isDebug) {
    console.log(chalk.yellow('🐞 Debug mode enabled'));
    if (currentBranch != 'main') {
      branches.push({
        name: currentBranch,
        prerelease: true,
      });
    }
    console.log(chalk.blackBright('Running on branches:'));
    console.log(branches);

    console.log(chalk.yellow('🚧 Github Token'));
    console.log(
      chalk.blackBright('GH_TOKEN:'),
      chalk.white(process.env.GH_TOKEN),
    );
    console.log(
      chalk.blackBright('GITHUB_TOKEN:'),
      chalk.white(process.env.GITHUB_TOKEN),
    );
  }

  if (!branches.includes(currentBranch)) {
    console.log(chalk.red('🚫 Invalid branch. Only main branch is supported.'));
    exit(1);
  }
  console.log(chalk.green('🚀 Releasing version'));

  console.log(chalk.blackBright('Running Allowed Branches:'));
  branches.forEach((branch) => {
    console.log(
      '- ',
      chalk.white(branch),
      branch === currentBranch ? chalk.green('(Current)') : '',
    );
  });

  // Checkl if exec commands exists in scripts/pipeline folder in currecnt project
  const pipelinePath = path.join(process.cwd(), 'scripts/pipeline');

  const execConfig: PluginSpec = ['@semantic-release/exec', {}];
  const plugins: PluginSpec[] = [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/github',
      {
        assets: [
          {
            path: 'build.zip',
            label: 'Build Package',
          },
          {
            path: 'RELEASE_NOTES.md',
            label: 'Release Notes',
          },
        ],
      },
    ],
  ];

  if (fs.existsSync(pipelinePath)) {
    const pipelineCommands = [
      'verifyConditionsCmd',
      'analyzeCommitsCmd',
      'verifyReleaseCmd',
      'generateNotesCmd',
      'prepareCmd',
      'addChannelCmd',
      'publishCmd',
      'successCmd',
      'failCmd',
    ];
    const options: Record<string, string> = {};
    pipelineCommands.forEach((cmd) => {
      const cmdPathJS = path.join(pipelinePath, `${cmd}.js`);
      const cmdPathShell = path.join(pipelinePath, `${cmd}.sh`);
      if (fs.existsSync(cmdPathJS) || fs.existsSync(cmdPathShell)) {
        const cmdPath = fs.existsSync(cmdPathJS) ? cmdPathJS : cmdPathShell;
        console.log(
          chalk.blackBright(
            `Adding ${cmd} command from ${chalk.whiteBright(cmdPath)}`,
          ),
        );
        const suffix = '${nextRelease.version}';

        options[cmd] = fs.existsSync(cmdPathJS)
          ? `node ${cmdPath} ${suffix}`
          : `${cmdPath} ${suffix}`;
      }
    });

    execConfig[1] = options;
    plugins.push(execConfig);
  }

  if (isDebug) {
    console.log(chalk.yellow('🐞 Debug mode enabled'));
    console.log(chalk.blackBright('Running with plugins:'));
    console.log(plugins);
  }

  semanticRelease({
    branches: branches,
    ci: false,
    dryRun: isDebug,
    plugins,
  });
  return;
}

export default WEB;
