// tslint:disable only-arrow-functions
// tslint:disable no-unused-expression
import { expect } from 'chai';
import path from 'path';
import * as sinon from 'sinon';
import { Integrity } from '../../src/app/integrity';

describe('IntegrityChecker: function \'persist\' tests', function () {

  context('expects', function () {

    let integrityTestFilename: string;
    let fixturesDirPath: string;

    before(function () {
      integrityTestFilename = '.integrity.json';
    });

    beforeEach(function () {
      fixturesDirPath = path.resolve(__dirname, '../../../test/fixtures');
    });

    context('to persist the created hash file ', function () {

      it('on the provided path',
        async function () {
          // @ts-ignore
          const writeFileStub = sinon.stub(Integrity, '_writeFile');
          await Integrity.persist({}, fixturesDirPath);
          const dirPath = path.resolve(fixturesDirPath, integrityTestFilename);
          writeFileStub.restore();
          expect(writeFileStub.called).to.be.true;
          expect(writeFileStub.calledWith(dirPath)).to.be.true;
        });

      it('on the default path',
        async function () {
          // @ts-ignore
          const writeFileStub = sinon.stub(Integrity, '_writeFile');
          await Integrity.persist({});
          const dirPath = path.resolve('./', integrityTestFilename);
          writeFileStub.restore();
          expect(writeFileStub.called).to.be.true;
          expect(writeFileStub.calledWith(dirPath)).to.be.true;
        });

    });

  });

});
