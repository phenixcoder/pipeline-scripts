const { Octokit } = require('@octokit/core');

function Github(pat = process.env.GITHUB_TOKEN) {
  return new Octokit({
    auth: pat,
  });
}

module.exports = Github;
