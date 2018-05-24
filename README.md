# ndsi (Node Directory Structure Integrity)

[![Build Status](https://travis-ci.com/JimiC/node-directory-structure-integrity.svg?branch=master)](https://travis-ci.com/JimiC/node-directory-structure-integrity)
[![Build Status](https://ci.appveyor.com/api/projects/status/github/JimiC/node-directory-structure-integrity?branch=master&svg=true)](https://ci.appveyor.com/project/JimiC/node-directory-structure-integrity)

[![Dependencies Status](https://david-dm.org/jimic/node-directory-structure-integrity/status.svg)](https://david-dm.org/jimic/node-directory-structure-integrity)
[![DevDependencies Status](https://david-dm.org/jimic/node-directory-structure-integrity/dev-status.svg)](https://david-dm.org/jimic/node-directory-structure-integrity?type=dev)

[![Maintainability](https://api.codeclimate.com/v1/badges/80a63b3346eef535a228/maintainability)](https://codeclimate.com/github/JimiC/node-directory-structure-integrity/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/80a63b3346eef535a228/test_coverage)](https://codeclimate.com/github/JimiC/node-directory-structure-integrity/test_coverage)

[![Known Vulnerabilities](https://snyk.io/test/github/jimic/node-directory-structure-integrity/badge.svg?targetFile=package.json)](https://snyk.io/test/github/jimic/node-directory-structure-integrity?targetFile=package.json)

---

A [Node.js](https://nodejs.org) utility tool that creates an `.integrity.json` file, that contains the hash checksums of a directory structure.

The hashes are computed using the `md5` algorithm and `hex` encoding by default, but other [Node.js crypto](https://nodejs.org/api/crypto.html) supported [algorithms](https://nodejs.org/api/crypto.html#crypto_crypto_gethashes) and [encodings](https://nodejs.org/api/crypto.html#crypto_hash_digest_encoding) can be used.

## Instalation

To install as a dependency, simply type:

```sh
npm i ndsi --save
```

To install for global use, simply type:

```sh
npm i ndsi -g
```

## Behavior

**NOTE:** The `.integrity.json` file itself is being excluded in all computations.

### Files

**Hashes are the same when:**

- File names and contents are the same

**Hashes are different when:**

- File names are different and contents are the same
- File contents are different and names are the same

### Directories

Contents: The file names (and their data contents) and subdirectories names (with their contents) of the directory

**Hashes are the same when:**

- Directory names and contents are the same

**Hashes are different when:**

- Directory names are different and contents are the same
- Directory contents are different and names are the same

## Usage

### CLI

`ndsi` has a built-in command-line inteface.

```sh
ndsi <command> [options]
```

To see the available `commands` type:

```sh
ndsi -h
```

and for available `command` options type:

```sh
ndsi <command> -h
```

### API

`ndsi` can also be used programatically ([TypeScript](https://www.typescriptlang.org/) types are included).

More info can be found at the [API](https://github.com/JimiC/node-directory-structure-integrity/blob/master/docs/api.md) section.

### Integrity object schema

```json
{
  "version": ... schema version,
  "hashes": ... verbosely or non-verbosely computed hashes
}
```

More info on the used schema can be found [here](https://github.com/JimiC/node-directory-structure-integrity/blob/master/src/schemas).

#### Verbosely hashes schema

```json
{
  "directoryName": {
    "contents": {
      "aFileName":  ... computed hash string,
      "anotherFileName":  ... computed hash string
    },
    "hash": ... directory computed hash string
  }
}
```

Examples of a verbosely computed hash integrity file can be found [here](https://github.com/JimiC/node-directory-structure-integrity/blob/master/test/fixtures).

#### Non-verbosely hashes schema

```json
{
  "fileOrDirectoryName": ... computed hash string
}
```

### Examples

Examples on how to use `ndsi`, via `CLI` or `API`, can be found at the [examples](https://github.com/JimiC/node-directory-structure-integrity/blob/master/docs/examples) section.

If you believe that the examples are incomplete or incorrect, please submit an issue or better yet a PR.

## Contributing

If you like to contribute make sure to check-out the [Contribution Guidelines](https://github.com/JimiC/node-directory-structure-integrity/blob/master/.github/CONTRIBUTING.md) section.

## License

This project is licensed under the [MIT](https://github.com/JimiC/node-directory-structure-integrity/blob/master/LICENSE) license.

## Versioning

This project follows [Semantic Versioning 2.0.0](https://semver.org).
