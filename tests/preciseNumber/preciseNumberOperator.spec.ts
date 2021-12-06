import * as assert from 'assert';
import 'mocha';
import { getPreciseNumberMaker } from '../../index';
import { Input } from '../types';

export type Operator = 'add' | 'sub' | 'mul' | 'div';
export interface OperatorTestSingle {
  a: Input;
  b: Input;
  value: number;
  integer: bigint;
  type: Operator;
  precision: number;
}

export const getVals = (
  a: Input,
  b: Input,
  value: number,
  integer: bigint,
  type: Operator,
  precision: number
): OperatorTestSingle => ({ a, b, value, integer, type, precision });

describe('PreciseNumber, Operators', function () {
  context('Single values', function () {
    const testThese: OperatorTestSingle[] = [
      getVals(0.1, 0.2, 0.3, 30n, 'add', 2),
      getVals(0.1, 0.2, -0.1, -10n, 'sub', 2),
      getVals(0.1, -0.2, -0.1, -10n, 'add', 2),
      getVals(55.55, 0.2, 55.35, 5535n, 'sub', 2),
      getVals(55.55, -0.2, 55.35, 5535n, 'add', 2),
      getVals(-55.55, 0.2, -55.75, -5575n, 'sub', 2),
      getVals(-55.55, -0.2, -55.75, -5575n, 'add', 2),
      getVals(0.555, 0.001, 0.56, 56n, 'add', 2),
      getVals(0.555, 0.001, 0.56, 56n, 'sub', 2),
      getVals(0.555, 0.001, 0.554, 554n, 'sub', 3),
      getVals(0.555, 0.001, 0.554, 5540n, 'sub', 4),
      getVals(0.555, -0.001, 0.56, 56n, 'add', 2),
      getVals(0, -0.001, 0, 0n, 'add', 2),
      getVals(0, -0.01, -0.01, -1n, 'add', 2),
      getVals(1, 1, 1, 100n, 'mul', 2),
      getVals(1.1, 1, 1.1, 110n, 'mul', 2),
      getVals(1.1, 0.55, 0.61, 61n, 'mul', 2),
      getVals(1.1, 0.54, 0.59, 59n, 'mul', 2),
      getVals(1.1, 0.54, 0.594, 594n, 'mul', 3),
      getVals(1.1, 0.55, 0.605, 605n, 'mul', 3),
      getVals(3.3, 3.3, 10.89, 1089n, 'mul', 2),
      getVals(3.3, 3.3, 10.89, 10890n, 'mul', 3),
      getVals(55, 2, 27.5, 2750n, 'div', 2),
      getVals(5.5, 2, 2.75, 275n, 'div', 2),
      getVals(Math.PI, Math.E, 9, 9n, 'mul', 0),
      getVals(Math.PI, Math.E, 8.4, 84n, 'mul', 1),
      getVals(Math.PI, Math.E, 8.54, 854n, 'mul', 2),
      getVals(Math.PI, Math.E, 8.54, 8540n, 'mul', 3),
      getVals(Math.PI, Math.E, 8.539734222673566, 8539734222673566n, 'mul', 15),
    ];

    for (let { a, b, value, integer, type, precision } of testThese) {
      const p = getPreciseNumberMaker(precision);
      specify(`${type}: ${a}, ${b}`, () => {
        const final = p(a)[type](b);
        assert.strictEqual(final.i, integer);
        assert.strictEqual(final.v, value);
      });
    }
  });

  context('Checking immutability', function () {
    const precision = 6;
    const p = getPreciseNumberMaker(precision);
    const number = p(100.0);
    const result = number.add(22).sub(33).mul(100).div(5);

    specify('checking initial', function () {
      assert.strictEqual(number.i, 100000000n);
      assert.strictEqual(number.v, 100);
      assert.strictEqual(number.precision, precision);
    });

    specify('checking result', function () {
      assert.strictEqual(result.i, 1780000000n);
      assert.strictEqual(result.v, 1780);
      assert.strictEqual(result.precision, precision);
    });
  });
});
