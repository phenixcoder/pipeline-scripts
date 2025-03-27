#!/usr/bin/env node

import chalk from 'chalk';
import shell from 'shelljs';
import fs from 'fs';
import axios from 'axios';
import AWS from 'aws-sdk';
const { exit } = process;
import GenerateVersion from '../../lib/generate-version';
const CLOUD_FRONT = new AWS.CloudFront();

import requestP from 'request-promise-native';
import DeployRC from '../../lib/deployrc';

import Github from '../../lib/github';
import PackageJSON from '../../lib/package-json';
import sync from '../../lib/s3-sync';
import { DeployArgs as Args } from '../../types';
import Log from '../../lib/logger';
import { URL } from 'url';
import { resolve } from 'path';

interface Output {
  environment: string;
  services: unknown[];
  websites: {
    name: string;
    cloudfront_distribution_id: string;
    domain: string;
    s3_bucket: string;
    s3_bucket_domain: string;
  }[];
}

function getRepoUrlFromGitConfig() {
  const remoteUrl = shell.exec('git config --get remote.origin.url', {
    silent: true,
  }).stdout;
  // validate remote url and format validation
  if (!remoteUrl) {
    throw new Error('Invalid remote url');
  }
  // validate remoteUrl is a valid url format
  try {
    new URL(remoteUrl);
  } catch (error) {
    if (error instanceof Error) {
      console.log(chalk.redBright('Error: Invalid remote url'));
      console.log(chalk.redBright(error.message));
      console.log(chalk.redBright('Remote url:'), remoteUrl);
    }
    throw new Error('Invalid remote url');
  }
  return remoteUrl;
}

async function WEB(args: Args): Promise<void> {
  try {
    // Usage Example : pipeline deploy web --release 1.1.0 --environment production
    if (args.debug) {
      Log(args);
    }
    const env = args.e || 'production';
    let release = args.r || '';
    const match = release.match(/(\d+\.\d+\.\d+)/);
    if (match) {
      release = match[0];
    } else {
      throw new Error('Invalid release format');
    }

    // check if release is passed
    if (release && /[0-9]+\.[0-9]+\.[0-9]+/.test(release)) {
      // check if release is a version
    } else {
      console.log(
        chalk.redBright('🚫 Cannot continue. Invalid release passed.'),
      );
      exit(1);
    }

    const packageJSON = PackageJSON();
    const deployrc = DeployRC();
    if (!deployrc.environments[env]) {
      console.log(
        chalk.redBright('🚫 Cannot continue. Invalid environment passed.'),
      );
      console.log(
        `Valid environments:\n${Object.keys(deployrc.environments)
          .map((env) => chalk.yellow(' - ') + env)
          .join('\n')}`,
      );
      exit(1);
    }

    let releasePackageUrl = packageJSON.repository?.url
      ? packageJSON.repository.url
      : getRepoUrlFromGitConfig();

    releasePackageUrl = releasePackageUrl
      .replace('.git', '')
      .replace('https://github.com/', '');

    console.log('Release Package URL:', releasePackageUrl);

    let [owner, repo] = releasePackageUrl.split('/');
    const octokit = Github();

    owner = owner.trim();
    repo = repo.trim();

    console.log(chalk.yellowBright('\nFetch Build Artifact'));
    console.log(
      chalk.blackBright(`
  Owner: ${chalk.white(owner)}
  Repo: ${chalk.white(repo)}
  Release: v${chalk.white(release)}
  `),
    );

    let response;
    try {
      response = await octokit.request(
        'GET /repos/{owner}/{repo}/releases/tags/{tag}',
        {
          owner,
          repo,
          tag: `v${release}`,
        },
      );
    } catch (error) {
      if (error instanceof Error && 'status' in error && error.status === 404) {
        console.log(chalk.red('Release not found.'), error);

        throw `Invalid GITHUB_TOKEN or no release found with tag ${release} found on ${owner}/${repo}.`;
      } else {
        console.log(error);
      }
    }

    if (response && response.data.assets[0]) {
      console.log(`
  ${chalk.green('Release Found.')}
  ${chalk.blackBright('Downloading release artifact.')}
  ${chalk.blackBright(`github.com/repos/${owner}/${repo}/releases/assets/${response.data.assets[0].id}`)}
    `);
    } else {
      console.log(chalk.red('Release not found.'));
      exit(1);
    }

    const tempPath = resolve(process.cwd(), `./build-v${release}.zip`);
    try {
      if (response && response.data.assets[0]) {
        response = await requestP.get({
          url: `https://${process.env.GITHUB_TOKEN}:@api.github.com/repos/${owner}/${repo}/releases/assets/${response.data.assets[0].id}`,
          headers: {
            Accept: 'application/octet-stream',
            'User-Agent': 'pipeline-helpers',
          },
          encoding: null, // secret scauce :D
        });
      } else {
        throw new Error('Response is undefined or no assets found.');
      }
    } catch (reason) {
      console.log(chalk.red('Error Downloading Artifact'));
      console.log(reason);
      exit(1);
    }

    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    fs.writeFileSync(tempPath, response);

    // extract to build
    if (fs.existsSync('build')) {
      shell.rm('-rf', ['build']);
    }
    shell.mkdir('build');
    shell.exec(`unzip build-v${release}.zip -d build`, { silent: true });

    // fetch site info from terraform cloud
    console.log(chalk.yellowBright('\nFetch site information'));
    console.log(
      chalk.blackBright(`
  Terraform workspace Id: ${deployrc.environments[env]}
  Environment: ${env}

  Executing:
    tfc output get --workspace ${deployrc.environments[env]}
  `),
    );
    const outputString = shell.exec(
      `tfc output get --workspace ${deployrc.environments[env]}`,
      { silent: true },
    ).stdout;
    let Output: Output;
    try {
      Output = JSON.parse(outputString);
    } catch (reason) {
      console.log(
        chalk.redBright('Error: Could not get Output of Infrastructure.'),
      );
      console.log(reason);
      console.log(outputString);

      throw `Invalid TFC_TOKEN or incorrect workspace named ${deployrc.environments[env]}.`;
    }

    const TargetWebsite = Output.websites.find(
      ({ name }) => name === deployrc.name,
    );
    if (!TargetWebsite) {
      console.log(
        chalk.redBright('Error: Website not available in Infrastructure.'),
      );
      console.log(chalk.green('Expected'), deployrc.name);
      console.log(
        chalk.green('Available websites in Infrastructure:\n'),
        Output.websites
          .map(({ name }) => chalk.yellow(` * ${name}`))
          .join('\n'),
      );
      exit(1);
    } else {
      console.log(
        chalk.blackBright(`
  ${chalk.green('Website found.')}

    Name: ${chalk.white(TargetWebsite.name)}
    Cloudfront Distribution Id: ${chalk.white(TargetWebsite.cloudfront_distribution_id)}
    Domain: ${chalk.white(TargetWebsite.domain)}
    S3 Bucket: ${chalk.white(TargetWebsite.s3_bucket)} 
    S3 Bucket Domain: ${chalk.white(TargetWebsite.s3_bucket_domain)}`),
      );

      GenerateVersion(
        { ...Output, environment: env, services: [] },
        'build/version.json',
      );
      // upload build/* to website S3 bucket
      console.log(chalk.yellowBright('\nUploading Artifacts'));
      console.log(chalk.blackBright('Uploading artifacts to S3 bucket.\n'));
      console.log(
        chalk.blackBright(`  Target S3 bucket: ${TargetWebsite.s3_bucket}  `),
      );
      shell.rm('-rf', './build/__MACOSX');
      if (!args['dry-run']) {
        await sync('./build', TargetWebsite.s3_bucket);
      }
      // invalidate cdn
      console.log(chalk.yellowBright('Invalidating CDN'));
      const invalidationParams = {
        DistributionId: TargetWebsite.cloudfront_distribution_id,
        InvalidationBatch: {
          CallerReference: Date.now().toString(),
          Paths: {
            Quantity: 1,
            Items: ['/*'],
          },
        },
      };
      console.log(
        chalk.blackBright('Distribution Id'),
        TargetWebsite.cloudfront_distribution_id,
      );

      if (!args['dry-run']) {
        console.log(
          chalk.blackBright('Invalidation link:'),
          await (
            await CLOUD_FRONT.createInvalidation(invalidationParams).promise()
          ).Location,
        );
      }

      // test version.json on website via CDN matches build/version.json
      console.log(chalk.yellowBright('\nTesting Deployment'));
      console.log(
        chalk.blackBright('Validating deployed verison.json hash.\n'),
      );
      const config = {
        method: 'get',
        url: `https://${TargetWebsite.domain}/version.json`,
        headers: {},
      };
      const fetchedVersion = (await axios(config)).data;
      const localVersion = JSON.parse(
        fs.readFileSync('./build/version.json', 'utf-8'),
      );
      console.log(
        chalk.blackBright(`
    Deployment hashes matched.
    Deployed Hash: ${chalk.white(fetchedVersion.hash)}
    Local Hash:    ${chalk.white(localVersion.hash)}
    `),
      );
      console.log(chalk.green('Deployment Successfull !!!'));
      console.log(`::set-output name=ENV_URL::https://${TargetWebsite.domain}`);
    }
  } catch (error: unknown) {
    console.log(chalk.redBright(`Error: ${error}`));
    if (error instanceof Error && error.stack && args['dry-run']) {
      console.log(chalk.blackBright(error.stack));
    }
    exit(1);
  }
}

export default WEB;
