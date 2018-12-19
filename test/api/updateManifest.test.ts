// tslint:disable only-arrow-functions
// tslint:disable no-unused-expression
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Integrity } from '../../src/app/integrity';

describe('Integrity: function \'updateManifest\' tests', function () {

  context('expects', function () {

    context('to update the manifest with the integrity object', function () {

      it('using the indentation indent',
        async function () {
          // @ts-ignore
          const writeFileStub = sinon.stub(Integrity, '_writeFile');
          // @ts-ignore
          const getManifestStub = sinon.stub(Integrity, '_getManifest')
            .resolves({ manifest: {}, indentation: { indent: '  ' } });
          await Integrity.updateManifest({});
          getManifestStub.restore();
          writeFileStub.restore();
          expect(getManifestStub.calledOnce).to.be.true;
          expect(writeFileStub.calledOnce).to.be.true;
          expect(writeFileStub.calledWith('package.json',
            '{\n  "integrity": {}\n}'))
            .to.be.true;
        });

      it('using the indentation amount',
        async function () {
          // @ts-ignore
          const writeFileStub = sinon.stub(Integrity, '_writeFile');
          // @ts-ignore
          const getManifestStub = sinon.stub(Integrity, '_getManifest')
            .resolves({ manifest: {}, indentation: { amount: 2 } });
          await Integrity.updateManifest({});
          getManifestStub.restore();
          writeFileStub.restore();
          expect(getManifestStub.calledOnce).to.be.true;
          expect(writeFileStub.calledOnce).to.be.true;
          expect(writeFileStub.calledWith('package.json',
            '{\n  "integrity": {}\n}'))
            .to.be.true;
        });

      it('replacing the existing manifest integrity property',
        async function () {
          // @ts-ignore
          const writeFileStub = sinon.stub(Integrity, '_writeFile');
          // @ts-ignore
          const getManifestStub = sinon.stub(Integrity, '_getManifest')
            .resolves({ manifest: { integrity: { hash: '' } }, indentation: { amount: 2 } });
          await Integrity.updateManifest({ hash: {} });
          getManifestStub.restore();
          writeFileStub.restore();
          expect(getManifestStub.calledOnce).to.be.true;
          expect(writeFileStub.calledOnce).to.be.true;
          expect(writeFileStub.calledWith('package.json',
            '{\n  "integrity": {\n    "hash": {}\n  }\n}'))
            .to.be.true;
        });
    });

  });

});
