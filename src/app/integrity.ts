// tslint:disable unified-signatures
import ajv from 'ajv';
import { createHash, getHashes, Hash, HexBase64Latin1Encoding } from 'crypto';
import fs from 'fs';
import mm from 'minimatch';
import path from 'path';
import * as utils from '../common/utils';
import { ICryptoOptions } from '../interfaces/cryptoOptions';
import { IndexedObject } from '../interfaces/indexedObject';
import { IntegrityOptions } from '../interfaces/integrityOptions';
import { INormalizedIntegrityOptions } from '../interfaces/normalizedIntegrityOptions';

export class Integrity {
  public static readonly CurrentSchemaVersion = '1';

  public static async check(fileOrDirPath: string, integrity: string): Promise<boolean>;
  public static async check(fileOrDirPath: string, integrity: string, options?: IntegrityOptions): Promise<boolean>;
  public static async check(fileOrDirPath: string, integrity: string, detectOptions?: boolean): Promise<boolean>;
  public static async check(
    fileOrDirPath: string, integrity: string, options?: IntegrityOptions, detectOptions?: boolean): Promise<boolean>;
  public static async check(
    fileOrDirPath: string,
    integrity: string,
    optionsOrDetectOptions?: IntegrityOptions | boolean,
    detectOptions?: boolean): Promise<boolean> {
    if (!fileOrDirPath || typeof fileOrDirPath !== 'string' || !integrity || typeof integrity !== 'string') {
      return false;
    }
    let _options: IntegrityOptions | undefined = optionsOrDetectOptions as IntegrityOptions;
    if (typeof optionsOrDetectOptions === 'boolean') {
      _options = undefined;
      detectOptions = optionsOrDetectOptions;
    }
    if (detectOptions) {
      const exclude = _options ? _options.exclude : undefined;
      _options = await this._detectOptions(fileOrDirPath, integrity);
      _options.exclude = exclude;
    }
    const _hashObj = await Integrity.create(fileOrDirPath, _options);
    let _integrityObj: IndexedObject;
    // 'integrity' is a file or directory path
    if (await this._exists(integrity)) {
      integrity = await this._pathCheck(integrity);
      const _content = await this._readFile(integrity, 'utf8');
      _integrityObj = utils.parseJSON(_content) as IndexedObject;
      await this._validate(_integrityObj);
      return this._verify(_hashObj, _integrityObj, fileOrDirPath);
    }
    // 'integrity' is a stringified JSON
    _integrityObj = utils.parseJSON(integrity) as IndexedObject;
    // 'integrity' is a hash
    if (!_integrityObj) {
      _integrityObj = {
        hashes: {
          [path.basename(fileOrDirPath)]: integrity,
        },
        version: this.CurrentSchemaVersion,
      };
    }
    await this._validate(_integrityObj);
    return this._verify(_hashObj, _integrityObj);
  }

  public static async create(fileOrDirPath: string, options?: IntegrityOptions): Promise<IndexedObject> {
    const _ls: fs.Stats = await this._lstat(fileOrDirPath);
    const _obj: IndexedObject = {};
    if (_ls.isDirectory()) {
      _obj.version = this.CurrentSchemaVersion;
      _obj.hashes = await Integrity.createDirHash(fileOrDirPath, options);
    }
    if (_ls.isFile()) {
      const { cryptoOptions } = this._normalizeOptions(options);
      _obj.version = this.CurrentSchemaVersion;
      _obj.hashes = await Integrity.createFileHash(fileOrDirPath, cryptoOptions);
    }
    return _obj;
  }

  public static async createDirHash(dirPath: string, options?: IntegrityOptions)
    : Promise<IndexedObject> {
    const _dirPathStats: fs.Stats = await this._lstat(dirPath);
    if (!_dirPathStats.isDirectory()) {
      throw new Error(`ENOTDIR: not a directory, '${path.basename(dirPath)}'`);
    }
    const _options = this._normalizeOptions(options);
    const _hashes = _options.verbose
      ? await this._computeHashVerbosely(dirPath, _options)
      : await this._computeHash(dirPath, _options);
    let _hasHashes = false;
    if (typeof _hashes === 'string') {
      _hasHashes = !!_hashes;
    }
    if (_hashes !== null && typeof _hashes === 'object') {
      _hasHashes = !!Object.keys(_hashes).length;
    }
    return _hasHashes
      ? { [path.basename(dirPath)]: _hashes }
      : {};
  }

  public static async createFileHash(filePath: string, options?: ICryptoOptions): Promise<IndexedObject> {
    const _ls: fs.Stats = await this._lstat(filePath);
    if (!_ls.isFile()) {
      throw new Error(`ENOTFILE: not a file, '${path.basename(filePath)}'`);
    }
    if (path.basename(filePath) === this._integrityFilename) {
      throw new Error(`ENOTALW: file not allowed, '${path.basename(filePath)}'`);
    }
    const { algorithm = 'md5', encoding = 'hex' } = this._normalizeCryptoOptions(options);
    return { [path.basename(filePath)]: await this._computeStreamHash(filePath, createHash(algorithm), encoding) };
  }

  public static async createFilesHash(filenames: string[], options?: ICryptoOptions): Promise<IndexedObject> {
    const _hash: IndexedObject = {};
    const _callback = async (file: string, _obj: IndexedObject): Promise<void> => {
      Object.assign(_obj, await this.createFileHash(file, options));
    };
    await utils.asyncForEach(filenames, file => _callback(file, _hash));
    return _hash;
  }

  public static persist(data: object, dirPath = './'): Promise<void> {
    const _filePath = path.resolve(dirPath, this._integrityFilename);
    return this._writeFile(_filePath, JSON.stringify(data, null, 2));
  }

  /** @internal */
  private static _integrityFilename = '.integrity.json';

  /** @internal */
  private static _defaultExclutions = [`${Integrity._integrityFilename}`];

  /** @internal */
  private static _exists = utils.promisify<boolean>(fs.exists);

  /** @internal */
  private static _lstat = utils.promisify<fs.Stats>(fs.lstat);

  /** @internal */
  private static _readFile = utils.promisify<string | Buffer>(fs.readFile);

  /** @internal */
  private static _readdir = utils.promisify<string[]>(fs.readdir);

  /** @internal */
  private static _writeFile = utils.promisify<void>(fs.writeFile);

  /** @internal */
  private static async _detectOptions(inPath: string, integrity: string): Promise<IntegrityOptions> {
    const _getHash = (hashObj: IndexedObject): string => {
      if (!hashObj || !hashObj.hashes) { return ''; }
      const _first = hashObj.hashes[path.basename(inPath)];
      return (_first && _first.hash) || _first;
    };
    let _hashObj: IndexedObject;
    if (await this._exists(integrity)) {
      integrity = await this._pathCheck(integrity);
      const _content = await this._readFile(integrity, 'utf8');
      _hashObj = utils.parseJSON(_content) as IndexedObject;
    } else {
      _hashObj = utils.parseJSON(integrity) as IndexedObject;
      if (!_hashObj) {
        _hashObj = {
          hashes: {
            [path.basename(inPath)]: integrity,
          },
          version: this.CurrentSchemaVersion,
        };
      }
    }
    const _options: IntegrityOptions = {};
    const _hash = _getHash(_hashObj);
    if (!_hash) {
      return _options;
    }
    // find encoding
    const _encoding: HexBase64Latin1Encoding | undefined =
      utils.hexRegexPattern.test(_hash)
        ? 'hex'
        : utils.base64RegexPattern.test(_hash)
          ? 'base64'
          : utils.latin1RegexPattern.test(_hash)
            ? 'latin1'
            : undefined;
    if (!_encoding) {
      return _options;
    }
    // detect verbosity
    _options.verbose = !!_hashObj.hashes[path.basename(inPath)].hash;
    // find algorithm
    _options.cryptoOptions = { encoding: _encoding };
    for (const algorithm of getHashes()) {
      const _testOptions = {
        cryptoOptions: { algorithm, encoding: _options.cryptoOptions.encoding },
        verbose: _options.verbose,
      };
      let _testHashObj;
      try {
        _testHashObj = await this.create(inPath, _testOptions);
      } catch (error) {
        continue;
      }
      const _vHash = _getHash(_testHashObj);
      if (!_vHash) { continue; }
      if (_vHash === _hash) {
        _options.cryptoOptions.algorithm = algorithm;
        break;
      }
    }
    return _options;
  }

  /** @internal */
  private static _normalizeCryptoOptions(options?: ICryptoOptions): ICryptoOptions {
    const _check = (_options?: ICryptoOptions): ICryptoOptions | undefined => {
      if (!_options) { return _options; }
      if (_options.algorithm && !utils.isSupportedHash(_options.algorithm)) {
        throw new Error(`ENOSUP: Hash algorithm not supported: '${_options.algorithm}'`);
      }
      if (_options.encoding && ['hex', 'base64', 'latin1'].indexOf(_options.encoding.toLowerCase()) === -1) {
        throw new Error(`ENOSUP: Hash encoding not supported: '${_options.encoding}'`);
      }
      return _options;
    };
    return _check(options) || { algorithm: 'md5', encoding: 'hex' };
  }

  /** @internal */
  private static _normalizeOptions(options?: IntegrityOptions): INormalizedIntegrityOptions {
    const _getExclutions = (exclutions: string[]): { include: string[], exclude: string[] } => {
      let _exclude = ([] as string[]).concat(exclutions);
      const _include = _exclude.filter(excl => excl.startsWith('!')).map(excl => excl.slice(1));
      _exclude = _exclude.filter(excl => !excl.startsWith('!'));
      if (!_exclude.length) {
        _exclude = _exclude.concat(this._defaultExclutions);
      } else {
        this._defaultExclutions.forEach(excl => _exclude.push(excl));
      }
      return {
        exclude: _exclude,
        include: _include,
      };
    };
    const _cryptoOptions = options
      ? this._normalizeCryptoOptions(options.cryptoOptions)
      : this._normalizeCryptoOptions();
    const { exclude, include } = options
      ? _getExclutions(options.exclude || [])
      : _getExclutions([]);
    const _verbose = options && options.verbose !== undefined
      ? options.verbose
      : true;
    return {
      cryptoOptions: _cryptoOptions,
      exclude,
      include,
      verbose: _verbose,
    };
  }

  /** @internal */
  private static async _pathCheck(integrityPath: string): Promise<string> {
    const _ls: fs.Stats = await this._lstat(integrityPath);
    if (_ls.isDirectory()) {
      return path.join(integrityPath, this._integrityFilename);
    }
    if (_ls.isFile()) {
      if (path.basename(integrityPath) !== this._integrityFilename) {
        throw new Error(`EINVNAME: filename must be '${this._integrityFilename}'`);
      }
      return integrityPath;
    }
    throw new Error(`ENOSUP: path not supported: '${integrityPath}'`);
  }

  /** @internal */
  private static async _verify(hashedObj: IndexedObject, integrity: IndexedObject, inPath?: string): Promise<boolean> {
    if (hashedObj.version !== integrity.version) {
      throw new Error('EINVER: Incompatible versions check');
    }
    const _equals = (obj1: IndexedObject, obj2: IndexedObject): boolean => {
      return JSON.stringify(utils.sortObject(obj1)) === JSON.stringify(utils.sortObject(obj2));
    };
    const _deepEquals = async (_path?: string): Promise<boolean> => {
      if (!_path) { return false; }
      let _has = false;
      const _filenameOrDirectory = path.basename(_path);
      const _hashes = integrity.hashes;
      const _dirList = path.dirname(_path).split(path.sep).filter(pt => pt);
      const _findHash = (_array: string[], hashes: IndexedObject): void => {
        if (_array.length === 0) {
          _has = _equals(hashes[_filenameOrDirectory], hashedObj.hashes[_filenameOrDirectory]);
          return;
        }
        const _rootHash = hashes[_array[0]];
        // non-verbosely directory hash
        if (!_rootHash.contents) {
          _has = _rootHash === hashedObj.hashes[_array[0]];
          return;
        }
        // verbosely directory hash
        const _subDir = Object.keys(_rootHash.contents).find(key => key === _array[1]);
        _array = _subDir ? _array.splice(1) : [];
        return _findHash(_array, _rootHash.contents);
      };
      const _findRootIndex = async (_array: string[], _index: number): Promise<number> => {
        const _dirPath = utils.getAbsolutePath(_array, _index);
        const _dirHash = await this.createDirHash(_dirPath);
        const _integrityDirHash: string | IndexedObject = _hashes[_array[_index]];
        const _dirHashes: IndexedObject = _dirHash[_array[_index]];
        if (_integrityDirHash && _dirHashes) {
          const _hash = typeof _integrityDirHash === 'string'
            // non-verbose
            ? _integrityDirHash
            // verbose
            : _integrityDirHash.hash;
          return _hash === _dirHashes.hash
            ? _index
            : _findRootIndex(_array, _index + 1);
        }
        return -1;
      };
      const _potentialRootIndex = _dirList.findIndex(dir => _hashes[dir]);
      if (_potentialRootIndex === -1) { return false; }
      const _rootIndex = await _findRootIndex(_dirList, _potentialRootIndex);
      if (_rootIndex === -1) { return false; }
      _findHash(_dirList.splice(_rootIndex), _hashes);
      return _has;
    };
    const _isEqual = _equals(hashedObj, integrity);
    const _isDeepEqual = await _deepEquals(inPath);
    return _isEqual || _isDeepEqual;
  }

  /** @internal */
  private static _match = (target: string, pattern: string): boolean =>
    mm(target, pattern, { dot: true, matchBase: true })

  /** @internal */
  private static _excludePath(curPath: string, options: INormalizedIntegrityOptions): boolean {
    return (options.exclude.some(excl => !!excl && this._match(curPath, excl)))
      || (!!options.include.length
        && !options.include.some(incl => !!incl && this._match(curPath, incl)));
  }

  /** @internal */
  private static _computeStreamHash(filePath: string, hash: Hash, encoding?: HexBase64Latin1Encoding)
    : Promise<string | Buffer> {
    return new Promise((res, rej) => {
      const _result = () => res(encoding
        ? hash.digest(encoding)
        : '');
      hash.update(path.basename(filePath));
      fs.createReadStream(filePath)
        .on('error', (error: any) => rej(error))
        .on('data', (chunk: any) => hash.update(chunk))
        .on('end', _result);
    });
  }

  /** @internal */
  private static async _computeHash(dirPath: string, options: INormalizedIntegrityOptions): Promise<string> {
    const { algorithm = 'md5', encoding = 'hex' } = this._normalizeCryptoOptions(options.cryptoOptions);
    const _recurse = async (_dirPath: string, _hash: Hash): Promise<Hash> => {
      const _callback = async (filename: string): Promise<void> => {
        const _curPath = path.join(_dirPath, filename);
        if (this._excludePath(_curPath, options)) {
          return;
        }
        const _curPathStats: fs.Stats = await this._lstat(_curPath);
        if (_curPathStats.isDirectory()) {
          await _recurse(_curPath, _hash);
        }
        if (_curPathStats.isFile()) {
          await this._computeStreamHash(_curPath, _hash);
        }
      };
      _hash.update(path.basename(_dirPath));
      await utils.asyncForEach(await this._readdir(_dirPath), _callback);
      return _hash;
    };
    if (options.exclude.some(excl => this._match(dirPath, excl))) {
      return '';
    }
    const _finalHash = await _recurse(dirPath, createHash(algorithm));
    return _finalHash.digest(encoding);
  }

  /** @internal */
  private static async _computeHashVerbosely(dirPath: string, options: INormalizedIntegrityOptions)
    : Promise<IndexedObject> {
    const _recurseVerbosely = async (_dirPath: string): Promise<IndexedObject> => {
      const _callback = async (filename: string, contents: IndexedObject): Promise<void> => {
        const _curPath = path.join(_dirPath, filename);
        if (this._excludePath(_curPath, options)) {
          return;
        }
        const _curPathStats: fs.Stats = await this._lstat(_curPath);
        if (_curPathStats.isDirectory()) {
          Object.assign(contents, { [path.basename(_curPath)]: await _recurseVerbosely(_curPath) });
        }
        if (_curPathStats.isFile()) {
          Object.assign(contents, await this.createFileHash(_curPath, options.cryptoOptions));
        }
      };
      const _hashObj: IndexedObject = { contents: {}, hash: await this._computeHash(_dirPath, options) };
      await utils.asyncForEach(await this._readdir(_dirPath),
        (filename: string) => _callback(filename, _hashObj.contents));
      return _hashObj;
    };
    if (options.exclude.some(excl => this._match(dirPath, excl))) {
      return {};
    }
    return _recurseVerbosely(dirPath);
  }

  /** @internal */
  private static async _validate(data: IndexedObject): Promise<void> {
    const _path = path.resolve(__dirname, `../schemas/v${data.version}/schema.json`);
    if (!(await this._exists(_path))) {
      throw new Error(`EINVER: Invalid schema version, 'version: ${data.version}'`);
    }
    const _schema = await this._readFile(_path, 'utf8') as string;
    const _validator = new ajv();
    _validator.validate(JSON.parse(_schema), data);
    if (_validator.errors) {
      throw new Error(`EVALER: ${_validator.errorsText()}`);
    }
  }
}
