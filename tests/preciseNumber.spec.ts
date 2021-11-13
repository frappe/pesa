import { p } from '../index';
import * as assert from 'assert';
import 'mocha';

describe('PreciseNumber', function () {
  describe('PreciseNumber Defaults', function () {
    it('test default precisionsum', () => {
      const final = p(0.1).add(0.2);

      assert.strictEqual(final.i, 300000n);
      assert.strictEqual(final.v, 0.3);
    });
  });
});
