import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import PackageJson from './package-json';

interface Service {
  name: string;
  endpoint: string;
}

interface Website {
  name: string;
  domain: string;
}

interface Infrastructure {
  environment: string;
  services: Service[];
  websites: Website[];
}

function NormalisePropertyName(s: string): string {
  return s
    .split(/\s|-/)
    .map((w) => w[0].toUpperCase().charAt(0) + w.substring(1))
    .join('');
}

/**
 * Generates a version.json file at suggested path. Uses terraform output of infrastructure to generate urls
 * @param {Infrastructure} infrastructure Infrastructure object with environment, services and websites.
 * @param {string} filepath Full path including filename where version.json will be written.
 * @returns {Object} Version.json as parsed JSON object.
 */
function GenerateVersion(
  infrastructure: Infrastructure,
  filepath?: string,
): object {
  if (typeof infrastructure !== 'object') {
    throw new Error('Infrastructure not passed as Object');
  }
  const urls: { [key: string]: string } = {};

  infrastructure.services.forEach((svc) => {
    urls[NormalisePropertyName(`${svc.name} service`)] = svc.endpoint;
  });

  infrastructure.websites.forEach((web) => {
    urls[NormalisePropertyName(`${web.name} website`)] = web.domain;
  });

  let version = PackageJson().version;

  if (version === '0.0.0') {
    version = shell
      .exec('git describe --tags', { silent: true })
      .stdout.replace('\n', '');
  }
  const config = {
    version: version,
    hash: shell
      .exec('git rev-parse HEAD', { silent: true })
      .stdout.replace('\n', ''),
    environment: infrastructure.environment,
    config: {
      urls: urls,
    },
  };

  if (filepath) {
    fs.writeFileSync(
      path.join(process.cwd(), filepath),
      JSON.stringify(config, null, '  '),
    );
  }

  return config;
}

export default GenerateVersion;
