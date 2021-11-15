import * as assert from 'assert';
import 'mocha';
import { Input } from '../types';
import { p } from '../../index';

export interface MakerTest {
  input: Input;
  precision: number;
  value: number;
  integer: bigint;
}

export const getVals = (
  input: Input,
  precision: number,
  value: number,
  integer: bigint
): MakerTest => ({
  input,
  precision,
  value,
  integer,
});

describe('PreciseNumber, Maker', function () {
  const testThese = [getVals(2.555, 2, 2.56, 256n)];
  for (let test of testThese) {
    const { input, precision, value, integer } = test;
    specify(`input: ${input}`, function () {
      const pn = p(input, precision);
      assert.strictEqual(pn.v, value);
      assert.strictEqual(pn.i, integer);
    });
  }
});
