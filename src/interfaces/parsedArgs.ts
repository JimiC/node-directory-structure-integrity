/** @internal */
export interface IParsedArgs {
  algorithm: string;
  command: string;
  encoding: string;
  exclude: string[];
  inPath: string;
  integrity: string;
  outPath: string;
  verbose: boolean;
}
