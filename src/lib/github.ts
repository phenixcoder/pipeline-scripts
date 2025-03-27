import { Octokit } from '@octokit/core';

function Github(pat: string = process.env.GITHUB_TOKEN || ''): Octokit {
  return new Octokit({
    auth: pat,
  });
}

export default Github;
