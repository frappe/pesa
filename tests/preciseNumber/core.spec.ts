import * as assert from 'assert';
import 'mocha';
import {
  getIsInputValid,
  scaler,
  ScalerInput,
  toDecimalString,
} from '../../src/utils';

describe('Core functions', function () {
  describe('scaler', function () {
    const testThese = [
      ['.2', 0, 0n],
      ['.2', 1, 2n],
      ['22.2', 2, 2220n],
      ['22.2', 0, 22n],
      ['55.555', 2, 5556n],
      ['55.555', 6, 55555000n],
      ['-55.555', 6, -55555000n],
      ['2.555', 2, 256n],
      ['-2.555', 2, -256n],
      ['1.9999999999999999999999999999', 2, 200n],
      ['-1.9999999999999999999999999999', 2, -200n],
      ['1.9999999999999999999999999999', 27, 2000000000000000000000000000n],
      ['-1.9999999999999999999999999999', 27, -2000000000000000000000000000n],
      ['1.9999999999999999999999999999', 28, 19999999999999999999999999999n],
      ['-1.9999999999999999999999999999', 28, -19999999999999999999999999999n],
      ['1.9999999999999999999999999999', 30, 1999999999999999999999999999900n],
      ['-1.999999999999999999999999999', 29, -199999999999999999999999999900n],
      [22, 0, 22n],
      [-22, 0, -22n],
      [22.555, 0, 23n],
      [-22.555, 0, -23n],
      [22.555, 2, 2256n],
      [-22.555, 2, -2256n],
    ];

    for (let [input, precision, output] of testThese) {
      const scalerOutput = scaler(input as ScalerInput, precision as number);

      specify(`input: ${input}`, function () {
        assert.strictEqual(scalerOutput, output);
      });
    }
  });

  describe('getIsInputValid', function () {
    const testThese = [
      [0.22, true],
      [22, true],
      ['22.222', true],
      ['.22', true],
      ['22.', true],
      ['.', false],
      ['22.22.22', false],
      ['22,22,22', false],
      ['22_22_22', false],
    ];

    for (let [input, expectedIsValid] of testThese) {
      const isValid = getIsInputValid(input.toString());

      specify(`input: ${input}`, function () {
        assert.equal(expectedIsValid, isValid);
      });
    }
  });

  describe('toDecimalString', function () {
    const testThese = [
      [0n, 5, '0'],
      [1n, 1, '0.1'],
      [-1n, 1, '-0.1'],
      [100n, 3, '0.1'],
      [-100n, 3, '-0.1'],
      [22n, 0, '22'],
      [-22n, 0, '-22'],
      [22n, 1, '2.2'],
      [-22n, 1, '-2.2'],
      [22n, 2, '0.22'],
      [-22n, 2, '-0.22'],
      [22n, 3, '0.022'],
      [-22n, 3, '-0.022'],
      [222000n, 3, '222'],
      [-222000n, 3, '-222'],
      [222100n, 3, '222.1'],
      [-222100n, 3, '-222.1'],
    ];

    for (let [value, precision, expectedDecimalString] of testThese) {
      const decimalString = toDecimalString(
        value as bigint,
        precision as number
      );

      specify(`input: ${value}, ${precision}`, function () {
        assert.equal(expectedDecimalString, decimalString);
      });
    }
  });
});
