import { readFile, writeFile } from 'fs';

const newVersion = process.argv[2];

readFile('./package.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading package.json:', err);
    return;
  }

  const packageJson = JSON.parse(data);

  // Remove devDependencies, scripts, main, and other unnecessary fields
  delete packageJson.devDependencies;
  delete packageJson.scripts;
  delete packageJson.config;
  delete packageJson.pnpm;
  delete packageJson.repository;
  delete packageJson.commitizen;
  delete packageJson.main;

  // Update bin path
  if (packageJson.bin) {
    for (const key in packageJson.bin) {
      packageJson.bin[key] = packageJson.bin[key].replace('./build/', '');
    }
  }

  // Set the new version
  if (newVersion) {
    packageJson.version = newVersion;
  }

  writeFile(
    'prod.package.json',
    JSON.stringify(packageJson, null, 2),
    'utf8',
    (err) => {
      if (err) {
        console.error('Error writing prod.package.json:', err);
      } else {
        console.log('prod.package.json has been created successfully.');
      }
    },
  );
});
