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
          const createReadStreamStub = sinon.stub(fs, 'createReadStream').returns(new Readable());
          Integrity.createDirHash(fixturesDirPath, options)
            .catch(error => {
              createReadStreamStub.restore();
              expect(error).to.be.an.instanceof(Error);
            });
        });

    });

    it('to return by default an \'md5\' and \'hex\' encoded hash string',
      async function () {
        options.verbose = false;
        const sut = await Integrity.createDirHash(fixturesDirPath, options);
        expect(sut).to.be.an('object')
          .and.to.haveOwnProperty('fixtures')
          .and.that.to.match(utils.hexRegexPattern)
          .and.that.to.have.lengthOf(md5Length)
          .that.equals('03a3d76b2c52d62ce63502b85100575f');
      });

    it('to return an \'md5\' and \'base64\' encoded hash string',
      async function () {
        options.cryptoOptions = { encoding: 'base64' };
        options.verbose = false;
        const sut = await Integrity.createDirHash(fixturesDirPath, options);
        expect(sut).to.be.an('object')
          .and.to.haveOwnProperty('fixtures')
          .and.to.match(utils.base64RegexPattern)
          .and.to.equal('A6PXayxS1izmNQK4UQBXXw==');
      });

    it('to return an \'md5\' and \'latin1\' encoded hash string',
      async function () {
        options.cryptoOptions = { encoding: 'latin1' };
        options.verbose = false;
        const sut = await Integrity.createDirHash(fixturesDirPath, options);
        expect(sut).to.be.an('object')
          .and.to.haveOwnProperty('fixtures')
          .and.to.match(utils.latin1RegexPattern)
          .and.to.equal('\u0003£×k,RÖ,æ5\u0002¸Q\u0000W_');
      });

    it('to return an \'sha1\' and \'hex\' encoded hash string',
      async function () {
        options.cryptoOptions = { algorithm: 'sha1' };
        options.verbose = false;
        const sut = await Integrity.createDirHash(fixturesDirPath, options);
        expect(sut).to.be.an('object')
          .and.to.haveOwnProperty('fixtures')
          .and.to.match(utils.hexRegexPattern)
          .and.that.to.have.lengthOf(sha1Length)
          .and.to.equal('0c88c73811cc9efa49c4ce289e4c6f5db99c74c1');
      });

    it('to return an \'sha1\' and \'base64\' encoded hash string',
      async function () {
        options.cryptoOptions = { algorithm: 'sha1', encoding: 'base64' };
        options.verbose = false;
        const sut = await Integrity.createDirHash(fixturesDirPath, options);
        expect(sut).to.be.an('object')
          .and.to.haveOwnProperty('fixtures')
          .and.to.match(utils.base64RegexPattern)
          .and.to.equal('DIjHOBHMnvpJxM4onkxvXbmcdME=');
      });

    context('to verbosely compute a hash JSON', function () {

      it('with \'md5\' and \'hex\' encoding by default',
        async function () {
          const sut = await Integrity.createDirHash(fixturesDirPath, options);
          expect(sut).to.be.an('object')
            .and.to.haveOwnProperty('fixtures')
            .and.that.to.haveOwnProperty('contents')
            .and.that.to.haveOwnProperty(fileToHashFilename)
            .and.that.to.have.lengthOf(md5Length)
            .that.equals('7a3d5b475bd07ae9041fab2a133f40c4');
        });

      it('with \'md5\' and \'base64\' encoding',
        async function () {
          options.cryptoOptions = { encoding: 'base64' };
          const sut = await Integrity.createDirHash(fixturesDirPath, options);
          expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
          expect(sut.fixtures).to.haveOwnProperty('contents');
          expect(sut.fixtures.contents).to.haveOwnProperty(fileToHashFilename)
            .and.to.match(utils.base64RegexPattern)
            .and.to.equal('ej1bR1vQeukEH6sqEz9AxA==');
        });

      it('with \'sha1\' and \'hex\' encoding',
        async function () {
          options.cryptoOptions = { algorithm: 'sha1' };
          const sut = await Integrity.createDirHash(fixturesDirPath, options);
          expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
          expect(sut.fixtures).to.haveOwnProperty('contents');
          expect(sut.fixtures.contents).to.haveOwnProperty(fileToHashFilename)
          .and.to.match(utils.hexRegexPattern)
          .and.that.to.have.lengthOf(sha1Length)
            .and.to.equal('1f9f2660d8db3094e488dbef35f8f660a977724d');
        });

      it('with \'sha1\' and \'base64\' encoding',
        async function () {
          options.cryptoOptions = { algorithm: 'sha1', encoding: 'base64' };
          const sut = await Integrity.createDirHash(fixturesDirPath, options);
          expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
          expect(sut.fixtures).to.haveOwnProperty('contents');
          expect(sut.fixtures.contents).to.haveOwnProperty(fileToHashFilename)
            .and.match(utils.base64RegexPattern)
            .and.to.equal('H58mYNjbMJTkiNvvNfj2YKl3ck0=');
        });

    });

    context('to exclude', function () {

      context('in non-verbosely computation', function () {

        it('the provided file',
          async function () {
            options.exclude = [fileToHashFilename];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('5a4f9a039bd6b00443651ee9a9ddf582');
          });

        it('the provided file (glob pattern)',
          async function () {
            options.exclude = ['**/fileToHash.txt'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('5a4f9a039bd6b00443651ee9a9ddf582');
          });

        it('the provided files',
          async function () {
            options.exclude = [fileToHashFilename, otherFileToHashFilename];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('cdda64b8fe31306c04ec09931706ea0d');
          });

        it('the provided files (glob pattern)',
          async function () {
            options.exclude = ['**/fileToHash.txt', '**/otherFileToHash.txt'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('cdda64b8fe31306c04ec09931706ea0d');
          });

        it('the provided files (glob pattern)',
          async function () {
            options.exclude = ['**/*.txt'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('610bfceef8f72601feec790a348f7114');
          });

        it('the provided files (glob pattern)',
          async function () {
            options.exclude = ['**/*.*'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('9280fda719b7e4a6872c7fbbea5486d9');
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
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('9403e5114acb6bb59791a97291be54b5');
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
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('f4af5417a926d36fba8727d300da9e9d');
          });

        it('the provided subdirectory (glob pattern)',
          async function () {
            options.exclude = ['**/directory'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('f4af5417a926d36fba8727d300da9e9d');
          });

        it('the provided subdirectory (glob pattern)',
          async function () {
            options.exclude = ['**/directory/**'];
            options.verbose = false;
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('ca9e071a1c25831012e95935a23bd06a');
          });

      });

      context('in verbosely computation', function () {

        it('the provided file',
          async function () {
            options.exclude = [fileToHashFilename];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.contents.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.hash)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('5a4f9a039bd6b00443651ee9a9ddf582');
          });

        it('the provided file (glob pattern)',
          async function () {
            options.exclude = ['**/fileToHash.txt'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.contents.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.hash)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('5a4f9a039bd6b00443651ee9a9ddf582');
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
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('cdda64b8fe31306c04ec09931706ea0d');
          });

        it('the provided files (glob pattern)',
          async function () {
            options.exclude = ['**/fileToHash.txt', '**/otherFileToHash.txt'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.contents.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.hash)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('cdda64b8fe31306c04ec09931706ea0d');
          });

        it('the provided \'txt\' files (glob pattern)',
          async function () {
            options.exclude = ['**/*.txt'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.contents.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.hash)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('610bfceef8f72601feec790a348f7114');
          });

        it('all files (glob pattern)',
          async function () {
            options.exclude = ['**/*.*'];
            const sut = await Integrity.createDirHash(fixturesDirPath, options);
            expect(sut).to.be.an('object').and.to.haveOwnProperty('fixtures');
            expect(sut.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.contents.fixtures.contents).to.not.haveOwnProperty(fileToHashFilename);
            expect(sut.fixtures.hash)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('9280fda719b7e4a6872c7fbbea5486d9');
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
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('9403e5114acb6bb59791a97291be54b5');
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
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('f4af5417a926d36fba8727d300da9e9d');
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
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('f4af5417a926d36fba8727d300da9e9d');
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
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .and.to.equal('ca9e071a1c25831012e95935a23bd06a');
          });

      });

    });

    context('to include', function () {

      context('in verbosely computation', function () {

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
              .and.that.and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .that.equals('9fd7c786e27af1eac638d0747a9ed79f');
            expect(sut.fixtures.contents)
              .to.haveOwnProperty(fileToHashFilename)
              .and.and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .that.equals('7a3d5b475bd07ae9041fab2a133f40c4');
            expect(sut.fixtures.contents.fixtures.hash)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .that.equals('56fd9124ef32cf7adb1efc1b6004100c');
            expect(sut.fixtures.hash)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .that.equals('52c6eb3eb784f751328e07573a915d0b');
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
              .and.that.and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .that.equals('7a3d5b475bd07ae9041fab2a133f40c4');
            expect(sut.fixtures.hash)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .that.equals('bc1cfe46a39ca0ad6d770bd9cb6838df');
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
              .and.that.and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .that.equals('9fd7c786e27af1eac638d0747a9ed79f');
            expect(sut.fixtures.contents.fixtures.hash)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .that.equals('56fd9124ef32cf7adb1efc1b6004100c');
            expect(sut.fixtures.hash)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .that.equals('e9ab888d98ae29afb56bb79b3a776570');
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
              .and.that.and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .that.equals('a19172a03c5222a9eff8245d9d770db8');
            expect(sut.fixtures.contents)
              .to.haveOwnProperty(fileToHashFilename)
              .and.that.and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .that.equals('7a3d5b475bd07ae9041fab2a133f40c4');
            expect(sut.fixtures.hash)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .that.equals('685f980be84daee8248c883515c81864');
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
              .and.that.and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .that.equals('e85c09015e3adbd3b672197d65b0e011');
            expect(sut.fixtures.contents.directory.contents)
              .to.haveOwnProperty('otherFileToHash.txt')
              .and.that.and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .that.equals('aab25b0f1789fe88955cee6d2370e7b7');
            expect(sut.fixtures.contents.directory.hash)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .that.equals('b5d58874a8e6c2b2d6a1f179b4ee7d0f');
            expect(sut.fixtures.hash)
              .and.that.to.have.lengthOf(md5Length)
              .and.that.to.match(utils.hexRegexPattern)
              .that.equals('15fb36230f8b53646d15fb265abdf333');
          });

      });

    });

  });

});
