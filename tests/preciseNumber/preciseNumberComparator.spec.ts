import * as assert from 'assert';
import 'mocha';
import { getPreciseNumberMaker } from '../../index';
import { Input } from '../types';

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
  context('Single values', function () {
    const testThese: ComparatorTest[] = [
      getVals(0.1, 0.2, false, 'eq'),
      getVals(0.1, 0.2, true, 'lt'),
      getVals(0.1, 0.2, false, 'gt'),
      getVals(0.1, 0.2, true, 'lte'),
      getVals(0.1, 0.2, false, 'gte'),
      getVals(0.2, 0.2, true, 'eq'),
      getVals(0.2, 0.2, false, 'lt'),
      getVals(0.2, 0.2, false, 'gt'),
      getVals(0.2, 0.2, true, 'lte'),
      getVals(0.2, 0.2, true, 'gte'),
      getVals(0.2, 0.1, false, 'eq'),
      getVals(0.2, 0.1, false, 'lt'),
      getVals(0.2, 0.1, true, 'gt'),
      getVals(0.2, 0.1, false, 'lte'),
      getVals(0.2, 0.1, true, 'gte'),
    ];

    for (let { a, b, output, type } of testThese) {
      specify(`${type}: ${a}, ${b}`, () => {
        const p = getPreciseNumberMaker(1);
        const result = p(a)[type](b);
        assert.strictEqual(output, result);
      });

      specify(`${type}: ${a}, ${b}`, () => {
        const p = getPreciseNumberMaker(6);
        const result = p(a)[type](b);
        assert.strictEqual(output, result);
      });
    }
  });

  context('Immutability', function () {
    context('one', function () {
      const p = getPreciseNumberMaker(6);
      const a = p(0.1);
      const b = a.add(0.2);

      specify('one.a', function () {
        assert.strictEqual(a.integer, 100000n);
        assert.strictEqual(a.value, 0.1);
        assert.strictEqual(b.integer, 300000n);
        assert.strictEqual(b.value, 0.3);
      });

      specify('one.b', function () {
        assert.strictEqual(a.eq(b), false);
        assert.strictEqual(a.lt(b), true);
        assert.strictEqual(a.gt(b), false);
        assert.strictEqual(a.lte(b), true);
        assert.strictEqual(a.gte(b), false);
      });

      specify('one.c', function () {
        assert.strictEqual(a.eq(0.1), true);
        assert.strictEqual(a.eq(p(0.1)), true);
        assert.strictEqual(b.eq(0.3), true);
        assert.strictEqual(b.eq(p(0.3)), true);
      });
    });

    context('two', function () {
      const p = getPreciseNumberMaker(6);
      const a = p(0.1).mul(0.1).div(2);
      const b = a.add(0.2);

      specify('one.a', function () {
        assert.strictEqual(a.integer, 5000n);
        assert.strictEqual(a.value, 0.005);
        assert.strictEqual(b.integer, 205000n);
        assert.strictEqual(b.value, 0.205);
      });

      specify('one.b', function () {
        assert.strictEqual(a.eq(b), false);
        assert.strictEqual(a.lt(b), true);
        assert.strictEqual(a.gt(b), false);
        assert.strictEqual(a.lte(b), true);
        assert.strictEqual(a.gte(b), false);
      });

      specify('one.c', function () {
        assert.strictEqual(a.eq(0.005), true);
        assert.strictEqual(a.eq(p(0.005)), true);
        assert.strictEqual(b.eq(0.205), true);
        assert.strictEqual(b.eq(p(0.205)), true);
      });
    });
  });

  describe('checks', function () {
    const p = getPreciseNumberMaker();
    specify('isZero', function () {
      assert.strictEqual(p(0).isZero(), true);
      assert.strictEqual(p(220).sub(220).isZero(), true);
      assert.strictEqual(p(220).mul(0).isZero(), true);
      assert.strictEqual(p(0).mul(20).isZero(), true);
    });

    specify('isPositive', function () {
      assert.strictEqual(p(0).isPositive(), false);
      assert.strictEqual(p(1).isPositive(), true);
      assert.strictEqual(p(220).sub(219).isPositive(), true);
      assert.strictEqual(p(220).mul(0.000001).isPositive(), true);
      assert.strictEqual(p(0).mul(20).isPositive(), false);
    });

    specify('isNegative', function () {
      assert.strictEqual(p(0).isNegative(), false);
      assert.strictEqual(p(-1).isNegative(), true);
      assert.strictEqual(p(220).sub(221).isNegative(), true);
      assert.strictEqual(p(220).mul(-0.000001).isNegative(), true);
      assert.strictEqual(p(-0).mul(20).isNegative(), false);
      assert.strictEqual(p(-0).mul(-20).isNegative(), false);
    });
  });
});
