import fs from 'fs';
import path from 'path';
import * as y from 'yargs';
import { IParsedArgs } from '../interfaces/parsedArgs';
import { sortObject } from './utils';

/** @internal */
export class YargsParser {
  private readonly _commonOptions: { [key: string]: y.Options } = {
    a: {
      alias: 'algorithm',
      description: 'The algorithm to use for hashing',
      type: 'string',
    },
    e: {
      alias: 'encoding',
      description: 'The encoding to use for hashing',
      type: 'string',
    },
    p: {
      alias: ['in', 'input'],
      demandOption: true,
      description: 'The path to the file or directory to hash',
      type: 'string',
    },
    r: {
      alias: 'verbose',
      default: false,
      description: 'Verbosely create hashes of a directory',
      type: 'boolean',
    },
    x: {
      alias: 'exclude',
      default: [],
      description: 'Files and/or directories paths to exclude',
      type: 'array',
    },
  };

  private readonly _createOptions: { [key: string]: y.Options } = {
    m: {
      alias: 'manifest',
      default: true,
      description: 'Saves the integrity hash in the project\'s manifest (package.json)',
      type: 'boolean',
    },
    o: {
      alias: ['out', 'output'],
      description: 'The directory path where to persist the created integrity file',
      type: 'string',
    },
  };

  private readonly _checkOptions: { [key: string]: y.Options } = {
    i: {
      alias: 'integrity',
      demandOption: true,
      description: 'The integrity hash, json, file or directory path, to check against',
      type: 'string',
    },
  };

  constructor() {
    y
      .usage('Usage: $0 command [options]')
      .command('create [options]',
        'Creates integrity hash from the provided input',
        sortObject({ ...this._createOptions, ...this._commonOptions }))
      .command('check [options]',
        'Checks integrity hash against the provided input',
        sortObject({ ...this._checkOptions, ...this._commonOptions }))
      .demandCommand(1, 'Missing command')
      .recommendCommands()
      .options({
        V: {
          alias: 'version',
          description: 'Show version number',
          global: false,
        },
        h: {
          alias: 'help',
          description: 'Show help',
          global: true,
        },
      })
      .check((argv: y.Arguments) => this._validate(argv))
      .strict();
  }

  public parse(): IParsedArgs {
    const _pargs = y.parse(process.argv.slice(2));
    if (!_pargs.output) {
      _pargs.output = fs.statSync(_pargs.input).isFile()
        ? path.dirname(_pargs.input)
        : _pargs.input;
    }
    return {
      algorithm: _pargs.algorithm,
      command: _pargs._[0],
      encoding: _pargs.encoding,
      exclude: _pargs.exclude,
      inPath: _pargs.input,
      integrity: _pargs.integrity,
      outPath: _pargs.output,
      verbose: _pargs.verbose,
    };
  }

  private _validate(argv: y.Arguments): boolean {
    let _errorMsg = '';
    if (!fs.existsSync(argv.input)) {
      _errorMsg = `ENOENT: no such file or directory, '${argv.input}'`;
    }
    if (_errorMsg) {
      throw new Error(_errorMsg);
    }
    return true;
  }
}
