import { HexBase64Latin1Encoding } from 'crypto';

/** @internal */
export interface INormalizedCryptoOptions {
  algorithm: string;
  encoding: HexBase64Latin1Encoding;
}
