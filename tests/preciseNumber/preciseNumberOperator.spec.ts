import * as assert from 'assert';
import 'mocha';
import { Input } from '../types';
import { getPreciseNumberMaker } from '../../index';

export type Operator = 'add' | 'sub' | 'mul' | 'div';
export interface OperatorTestSingle {
  a: Input;
  b: Input;
  value: number;
  integer: bigint;
  type: Operator;
}

export const getVals = (
  a: Input,
  b: Input,
  value: number,
  integer: bigint,
  type: Operator
): OperatorTestSingle => ({ a, b, value, integer, type });

describe('PreciseNumber, Operators', function () {
  context('Low Precision, single values', function () {
    const p = getPreciseNumberMaker(2);
    const testThese: OperatorTestSingle[] = [
      getVals(0.1, 0.2, 0.3, 30n, 'add'),
    ];

    for (let { a, b, value, integer, type } of testThese) {
      specify(`${type}: ${a}, ${b}`, () => {
        const final = p(a)[type](b);
        assert.strictEqual(final.i, integer);
        assert.strictEqual(final.v, value);
      });
    }
  });
});
