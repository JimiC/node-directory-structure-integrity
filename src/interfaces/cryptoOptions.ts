import { HexBase64Latin1Encoding } from 'crypto';

export interface ICryptoOptions {
  algorithm?: string;
  encoding?: HexBase64Latin1Encoding;
}
