import * as assert from 'assert';
import 'mocha';
import { Input } from '../types';
import { p } from '../../index';
import { MIN_PREC, DEF_PREC, MAX_PREC } from '../../src/consts';

interface Test {
  input: Input;
  precision: number;
  value: number;
  integer: bigint;
}

interface InvalidTest {
  input: Input;
  precision: number;
}

const getVals = (
  input: Input,
  precision: number,
  value: number,
  integer: bigint
): Test => ({
  input,
  precision,
  value,
  integer,
});

const getInvalidVals = (input: Input, precision: number): InvalidTest => ({
  input,
  precision,
});

describe('PreciseNumber, Maker', function () {
  context('valid inputs', function () {
    const testThese = [
      getVals(-0, 10, 0, 0n),
      getVals(2.555, 0, 3, 3n),
      getVals(-2.555, 0, -3, -3n),
      getVals(2.555, 2, 2.56, 256n),
      getVals(-2.555, 2, -2.56, -256n),
      getVals(2.555, 11, 2.555, 255500000000n),
      getVals(-2.555, 11, -2.555, -255500000000n),
      getVals('.555', 0, 1, 1n),
      getVals('-.555', 0, -1, -1n),
      getVals('.455', 0, 0, 0n),
      getVals('-.455', 0, 0, 0n),
      getVals('0', 10, 0, 0n),
      getVals('-0', 10, 0, 0n),
      getVals('0.1', 10, 0.1, 1000000000n),
      getVals('2.555', 0, 3, 3n),
      getVals('-2.555', 0, -3, -3n),
      getVals('2.555', 2, 2.56, 256n),
      getVals('-2.555', 2, -2.56, -256n),
      getVals('2.555', 11, 2.555, 255500000000n),
      getVals('-2.555', 11, -2.555, -255500000000n),
      getVals('-0.000001', 20, -0.000001, -100000000000000n),
      getVals('200', 3, 200, 200000n),
      getVals('00200', 3, 200, 200000n),
      getVals('.00200', 3, 0.002, 2n),
      getVals(-0.002, 3, -0.002, -2n),
      getVals('-00.002', 3, -0.002, -2n),
    ];

    for (let test of testThese) {
      const { input, precision, value, integer } = test;

      specify(`input: ${input}`, function () {
        const pn = p(input, precision);
        assert.strictEqual(pn.v, value);
        assert.strictEqual(pn.i, integer);
      });
    }
  });

  context('invalid inputs', function () {
    const testThese = [
      getInvalidVals(2.5, MIN_PREC - 1),
      getInvalidVals(2.5, MAX_PREC + 1),
      getInvalidVals('', DEF_PREC),
      getInvalidVals('.', DEF_PREC),
      getInvalidVals('2.555.5', DEF_PREC),
      getInvalidVals('.555.5', DEF_PREC),
      getInvalidVals('1,000,000.000', DEF_PREC),
      getInvalidVals('1_000_000.000', DEF_PREC),
    ];
    for (let test of testThese) {
      const { input, precision } = test;

      specify(`input: ${input}`, function () {
        assert.throws(() => {
          p(input, precision);
        });
      });
    }
  });
});
