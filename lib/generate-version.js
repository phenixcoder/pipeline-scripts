const fs = require('fs');
const path = require('path');

function Build_Urls(env, HOST) {
  const scheme = env === 'local' || HOST === 'localhost' ? 'http' : 'https';
  return {
    website: `${scheme}://${env === 'local' ? `${HOST}:3000` : `${HOST}`}`,
    merchant: `${scheme}://${
      env === 'local' ? `${HOST}:3001` : `merchant.${HOST}`
    }`,
    api: `${scheme}://${env === 'local' ? `${HOST}:3002` : `api.${HOST}`}`,
    pay: `${scheme}://${env === 'local' ? `${HOST}:3003` : `pay.${HOST}`}`,
    admin: `${scheme}://${env === 'local' ? `${HOST}:3006` : `admin.${HOST}`}`,
  };
}

function GenerateVersion(filepath, env, hostname) {
  fs.writeFileSync(
    path.join(process.cwd(), filepath),
    JSON.stringify(
      {
        hash: '6c0fa22611511a0a38be25f41c89c1fa9800550b',
        config: {
          urls: Build_Urls(env, hostname || 'numeropay.com'),
        },
      },
      null,
      '  '
    )
  );
}

module.exports = GenerateVersion;
