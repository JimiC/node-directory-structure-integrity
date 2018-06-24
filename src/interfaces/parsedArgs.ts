/** @internal */
export interface IParsedArgs {
  algorithm: string;
  command: string;
  detect: boolean;
  encoding: string;
  exclude: string[];
  inPath: string;
  integrity: string;
  outPath: string;
  verbose: boolean;
}
