// tslint:disable only-arrow-functions
// tslint:disable no-unused-expression
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import * as sinon from 'sinon';
import { Readable } from 'stream';
import { Integrity } from '../../src/app/integrity';
import * as utils from '../../src/common/utils';
import { IntegrityOptions } from '../../src/interfaces/integrityOptions';
import { checker } from '../helper';

describe('IntegrityChecker: function \'createDirHash\' tests', function () {

  context('expects', function () {

    let otherFileToHashFilename: string;
    let fileToHashFilename: string;
    let fixturesDirPath: string;
    let fileToHashFilePath: string;
    let md5Length: number;
    let sha1Length: number;

    before(function () {
      otherFileToHashFilename = 'otherFileToHash.txt';
      fileToHashFilename = 'fileToHash.txt';

      md5Length = 32;
      sha1Length = 40;
    });

    let options: IntegrityOptions;

    beforeEach(function () {
      fixturesDirPath = path.resolve(__dirname, '../../../test/fixtures');
      fileToHashFilePath = path.resolve(fixturesDirPath, fileToHashFilename);
      options = {
        cryptoOptions: undefined,
        exclude: undefined,
        verbose: undefined,
      };
    });

    context('to throw an Error when', function () {

      it('the provided algorithm is not supported',
        function () {
          options.cryptoOptions = { algorithm: 'md1' };
          Integrity.createDirHash(fixturesDirPath, options)
            .catch(error => expect(error).to.be.an.instanceof(Error).that.matches(/ENOSUP:/));
        });

      it('the provided encoding is not supported',
        function () {
          // @ts-ignore
          options.cryptoOptions = { encoding: 'ascii' };
          Integrity.createDirHash(fixturesDirPath, options)
            .catch((error: any) => expect(error).to.be.an.instanceof(Error).that.matches(/ENOSUP:/));
        });

      it('the provided path is not a directory',
        function () {
          options.verbose = false;
          Integrity.createDirHash(fileToHashFilePath, options)
            .catch(error => expect(error).to.be.an.instanceof(Error).that.matches(/ENOTDIR:/));
        });

      it('a file can not be read',
        function () {
          options.verbose = false;
          const createReadStreamStub = sinon.stub(fs, 'createReadStream').returns(new Readable() as fs.ReadStream);
          Integrity.createDirHash(fixturesDirPath, options)
            .catch(error => {
              createReadStreamStub.restore();
              expect(error).to.be.an.instanceof(Error);
            });
        });

    });

    it('to return by default an \'sha1\' and \'base64\' encoded hash string',
      async function () {
        options.verbose = false;
        const sut = await Integrity.createDirHash(fixturesDirPath, options);
        expect(sut).to.be.an('object')
          .and.to.haveOwnProperty('fixtures')
          .and.to.satisfy((hash: string) =>
            checker(hash, utils.base64RegexPattern, 'DIjHOBHMnvpJxM4onkxvXbmcdME='));
      });

    it('to return an \'sha1\' and \'hex\' encoded hash string',
      async function () {
        options.cryptoOptions = { encoding: 'hex' };
        options.verbose = false;
        const sut = await Integrity.createDirHash(fixturesDirPath, options);
        expect(sut).to.be.an('object')
          .and.to.haveOwnProperty('fixtures')
          .and.to.satisfy((hash: string) =>
            checker(hash, utils.hexRegexPattern, '0c88c73811cc9efa49c4ce289e4c6f5db99c74c1', 'sha1', sha1Length));
      });

    it('to return an \'sha1\' and \'latin1\' encoded hash string',
      async function () {
        options.cryptoOptions = { encoding: 'latin1' };
        options.verbose = false;
        const sut = await Integrity.createDirHash(fixturesDirPath, options);
        expect(sut).to.be.an('object')
          .and.to.haveOwnProperty('fixtures')
          .and.to.satisfy((hash: string) =>
            checker(hash, utils.latin1RegexPattern, '\fÇ8\u0011ÌúIÄÎ(Lo]¹tÁ'));
      });

    it('to return an \'md5\' and \'base64\' encoded hash string',
      async function () {
        options.cryptoOptions = { algorithm: 'md5' };
        options.verbose = false;
        const sut = await Integrity.createDirHash(fixturesDirPath, options);
        expect(sut).to.be.an('object')
          .and.to.haveOwnProperty('fixtures')
          .and.to.satisfy((hash: string) =>
            checker(hash, utils.base64RegexPattern, 'A6PXayxS1izmNQK4UQBXXw==', 'md5'));
      });

    it('to return an \'md5\' and \'hex\' encoded hash string',
      async function () {
        options.cryptoOptions = { algorithm: 'md5', encoding: 'hex' };
        options.verbose = false;
        const sut = await Integrity.createDirHash(fixturesDirPath, options);
        expect(sut).to.be.an('object')
          .and.to.haveOwnProperty('fixtures')
          .and.to.satisfy((hash: string) =>
            checker(hash, utils.hexRegexPattern, '03a3d76b2c52d62ce63502b85100575f', 'md5', md5Length));
      });

    context('to verbosely compute a hash JSON', function () {

      beforeEach(function () {
        options.verbose = true;
      });

      it('with \'sha1\' and \'base64\' encoding by default',
        async function () {
          const sut = await Integrity.createDirHash(fixturesDirPath, options);
          expect(sut).to.be.an('object')
            .and.to.haveOwnProperty('fixtures')
            .and.that.to.haveOwnProperty('contents')
            .and.that.to.haveOwnProperty(fileToHashFilename)
            .and.to.satisfy((hash: string) =>
              checker(hash, utils.base64RegexPattern, 'H58mYNjbMJTkiNvvNfj2YKl3ck0='));
        });

      it('with \'sha1\' and \'hex\' encoding',
        async function () {
          options.cryptoOptions = { encoding: 'hex' };
          const sut = await Integrity.createDirHash(fixturesDirPath, options);
          expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
          expect(sut.fixtures).to.haveOwnProperty('contents');
          expect(sut.fixtures.contents).to.haveOwnProperty(fileToHashFilename)
            .and.to.satisfy((hash: string) =>
              checker(hash, utils.hexRegexPattern, '1f9f2660d8db3094e488dbef35f8f660a977724d', 'sha1', sha1Length));
        });

      it('with \'sha1\' and \'latin1\' encoding',
        async function () {
          options.cryptoOptions = { encoding: 'latin1' };
          const sut = await Integrity.createDirHash(fixturesDirPath, options);
          expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
          expect(sut.fixtures).to.haveOwnProperty('contents');
          expect(sut.fixtures.contents).to.haveOwnProperty(fileToHashFilename)
            .and.to.satisfy((hash: string) =>
              checker(hash, utils.latin1RegexPattern, '\u001f&`ØÛ0äÛï5øö`©wrM'));
        });

      it('with \'md5\' and \'base64\' encoding',
        async function () {
          options.cryptoOptions = { algorithm: 'md5' };
          const sut = await Integrity.createDirHash(fixturesDirPath, options);
          expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
          expect(sut.fixtures).to.haveOwnProperty('contents');
          expect(sut.fixtures.contents).to.haveOwnProperty(fileToHashFilename)
            .and.to.satisfy((hash: string) =>
              checker(hash, utils.base64RegexPattern, 'ej1bR1vQeukEH6sqEz9AxA==', 'md5'));
        });

      it('with \'md5\' and \'hex\' encoding',
        async function () {
          options.cryptoOptions = { algorithm: 'md5', encoding: 'hex' };
          const sut = await Integrity.createDirHash(fixturesDirPath, options);
          expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
          expect(sut.fixtures)
            .to.haveOwnProperty('contents')
            .and.that.to.haveOwnProperty(fileToHashFilename)
            .and.to.satisfy((hash: string) =>
              checker(hash, utils.hexRegexPattern, '7a3d5b475bd07ae9041fab2a133f40c4', 'md5', md5Length));
        });

    });

    context('to exclude', function () {

      context('in non-verbosely computation', function () {

        it('the provided file',
          async function () {
            options.exclude = [fileToHashFilename];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object')
              .and.to.haveOwnProperty('fixtures')
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'pvPcnwMc2YvNtloZSTvaAM1s0ys='));
          });

        it('the provided file (glob pattern)',
          async function () {
            options.exclude = ['**/fileToHash.txt'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object')
              .and.to.haveOwnProperty('fixtures')
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'pvPcnwMc2YvNtloZSTvaAM1s0ys='));
          });

        it('the provided files',
          async function () {
            options.exclude = [fileToHashFilename, otherFileToHashFilename];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object')
              .and.to.haveOwnProperty('fixtures')
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'SojskkzqtOGxaQowiXKOzzuDAH4='));
          });

        it('the provided files (glob pattern)',
          async function () {
            options.exclude = ['**/fileToHash.txt', '**/otherFileToHash.txt'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object')
              .and.to.haveOwnProperty('fixtures')
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'SojskkzqtOGxaQowiXKOzzuDAH4='));
          });

        it('the provided files (glob pattern)',
          async function () {
            options.exclude = ['**/*.txt'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object')
              .and.to.haveOwnProperty('fixtures')
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'evAu7MaiJLQBYPSjKD1DoJGTdiM='));
          });

        it('the provided files (glob pattern)',
          async function () {
            options.exclude = ['**/*.*'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object')
              .and.to.haveOwnProperty('fixtures')
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'qd8CRtuhKzDR8IGKUbpuLpzAHrA='));
          });

        it('the provided directory',
          async function () {
            options.exclude = ['fixtures'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').that.is.empty;
          });

        it('the provided directory (glob pattern)',
          async function () {
            options.exclude = ['**/fixtures'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').that.is.empty;
          });

        it('the provided directory (glob pattern)',
          async function () {
            options.exclude = ['**/fixtures/**'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object')
              .and.to.haveOwnProperty('fixtures')
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'FwVFRcW8fWNb4+n0h3MujaW3/Pw='));
          });

        it('the provided directory (glob pattern)',
          async function () {
            options.exclude = ['**/*'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').that.is.empty;
          });

        it('the provided subdirectory',
          async function () {
            options.exclude = ['directory'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object')
              .and.to.haveOwnProperty('fixtures')
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'bXBFds4jVjamLBXpa4dMtHU1RUE='));
          });

        it('the provided subdirectory (glob pattern)',
          async function () {
            options.exclude = ['**/directory'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object')
              .and.to.haveOwnProperty('fixtures')
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'bXBFds4jVjamLBXpa4dMtHU1RUE='));
          });

        it('the provided subdirectory (glob pattern)',
          async function () {
            options.exclude = ['**/directory/**'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object')
              .and.to.haveOwnProperty('fixtures')
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'Fh7Q0MBl/7pLVArQmDho3tH+1M0='));
          });

      });

      context('in verbosely computation', function () {

        beforeEach(function () {
          options.verbose = true;
        });

        it('the provided file',
          async function () {
            options.exclude = [fileToHashFilename];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.contents.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'pvPcnwMc2YvNtloZSTvaAM1s0ys='));
          });

        it('the provided file (glob pattern)',
          async function () {
            options.exclude = ['**/fileToHash.txt'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.contents.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'pvPcnwMc2YvNtloZSTvaAM1s0ys='));
          });

        it('the provided files',
          async function () {
            options.exclude = [fileToHashFilename, otherFileToHashFilename];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.contents.directory.contents).to.not.haveOwnProperty(otherFileToHashFilename);
            expect(sut.fixtures.contents['directory.1'].contents).to.not.haveOwnProperty(otherFileToHashFilename);
            expect(sut.fixtures.contents.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.contents.fixtures.contents.directory.contents)
              .to.not.haveOwnProperty(otherFileToHashFilename);
            expect(sut.fixtures.contents.fixtures.contents['directory.1'].contents)
              .to.not.haveOwnProperty(otherFileToHashFilename);
            expect(sut.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'SojskkzqtOGxaQowiXKOzzuDAH4='));
          });

        it('the provided files (glob pattern)',
          async function () {
            options.exclude = ['**/fileToHash.txt', '**/otherFileToHash.txt'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.contents.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'SojskkzqtOGxaQowiXKOzzuDAH4='));
          });

        it('the provided \'txt\' files (glob pattern)',
          async function () {
            options.exclude = ['**/*.txt'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.contents.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'evAu7MaiJLQBYPSjKD1DoJGTdiM='));
          });

        it('all files (glob pattern)',
          async function () {
            options.exclude = ['**/*.*'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.contents.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'qd8CRtuhKzDR8IGKUbpuLpzAHrA='));
          });

        it('the provided directory',
          async function () {
            options.exclude = ['fixtures'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').that.is.empty;
          });

        it('the provided directory (glob pattern)',
          async function () {
            options.exclude = ['**/fixtures'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').that.is.empty;
          });

        it('the provided directory contents (glob pattern)',
          async function () {
            options.exclude = ['**/fixtures/**'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object');
            expect(sut)
              .to.haveOwnProperty('fixtures')
              .and.that.to.haveOwnProperty('contents')
              .and.that.to.be.empty;
            expect(sut.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'FwVFRcW8fWNb4+n0h3MujaW3/Pw='));
          });

        it('everything (glob pattern)',
          async function () {
            options.exclude = ['**/*'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').that.is.empty;
          });

        it('the provided subdirectory',
          async function () {
            options.exclude = ['directory'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object');
            expect(sut)
              .and.to.haveOwnProperty('fixtures')
              .and.that.to.haveOwnProperty('contents')
              .and.that.to.not.haveOwnProperty('directory');
            expect(sut)
              .and.to.haveOwnProperty('fixtures')
              .and.that.to.haveOwnProperty('contents')
              .and.that.to.haveOwnProperty('fixtures')
              .and.that.to.haveOwnProperty('contents')
              .and.that.to.not.haveOwnProperty('directory');
            expect(sut.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'bXBFds4jVjamLBXpa4dMtHU1RUE='));
          });

        it('the provided subdirectory (glob pattern)',
          async function () {
            options.exclude = ['**/directory'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object');
            expect(sut)
              .and.to.haveOwnProperty('fixtures')
              .and.that.to.haveOwnProperty('contents')
              .and.that.to.not.haveOwnProperty('directory');
            expect(sut)
              .and.to.haveOwnProperty('fixtures')
              .and.that.to.haveOwnProperty('contents')
              .and.that.to.haveOwnProperty('fixtures')
              .and.that.to.haveOwnProperty('contents')
              .and.that.to.not.haveOwnProperty('directory');
            expect(sut.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'bXBFds4jVjamLBXpa4dMtHU1RUE='));
          });

        it('the provided subdirectory contents (glob pattern)',
          async function () {
            options.exclude = ['**/directory/**'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object');
            expect(sut)
              .to.haveOwnProperty('fixtures')
              .and.that.to.haveOwnProperty('contents')
              .and.that.to.haveOwnProperty('directory')
              .and.that.to.haveOwnProperty('contents')
              .and.that.to.be.empty;
            expect(sut.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'Fh7Q0MBl/7pLVArQmDho3tH+1M0='));
          });

      });

    });

    context('to include', function () {

      context('in verbosely computation', function () {

        beforeEach(function () {
          options.verbose = true;
        });

        it('the provided file (glob pattern)',
          async function () {
            options.exclude = ['!**/fixtures', '!**/fileToHash.txt'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object');
            expect(sut)
              .to.haveOwnProperty('fixtures')
              .and.that.to.haveOwnProperty('contents')
              .and.that.to.haveOwnProperty('fixtures')
              .and.that.to.haveOwnProperty('contents')
              .and.that.to.haveOwnProperty(fileToHashFilename)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 't56X7IQ267Hza0qjpSpqb9UPcfE='));
            expect(sut.fixtures.contents)
              .to.haveOwnProperty(fileToHashFilename)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'H58mYNjbMJTkiNvvNfj2YKl3ck0='));
            expect(sut.fixtures.contents.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, '3MhOCNtlpfvht75sVRn+M010hIo='));
            expect(sut.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'XITQWhgqwyUBWIBG5sEL6vRkfe0='));
          });

        it('only the provided root directory file (glob pattern)',
          async function () {
            options.exclude = ['**/fixtures/', '!**/fileToHash.txt'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object');
            expect(sut)
              .to.haveOwnProperty('fixtures')
              .and.that.to.haveOwnProperty('contents');
            expect(sut.fixtures.contents).not.to.haveOwnProperty('fixtures');
            expect(sut.fixtures.contents).not.to.haveOwnProperty('directory');
            expect(sut.fixtures.contents).not.to.haveOwnProperty('directory.1');
            expect(sut.fixtures.contents).not.to.haveOwnProperty('sameContentWithFileToHash.txt');
            expect(sut.fixtures.contents)
              .to.haveOwnProperty(fileToHashFilename)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'H58mYNjbMJTkiNvvNfj2YKl3ck0='));
            expect(sut.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'usu4eDPP58XnuB1TgLgoYMBxy8s='));
          });

        it('only the provided subdirectory file (glob pattern)',
          async function () {
            options.exclude = ['!**/fixtures', '!**/fixtures/fixtures/fileToHash.txt'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object');
            expect(sut.fixtures.contents).not.to.haveOwnProperty('directory');
            expect(sut.fixtures.contents).not.to.haveOwnProperty('directory.1');
            expect(sut.fixtures.contents).not.to.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.contents).not.to.haveOwnProperty('sameContentWithFileToHash.txt');
            expect(sut)
              .to.haveOwnProperty('fixtures')
              .and.that.to.haveOwnProperty('contents')
              .and.that.to.haveOwnProperty('fixtures')
              .and.that.to.haveOwnProperty('contents')
              .and.that.to.haveOwnProperty(fileToHashFilename)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 't56X7IQ267Hza0qjpSpqb9UPcfE='));
            expect(sut.fixtures.contents.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, '3MhOCNtlpfvht75sVRn+M010hIo='));
            expect(sut.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'R1ZtmBxOXb6nyf1kdGROAuSxx5g='));
          });

        it('only the provided root directory contents (glob pattern)',
          async function () {
            options.exclude = ['!**/fixtures/*.txt'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object');
            expect(sut)
              .to.haveOwnProperty('fixtures')
              .and.that.to.haveOwnProperty('contents');
            expect(sut.fixtures.contents).not.to.haveOwnProperty('fixtures');
            expect(sut.fixtures.contents).not.to.haveOwnProperty('directory');
            expect(sut.fixtures.contents).not.to.haveOwnProperty('directory.1');
            expect(sut.fixtures.contents)
              .to.haveOwnProperty('sameContentWithFileToHash.txt')
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'l5sOr3meWkHyZWPi2Ln4GM7/lrg='));
            expect(sut.fixtures.contents)
              .to.haveOwnProperty(fileToHashFilename)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'H58mYNjbMJTkiNvvNfj2YKl3ck0='));
            expect(sut.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'nCZJGqXYUDnWzQWb5XQ6TGEVCnE='));
          });

        it('only the provided subdirectory contents (glob pattern)',
          async function () {
            options.exclude = ['!**/fixtures',
              '**/fixtures/fixtures',
              '!**/fixtures/directory',
              '!**/fixtures/directory/*.txt'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object');
            expect(sut)
              .to.haveOwnProperty('fixtures')
              .and.that.to.haveOwnProperty('contents')
              .and.that.to.haveOwnProperty('directory')
              .and.that.to.haveOwnProperty('contents');
            expect(sut.fixtures.contents).not.to.haveOwnProperty('fixtures');
            expect(sut.fixtures.contents).not.to.haveOwnProperty('directory.1');
            expect(sut.fixtures.contents).not.to.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.contents).not.to.haveOwnProperty('sameContentWithFileToHash.txt');
            expect(sut.fixtures.contents.directory.contents)
              .to.haveOwnProperty('anotherFileToHash.txt')
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'EZ2w0rsSmXBOddIoz2IoOIuxGaQ='));
            expect(sut.fixtures.contents.directory.contents)
              .to.haveOwnProperty('otherFileToHash.txt')
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'B8FJ4uKgHESSgMvJUyrj3ix2uG8='));
            expect(sut.fixtures.contents.directory.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, '2Kmnn7YpoFCNeNAAr4Xu9Eo4nLQ='));
            expect(sut.fixtures.hash)
              .and.to.satisfy((hash: string) =>
                checker(hash, utils.base64RegexPattern, 'xOC+1Z2G35an553IP1zy0A85li0='));
          });

      });

    });

  });

});
