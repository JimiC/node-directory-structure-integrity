// tslint:disable unified-signatures
import ajv from 'ajv';
import { createHash, getHashes, Hash, HexBase64Latin1Encoding } from 'crypto';
import fs from 'fs';
import mm from 'minimatch';
import path from 'path';
import { asyncForEach, getAbsolutePath, parseJSON, promisify, sortObject } from '../common/utils';
import { ICryptoOptions } from '../interfaces/cryptoOptions';
import { IndexedObject } from '../interfaces/indexedObject';
import { IntegrityOptions } from '../interfaces/integrityOptions';
import { INormalizedIntegrityOptions } from '../interfaces/normalizedIntegrityOptions';

export class Integrity {
  public static readonly CurrentSchemaVersion = '1';

  public static async check(inPath: string, integrity: string, options?: IntegrityOptions): Promise<boolean> {
    if (!inPath || typeof inPath !== 'string' || !integrity || typeof integrity !== 'string') { return false; }
    const _hashObj = await Integrity.create(inPath, options);
    // 'integrity' is a file or directory path
    if (await this._exists(integrity)) {
      return this._handlePathCheck(integrity, _hashObj, inPath);
    }
    // 'integrity' is a stringified JSON
    let _integrityObj = parseJSON(integrity) as IndexedObject;
    if (_integrityObj) {
      await this._validate(_integrityObj);
      return this._verify(_hashObj, _integrityObj);
    }
    // 'integrity' is a hash
    _integrityObj = {
      hashes: {
        [path.basename(inPath)]: integrity,
      },
      version: this.CurrentSchemaVersion,
    };
    await this._validate(_integrityObj);
    return this._verify(_hashObj, _integrityObj);
  }

  public static async create(inPath: string, options?: IntegrityOptions): Promise<IndexedObject> {
    const _ls: fs.Stats = await this._lstat(inPath);
    const _obj: IndexedObject = {};
    if (_ls.isDirectory()) {
      _obj.version = this.CurrentSchemaVersion;
      _obj.hashes = await Integrity.createDirHash(inPath, options);
    }
    if (_ls.isFile()) {
      const { cryptoOptions } = this._normalizeOptions(options);
      _obj.version = this.CurrentSchemaVersion;
      _obj.hashes = await Integrity.createFileHash(inPath, cryptoOptions);
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
    await asyncForEach(filenames, file => _callback(file, _hash));
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
  private static _exists = promisify<boolean>(fs.exists);

  /** @internal */
  private static _lstat = promisify<fs.Stats>(fs.lstat);

  /** @internal */
  private static _readFile = promisify<string | Buffer>(fs.readFile);

  /** @internal */
  private static _readdir = promisify<string[]>(fs.readdir);

  /** @internal */
  private static _writeFile = promisify<void>(fs.writeFile);

  /** @internal */
  private static _normalizeCryptoOptions(options?: ICryptoOptions): ICryptoOptions {
    const check = (_options?: ICryptoOptions): ICryptoOptions | undefined => {
      if (!_options) { return _options; }
      if (_options.algorithm && getHashes().indexOf(_options.algorithm.toLowerCase()) === -1) {
        throw new Error(`ENOSUP: Hash algorithm not supported: '${_options.algorithm}'`);
      }
      if (_options.encoding && ['hex', 'base64', 'latin1'].indexOf(_options.encoding.toLowerCase()) === -1) {
        throw new Error(`ENOSUP: Hash encoding not supported: '${_options.encoding}'`);
      }
      return _options;
    };
    return check(options) || { algorithm: 'md5', encoding: 'hex' };
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
  private static async _handlePathCheck(integrity: string, hashObj: IndexedObject, inPath: string): Promise<boolean> {
    const _ls: fs.Stats = await this._lstat(integrity);
    if (_ls.isDirectory()) {
      integrity = path.join(integrity, this._integrityFilename);
    }
    if (_ls.isFile()) {
      if (path.basename(integrity) !== this._integrityFilename) {
        throw new Error(`EINVNAME: filename must be '${this._integrityFilename}'`);
      }
    }
    if (await this._exists(integrity)) {
      const _content = await this._readFile(integrity, 'utf8');
      const _signature = parseJSON(_content) as IndexedObject;
      if (_signature) {
        await this._validate(_signature);
        return this._verify(hashObj, _signature, inPath);
      }
    }
    return false;
  }

  /** @internal */
  private static async _verify(hashedObj: IndexedObject, integrity: IndexedObject, inPath?: string): Promise<boolean> {
    if (hashedObj.version !== integrity.version) {
      throw new Error('EINVER: Incompatible versions check');
    }
    const _equals = (obj1: IndexedObject, obj2: IndexedObject): boolean => {
      return JSON.stringify(sortObject(obj1)) === JSON.stringify(sortObject(obj2));
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
        const subDir = Object.keys(_rootHash.contents).find(key => key === _array[1]);
        _array = subDir ? _array.splice(1) : [];
        return _findHash(_array, _rootHash.contents);
      };
      const _findRootIndex = async (_array: string[], _index: number): Promise<number> => {
        const _dirPath = getAbsolutePath(_array, _index);
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
      await asyncForEach(await this._readdir(_dirPath), _callback);
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
      await asyncForEach(await this._readdir(_dirPath), (filename: string) => _callback(filename, _hashObj.contents));
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
