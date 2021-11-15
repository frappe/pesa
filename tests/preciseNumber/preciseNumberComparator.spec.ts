import * as assert from 'assert';
import 'mocha';
import { Input } from '../types';
import { getPreciseNumberMaker } from '../../index';

export type Comparator = 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
export interface ComparatorTest {
  a: Input;
  b: Input;
  output: boolean;
  type: Comparator;
}

export const getVals = (
  a: Input,
  b: Input,
  output: boolean,
  type: Comparator
): ComparatorTest => ({
  a,
  b,
  output,
  type,
});

describe('PreciseNumber, Comparators', function () {
  const p = getPreciseNumberMaker(2);
  context('Low Precision', function () {
    const testThese: ComparatorTest[] = [getVals(0.1, 0.2, false, 'eq')];

    for (let { a, b, output, type } of testThese) {
      specify(`${type}: ${a}, ${b}`, () => {
        const final = p(a)[type](b);
        assert.strictEqual(final, output);
      });
    }
  });
});
