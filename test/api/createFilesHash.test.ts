// tslint:disable only-arrow-functions
// tslint:disable no-unused-expression
import { expect } from 'chai';
import path from 'path';
import { Integrity } from '../../src/app/integrity';
import * as utils from '../../src/common/utils';

describe('IntegrityChecker: function \'createFilesHash\' tests', function () {

  context('expects', function () {

    let anotherFileToHashFilename: string;
    let otherFileToHashFilename: string;
    let fileToHashFilename: string;
    let directoryDirPath: string;
    let fixturesDirPath: string;
    let anotherFileToHashFilePath: string;
    let otherFileToHashFilePath: string;
    let fileToHashFilePath: string;
    let md5Length: number;
    let sha1Length: number;

    before(function () {
      anotherFileToHashFilename = 'anotherFileToHash.txt';
      otherFileToHashFilename = 'otherFileToHash.txt';
      fileToHashFilename = 'fileToHash.txt';

      md5Length = 32;
      sha1Length = 40;
    });

    beforeEach(function () {
      fixturesDirPath = path.resolve(__dirname, '../../../test/fixtures');
      directoryDirPath = path.resolve(fixturesDirPath, 'directory');
      anotherFileToHashFilePath = path.resolve(directoryDirPath, anotherFileToHashFilename);
      otherFileToHashFilePath = path.resolve(directoryDirPath, otherFileToHashFilename);
      fileToHashFilePath = path.resolve(fixturesDirPath, fileToHashFilename);
    });

    context('to throw an Error when', function () {

      it('the provided algorithm is not supported',
        function () {
          const cryptoOptions = { algorithm: 'md1' };
          Integrity.createFilesHash([fileToHashFilePath], cryptoOptions)
            .catch(error => expect(error).to.be.an.instanceof(Error).that.matches(/ENOSUP:/));
        });

      it('the provided encoding is not supported',
        function () {
          const cryptoOptions = { encoding: 'ascii' };
          // @ts-ignore
          Integrity.createFilesHash([fileToHashFilePath], cryptoOptions)
            .catch((error: any) => expect(error).to.be.an.instanceof(Error).that.matches(/ENOSUP:/));
        });

    });

    it('to return by default an \'md5\' and \'hex\' encoded hash JSON',
      async function () {
        const files = [anotherFileToHashFilePath, otherFileToHashFilePath];
        const sut = await Integrity.createFilesHash(files);
        expect(sut).to.be.an('object');
        expect(sut).to.haveOwnProperty(anotherFileToHashFilename)
        .and.that.to.match(utils.hexRegexPattern)
        .and.that.to.have.lengthOf(md5Length)
        .and.to.equal('e85c09015e3adbd3b672197d65b0e011');
        expect(sut).to.haveOwnProperty(otherFileToHashFilename)
        .and.that.to.match(utils.hexRegexPattern)
        .and.that.to.have.lengthOf(md5Length)
        .and.to.equal('aab25b0f1789fe88955cee6d2370e7b7');
      });

    it('to return an \'md5\' and \'base64\' encoded hash JSON',
      async function () {
        const files = [anotherFileToHashFilePath, otherFileToHashFilePath];
        const sut = await Integrity.createFilesHash(files, { encoding: 'base64' });
        expect(sut).to.be.an('object');
        expect(sut).to.haveOwnProperty(anotherFileToHashFilename)
          .and.match(utils.base64RegexPattern)
          .and.to.equal('6FwJAV4629O2chl9ZbDgEQ==');
        expect(sut).to.haveOwnProperty(otherFileToHashFilename)
          .and.match(utils.base64RegexPattern)
          .and.to.equal('qrJbDxeJ/oiVXO5tI3Dntw==');
      });

    it('to return an \'sha1\' and \'hex\' encoded hash JSON',
      async function () {
        const files = [anotherFileToHashFilePath, otherFileToHashFilePath];
        const sut = await Integrity.createFilesHash(files, { algorithm: 'sha1' });
        expect(sut).to.be.an('object');
        expect(sut).to.haveOwnProperty(anotherFileToHashFilename)
        .and.to.match(utils.hexRegexPattern)
        .and.that.to.have.lengthOf(sha1Length)
        .and.to.equal('119db0d2bb1299704e75d228cf6228388bb119a4');
        expect(sut).to.haveOwnProperty(otherFileToHashFilename)
        .and.to.match(utils.hexRegexPattern)
        .and.that.to.have.lengthOf(sha1Length)
        .and.to.equal('07c149e2e2a01c449280cbc9532ae3de2c76b86f');
      });

    it('to return an \'sha1\' and \'base64\' encoded hash JSON',
      async function () {
        const files = [anotherFileToHashFilePath, otherFileToHashFilePath];
        const sut = await Integrity.createFilesHash(files, { algorithm: 'sha1', encoding: 'base64' });
        expect(sut).to.be.an('object');
        expect(sut).to.haveOwnProperty(anotherFileToHashFilename)
          .and.match(utils.base64RegexPattern)
          .and.to.equal('EZ2w0rsSmXBOddIoz2IoOIuxGaQ=');
        expect(sut).to.haveOwnProperty(otherFileToHashFilename)
          .and.match(utils.base64RegexPattern)
          .and.to.equal('B8FJ4uKgHESSgMvJUyrj3ix2uG8=');
      });

  });

});
