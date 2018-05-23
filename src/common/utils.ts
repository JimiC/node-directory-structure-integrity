import path from 'path';
import { IndexedObject } from '../interfaces/indexedObject';

/** @internal */
export function getAbsolutePath(array: string[], index: number): string {
  const root = process.platform !== 'win32' && array[0] !== '/' ? '/' : '';
  return path.posix.join(root, ...array.slice(0, index + 1));
}

/** @internal */
export function parseJSON(data: string | Buffer): IndexedObject | null {
  try {
    const text = Buffer.isBuffer(data) ? data.toString() : data as string;
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

/** @internal */
export function sortObject(obj: IndexedObject): IndexedObject {
  return Object.keys(obj)
    .sort()
    .reduce((p: IndexedObject, c: string) => {
      p[c] = obj[c];
      return p;
    }, {});
}

/** @internal */
export async function asyncForEach(array: any[], callback: (...args: any[]) => any): Promise<void> {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

/** @internal */
export const promisifyArgumentNames = Symbol('__CUSTOM-ARGUMENTS__');

/** @internal */
export function promisify<T>(func: (...args: any[]) => any): (...args: any[]) => Promise<T> {
  if (!(typeof func === 'function')) {
    throw new TypeError('Argument to promisify must be a function');
  }
  const argumentNames = (func as IndexedObject)[promisifyArgumentNames];
  return (...args: any[]) => {
    return new Promise((res, rej) => {
      const cb = (err: any, ...values: any[]) => {
        if (err instanceof Error) { return rej(err); }
        if (typeof err === 'boolean') { values = [err, ...values]; }
        if (values.length === 1 || !argumentNames) { return res(values[0]); }
        const obj: IndexedObject = {};
        values.forEach((value, index) => {
          const name = argumentNames[index];
          if (name) { obj[name] = value; }
        });
        res(obj as T);
      };
      args.push(cb);
      func(...args);
    });
  };
}
