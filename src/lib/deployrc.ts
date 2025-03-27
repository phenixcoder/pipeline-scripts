import * as path from 'path';
import * as fs from 'fs';
import * as chalk from 'chalk';

interface DeployRCConfig {
  // Define the structure of your .deployrc file here
  [key: string]: string | { [key: string]: string };
  name: string;
  environments: {
    [key: string]: string;
  };
}

function DeployRC(filepath?: string): DeployRCConfig {
  const DeployRCPath = filepath
    ? filepath
    : path.join(process.cwd(), '.deployrc');

  if (!fs.existsSync(DeployRCPath)) {
    throw new Error('cannot find .deployrc');
  }

  try {
    const fileContent = fs.readFileSync(DeployRCPath, { encoding: 'utf-8' });
    return JSON.parse(fileContent) as DeployRCConfig;
  } catch (error) {
    console.log(chalk.red(error));
    throw error;
  }
}

export default DeployRC;
