import { HexBase64Latin1Encoding } from 'crypto';
import { Integrity } from '../app/integrity';
import { Logger } from '../common/logger';
import { YargsParser } from '../common/yargsParser';
import { IntegrityOptions } from '../interfaces/integrityOptions';
import { ISpinner } from '../interfaces/spinner';

/** @internal */
export = (async (): Promise<void> => {
  const id = 'ndsi';
  const logger = new Logger();
  const pargs = new YargsParser().parse();
  const options: IntegrityOptions = {
    cryptoOptions: {
      algorithm: pargs.algorithm,
      encoding: pargs.encoding as HexBase64Latin1Encoding,
    },
    exclude: pargs.exclude,
    verbose: pargs.verbose,
  };
  logger.eventEmitter.on('SIGINT', () => logger.handleForcedExit(!!logger));
  let spinner: ISpinner = { timer: setImmediate(() => void 0), line: 1 };
  let message = '';
  try {
    if (pargs.command === 'create') {
      spinner = logger.spinnerLogStart('Creating integrity hash file', id);
      const hash = await Integrity.create(pargs.inPath, options);
      await Integrity.persist(hash, pargs.outPath);
      message = 'Integrity hash file created';
    }
    if (pargs.command === 'check') {
      spinner = logger.spinnerLogStart(`Checking integrity of: '${pargs.inPath}'`, id);
      const passed = await Integrity.check(pargs.inPath, pargs.integrity, options, pargs.detect);
      message = passed ? 'Integrity validated' : 'Integrity failed';
    }
    logger.spinnerLogStop(spinner, message, id);
  } catch (error) {
    logger.spinnerLogStop(spinner, `Failed to ${pargs.command} integrity hash file`, id);
    logger.updateLog(`Error: ${error.message || error}`);
  } finally {
    process.exit();
  }
});
