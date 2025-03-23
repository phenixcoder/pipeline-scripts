const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const mime = require('mime-types');
const AWS = require('aws-sdk');
const S3 = new AWS.S3();

async function sync(artifactFolder, bucket) {
  const absArtifactFolder = path.resolve(artifactFolder);

  const walkSync = async (currentDirPath, callback) => {
    for (const name of fs.readdirSync(currentDirPath)) {
      const filePath = path.join(currentDirPath, name);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        await callback(filePath, stat);
      } else if (stat.isDirectory()) {
        await walkSync(filePath, callback);
      }
    }
    // fs.readdirSync(currentDirPath).forEach(async (name) => {
    //   const filePath = path.join(currentDirPath, name);
    //   const stat = fs.statSync(filePath);
    //   if (stat.isFile()) {
    //     await callback(filePath, stat);
    //   } else if (stat.isDirectory()) {
    //     await walkSync(filePath, callback);
    //   }
    // });
  };

  await walkSync(absArtifactFolder, async (filePath) => {
    let bucketPath = filePath.substring(artifactFolder.length - 1);
    bucketPath = path.resolve(filePath).replace(`${absArtifactFolder}/`, '');
    try {
      let params = {
        ACL: 'public-read',
        ContentType: mime.lookup(bucketPath),
        Bucket: bucket,
        Key: bucketPath,
        Body: fs.readFileSync(filePath),
      };
      console.log(
        `${chalk.yellow(
          (await S3.putObject(params).promise()).ETag,
        )} : ${bucketPath}`,
      );
    } catch (error) {
      console.log(error);
      throw new Error(
        chalk.red(
          `error in uploading ${chalk.yellow(bucketPath)} to ${chalk.yellow(
            bucket,
          )}`,
        ),
      );
    }
  });
}

module.exports = sync;
