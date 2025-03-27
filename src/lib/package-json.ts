import fs from 'fs';
import path from 'path';
import { IPackageJSON } from '../types';

export default function PackageJSON(): IPackageJSON {
  const packagePath = path.resolve(process.cwd(), 'package.json');
  const packageData = fs.readFileSync(packagePath, 'utf-8');
  return JSON.parse(packageData);
}
