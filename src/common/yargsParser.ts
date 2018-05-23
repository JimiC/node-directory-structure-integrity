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
      default: true,
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
    const pargs = y.parse(process.argv.slice(2));
    if (!pargs.output) {
      pargs.output = fs.statSync(pargs.input).isFile()
        ? path.dirname(pargs.input)
        : pargs.input;
    }
    return {
      algorithm: pargs.algorithm,
      command: pargs._[0],
      encoding: pargs.encoding,
      exclude: pargs.exclude,
      inPath: pargs.input,
      integrity: pargs.integrity,
      outPath: pargs.output,
      verbose: pargs.verbose,
    };
  }

  private _validate(argv: y.Arguments): boolean {
    let errorMsg = '';
    if (!fs.existsSync(argv.input)) {
      errorMsg = `ENOENT: no such file or directory, '${argv.input}'`;
    }
    if (errorMsg) {
      throw new Error(errorMsg);
    }
    return true;
  }
}
