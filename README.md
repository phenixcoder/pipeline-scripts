# NumeorPay / Pipeline Helpers

> CLI toolkit with standard pipeline scripts and helpers

## Usage

```shell
pipeline-helpers <command>

Commands:
  pipeline-helpers package <type>         Package commannd to test, build and package an artifact.
  pipeline-helpers deploy <type>          Deploy app
  pipeline-helpers generate-config <env>   Generates version.json for passed environment
  pipeline-helpers init-repo <type>       Intialise pipeline of app type

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
pipeline-helpers package <type>

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
WIP
```

### `generate-config`

Generates `version.json` for provided `environment` and `hostname`.

```shell
WIP
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
