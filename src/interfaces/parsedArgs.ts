/** @internal */
export interface IParsedArgs {
  command: string;
  algorithm: string;
  encoding: string;
  exclude: string[];
  inPath: string;
  integrity: string;
  outPath: string;
  verbose: boolean;
}
