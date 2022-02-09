# Pipeline Scripts

> CLI toolkit with standard pipeline scripts and helpers

CI / CD Ingredients:

CI

1. Github Actions
2. eslint
3. prettier
4. husky
5. commitizen
6. docker
7. semantic-release
8. NPM

CD 2. terraform (terraform cloud) 3. AWS

## Usage

```shell
pipeline <command>

Commands:
  pipeline package <type>         Package commannd to test, build and package an artifact.
  pipeline deploy <type>          Deploy app
  pipeline generate-config <env>   Generates version.json for passed environment
  pipeline init-repo <type>       Intialise pipeline of app type

Options:
  --help     Show help             [boolean]
  --version  Show version number   [boolean]
```

## Project Types

| Type      | Description                       | Artifactory     | Deployment                   |
| --------- | --------------------------------- | --------------- | ---------------------------- |
| `lib`     | Shared Library                    | NPM             | N/A                          |
| `web`     | Web applications (CRA / GatsbyJS) | Github Releases | AWS S3 Bucket/Clodfront site |
| `service` | API / Serverside App              | Docker Repo     | AWS Lambda                   |

## Commands

### `package`

Tests, builds and if needed, packages and releases a new version the artifacet to artifactory. semantic-releases decides if a release needs to be published or not.

```shell
pipeline package <type>

Package commannd to test, build and package an artifact.

Options:
      --help          Show help              [boolean]
      --version       Show version number    [boolean]
  -h, --host          Base domain for this build. Defaults to numeropay.com
  -p, --package-path  Build directory relative to current directory.
```

### `deploy`

Deploys the provided release version to provided environment. Only aplicable to `web` and `service` types.

```shell
pipeline deploy <type>

Deploy a relese to an environment

Options:
      --help         Show help                                   [boolean]
      --version      Show version number                         [boolean]
  -e, --environment  Deployment environment        [default: "production"]
  -r, --release      Release version.
                     E.g.: 1.1.0                                [required]
      --debug        Enable debugging
      --dry-run      Dry run deploy script. No write actions are
                     performed.
```

### `generate-config`

Generates and prints `version.json` for provided `environment`.

```shell
pipeline generate-config

Generates version.json for passed environment

Options:
      --help         Show help                                         [boolean]
      --version      Show version number                               [boolean]
  -e, --environment  Deployment environment              [default: "production"]
      --debug        Enable debugging
```

### `init-repo`

Sets up and verifies the CI/CD pipelines in the specified project repo.
It checks for and setup if needed:

1. Semantic versiononing
2. Commitizen
3. Release Workflow
4. Deploy Workflow (Not for `lib` project types).
5. husky
6. Required scripts in `package.json`

```shell
WIP
```
