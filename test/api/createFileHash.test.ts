// tslint:disable only-arrow-functions
// tslint:disable no-unused-expression
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import * as sinon from 'sinon';
import { Readable } from 'stream';
import { Integrity } from '../../src/app/integrity';

describe('IntegrityChecker: function \'createFileHash\' tests', function () {

  context('expects', function () {

    let fileToHashFilename: string;
    let integrityTestFilename: string;
    let fixturesDirPath: string;
    let fileToHashFilePath: string;
    let integrityTestFilePath: string;
    let md5HexRegexPattern: RegExp;
    let base64RegexPattern: RegExp;
    let shaHexRegexPattern: RegExp;

    before(function () {
      fileToHashFilename = 'fileToHash.txt';
      integrityTestFilename = '.integrity.json';

      md5HexRegexPattern = /^[a-f0-9]{32}$/;
      base64RegexPattern = /^(?:[A-Za-z0-9+/]{4})+(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
      shaHexRegexPattern = /^[a-f0-9]{40}$/;
    });

    beforeEach(function () {
      fixturesDirPath = path.resolve(__dirname, '../../../test/fixtures');
      fileToHashFilePath = path.resolve(fixturesDirPath, fileToHashFilename);
      integrityTestFilePath = path.resolve(fixturesDirPath, integrityTestFilename);
    });

    context('to throw an Error when', function () {

      it('the provided algorithm is not supported',
        function () {
          const cryptoOptions = { algorithm: 'md1' };
          Integrity.createFileHash(fileToHashFilePath, cryptoOptions)
            .catch(error => expect(error).to.be.an.instanceof(Error).that.matches(/ENOSUP:/));
        });

      it('the provided encoding is not supported',
        function () {
          const cryptoOptions = { encoding: 'ascii' };
          // @ts-ignore
          Integrity.createFileHash(fileToHashFilePath, cryptoOptions)
            .catch((error: any) => expect(error).to.be.an.instanceof(Error).that.matches(/ENOSUP:/));
        });

      it('the provided path is not a file',
        function () {
          Integrity.createFileHash(fixturesDirPath)
            .catch(error => expect(error).to.be.an.instanceof(Error).that.matches(/ENOTFILE:/));
        });

      it('the provided path is not allowed',
        function () {
          Integrity.createFileHash(integrityTestFilePath)
            .catch(error => expect(error).to.be.an.instanceof(Error).that.matches(/ENOTALW:/));
        });

      it('the file can not be read',
        function () {
          const createReadStreamStub = sinon.stub(fs, 'createReadStream').returns(new Readable());
          Integrity.createFileHash(fileToHashFilePath)
            .catch(error => {
              createReadStreamStub.restore();
              expect(error).to.be.an.instanceof(Error);
            });
        });

    });

    it('to return by default an \'md5\' and \'hex\' encoded hash string',
      async function () {
        const sut = await Integrity.createFileHash(fileToHashFilePath);
        expect(sut).to.be.an('object')
          .and.to.haveOwnProperty(fileToHashFilename)
          .and.to.match(md5HexRegexPattern)
          .and.to.equal('7a3d5b475bd07ae9041fab2a133f40c4');
      });

    it('to return an \'md5\' and \'bas64\' encoded hash string',
      async function () {
        const sut = await Integrity.createFileHash(fileToHashFilePath, { encoding: 'base64' });
        expect(sut).to.be.an('object')
          .and.to.haveOwnProperty(fileToHashFilename)
          .and.to.match(base64RegexPattern)
          .and.to.equal('ej1bR1vQeukEH6sqEz9AxA==');
      });

    it('to return an \'sha1\' and \'hex\' encoded hash string',
      async function () {
        const sut = await Integrity.createFileHash(fileToHashFilePath, { algorithm: 'sha1' });
        expect(sut).to.be.an('object')
          .and.to.haveOwnProperty(fileToHashFilename)
          .and.to.match(shaHexRegexPattern)
          .and.to.equal('1f9f2660d8db3094e488dbef35f8f660a977724d');
      });

    it('to return an \'sha1\' and \'base64\' encoded hash string',
      async function () {
        const sut = await Integrity.createFileHash(
          fileToHashFilePath,
          { algorithm: 'sha1', encoding: 'base64' });
        expect(sut).to.be.an('object')
          .and.to.haveOwnProperty(fileToHashFilename)
          .and.to.match(base64RegexPattern)
          .and.to.equal('H58mYNjbMJTkiNvvNfj2YKl3ck0=');
      });

  });

});
