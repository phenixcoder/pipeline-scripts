export interface GenerateArgs {
  debug?: boolean;
  e?: string;
  dryRun?: boolean;
}

export interface PackageArgs {
  type: 'lib' | 'web' | 'service';
  env?: string;
  h?: string;
  host?: string;
  p?: string;
  packagePath?: string;
  debug?: boolean;
}

export interface DeployArgs {
  type: 'lib' | 'web' | 'service';
  e?: string;
  environment?: string;
  r?: string;
  release?: string;
  debug?: boolean;
  'dry-run'?: boolean;
}

export interface IPackageJSON {
  name: string;
  version: string;
  description: string;
  repository: {
    type: string;
    url: string;
  };
  dependencies: { [key: string]: string };
  devDependencies: { [key: string]: string };
}
