/** @internal */
export interface IParsedArgs {
  algorithm: string;
  command: string;
  encoding: string;
  exclude: string[];
  inPath: string;
  integrity: string;
  manifest: boolean;
  outPath: string;
  verbose: boolean;
}
