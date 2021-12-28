import * as assert from 'assert';
import 'mocha';
import { pesa } from '../../index';

describe('Money', function () {
  describe('currency', function () {
    specify('string input', function () {
      assert.strictEqual(pesa(200, 'USD').getCurrency(), 'USD');
      assert.strictEqual(pesa(200).currency('USD').getCurrency(), 'USD');
      assert.throws(function () {
        pesa(200, 'usd');
      });
      assert.throws(function () {
        pesa(200).currency('usd');
      });
    });
  });

  describe('rate', function () {
    specify('rate, string input', function () {
      const rate = 75;
      const money = pesa(200, 'USD').rate('INR', rate);
      assert.strictEqual(money.hasConversionRate('INR'), true);
      assert.strictEqual(money.to('INR').hasConversionRate('USD'), true);
      assert.strictEqual(money.getConversionRate('USD', 'INR'), rate);
      assert.strictEqual(money.getConversionRate('INR', 'USD'), 1 / rate);
      assert.strictEqual(money.to('INR').float, 15000);
      assert.strictEqual(money.to('INR').to('USD').float, 199.995);
      assert.strictEqual(money.to('INR').to('USD').round(2), '200.00');
    });

    specify('rate, RateSetting input', function () {
      const rate = 75;
      const money = pesa(200, 'USD').rate({ from: 'USD', to: 'INR', rate });
      assert.strictEqual(money.hasConversionRate('INR'), true);
      assert.strictEqual(money.to('INR').hasConversionRate('USD'), true);
      assert.strictEqual(money.getConversionRate('USD', 'INR'), rate);
      assert.strictEqual(money.getConversionRate('INR', 'USD'), 1 / rate);
      assert.strictEqual(money.to('INR').float, 15000);
      assert.strictEqual(money.to('INR').to('USD').float, 199.995);
      assert.strictEqual(money.to('INR').to('USD').round(2), '200.00');
    });

    specify('rate, RateSetting input', function () {
      const rates = [75, 0.013];
      const money = pesa(200, 'USD').rate([
        { from: 'USD', to: 'INR', rate: rates[0] },
        { from: 'INR', to: 'USD', rate: rates[1] },
      ]);
      assert.strictEqual(money.hasConversionRate('INR'), true);
      assert.strictEqual(money.to('INR').hasConversionRate('USD'), true);
      assert.strictEqual(money.getConversionRate('USD', 'INR'), rates[0]);
      assert.strictEqual(money.getConversionRate('INR', 'USD'), rates[1]);
      assert.strictEqual(money.to('INR').float, 15000);
      assert.strictEqual(money.to('INR').to('USD').float, 195);
    });
  });

  describe('copy', function () {
    const money = pesa(200, 'USD').rate('INR', 75);
    const moneyCopy = money.copy();

    moneyCopy.rate('EUR', 0.89);
    specify('conversion rate check', function () {
      assert.strictEqual(moneyCopy.getConversionRate('USD', 'EUR'), 0.89);
      assert.strictEqual(money.hasConversionRate('EUR'), false);
      assert.strictEqual(moneyCopy.hasConversionRate('EUR'), true);
      assert.throws(() => money.getConversionRate('USD', 'EUR'));
    });

    specify('immutability', function () {
      assert.strictEqual(moneyCopy.add(10).float, 210);
      assert.strictEqual(money.add(10).float, 210);
      assert.strictEqual(money.float, 200);
      assert.strictEqual(moneyCopy.float, 200);
    });
  });

  describe('clip', function () {
    const money = pesa(100, 'USD').to('INR', 75).to('USD');
    specify('internal.bigint check', function () {
      assert.strictEqual(money.internal.bigint, 99997500n);
      assert.strictEqual(money.clip(1).internal.bigint, 100000000n);
      assert.strictEqual(money.clip(2).internal.bigint, 100000000n);
      assert.strictEqual(money.clip(3).internal.bigint, 99998000n);
      assert.strictEqual(money.clip(4).internal.bigint, 99997500n);
    });
  });

  describe('arithmetic', function () {
    // these have been tested under preciseNumber.
    // adding it here for coverage
    describe('add', function () {
      const money = pesa(200, 'USD');
      specify('no conversion', function () {
        assert.strictEqual(money.add(200).float, 400);
      });

      specify('conversion', function () {
        assert.strictEqual(money.add(200, 'INR', 0.013).float, 202.6);
      });
    });

    describe('sub', function () {
      const money = pesa(200, 'USD');
      specify('no conversion', function () {
        assert.strictEqual(money.sub(200).float, 0);
      });

      specify('conversion', function () {
        assert.strictEqual(money.sub(200, 'INR', 0.013).float, 197.4);
      });
    });

    describe('mul', function () {
      const money = pesa(200, 'USD');
      specify('no conversion', function () {
        assert.strictEqual(money.mul(200).float, 40000);
      });

      specify('conversion', function () {
        assert.strictEqual(money.mul(200, 'INR', 0.013).float, 520);
      });
    });

    describe('div', function () {
      const money = pesa(200, 'USD');
      specify('no conversion', function () {
        assert.strictEqual(money.div(200).float, 1);
      });

      specify('conversion', function () {
        assert.strictEqual(money.div(200, 'INR', 0.013).float, 76.923076);
      });
    });
  });

  describe('comparison', function () {
    describe('eq', function () {
      const money = pesa(150, 'INR');
      specify('no conversion', function () {
        assert.strictEqual(money.eq(150), true);
        assert.strictEqual(money.eq(151), false);
      });

      specify('conversion', function () {
        assert.strictEqual(money.eq(2, 'USD', 75), true);
        assert.strictEqual(money.eq(2, 'USD', 74.99), false);
      });
    });

    describe('gt', function () {
      const money = pesa(150, 'INR');
      specify('no conversion', function () {
        assert.strictEqual(money.gt(149.99), true);
        assert.strictEqual(money.gt(150), false);
        assert.strictEqual(money.gt(151), false);
      });

      specify('conversion', function () {
        assert.strictEqual(money.gt(1.99, 'USD', 75), true);
        assert.strictEqual(money.gt(2, 'USD', 75), false);
        assert.strictEqual(money.gt(2.01, 'USD', 75), false);
      });
    });

    describe('lt', function () {
      const money = pesa(150, 'INR');
      specify('no conversion', function () {
        assert.strictEqual(money.lt(150.01), true);
        assert.strictEqual(money.lt(150), false);
        assert.strictEqual(money.lt(149.99), false);
      });

      specify('conversion', function () {
        assert.strictEqual(money.lt(2.01, 'USD', 75), true);
        assert.strictEqual(money.lt(2, 'USD', 75), false);
        assert.strictEqual(money.lt(1.99, 'USD', 75), false);
      });
    });

    describe('gte', function () {
      const money = pesa(150, 'INR');
      specify('no conversion', function () {
        assert.strictEqual(money.gte(149.99), true);
        assert.strictEqual(money.gte(150), true);
        assert.strictEqual(money.gte(151), false);
      });

      specify('conversion', function () {
        assert.strictEqual(money.gte(1.99, 'USD', 75), true);
        assert.strictEqual(money.gte(2, 'USD', 75), true);
        assert.strictEqual(money.gte(2.01, 'USD', 75), false);
      });
    });

    describe('lte', function () {
      const money = pesa(150, 'INR');
      specify('no conversion', function () {
        assert.strictEqual(money.lte(150.01), true);
        assert.strictEqual(money.lte(150), true);
        assert.strictEqual(money.lte(149.99), false);
      });

      specify('conversion', function () {
        assert.strictEqual(money.lte(2.01, 'USD', 75), true);
        assert.strictEqual(money.lte(2, 'USD', 75), true);
        assert.strictEqual(money.lte(1.99, 'USD', 75), false);
      });
    });
  });

  describe('checks', function () {
    specify('isPositive', function () {
      assert.strictEqual(pesa().isPositive(), false);
      assert.strictEqual(pesa(1).isPositive(), true);
      assert.strictEqual(pesa(-1).isPositive(), false);
    });

    specify('isNegative', function () {
      assert.strictEqual(pesa().isNegative(), false);
      assert.strictEqual(pesa(1).isNegative(), false);
      assert.strictEqual(pesa(-1).isNegative(), true);
    });

    specify('isPositive', function () {
      assert.strictEqual(pesa().isZero(), true);
      assert.strictEqual(pesa(1).isZero(), false);
      assert.strictEqual(pesa(-1).isZero(), false);
    });
  });

  describe('other calculations', function () {
    describe('percent', function () {
      const money = pesa(200, 'USD');
      specify('-', function () {
        assert.strictEqual(money.percent(200).float, 400);
        assert.strictEqual(money.percent(100).float, 200);
        assert.strictEqual(money.percent(50).float, 100);
        assert.strictEqual(money.percent(30).float, 60);
        assert.strictEqual(money.percent(12.5).float, 25);
        assert.strictEqual(money.percent(1.125).float, 2.25);
      });
    });

    describe('abs', function () {
      specify('-', function () {
        assert.strictEqual(pesa(0).abs().float, 0);
        assert.strictEqual(pesa(-0).abs().float, 0);
        assert.strictEqual(pesa(0.00001).abs().float, 0.00001);
        assert.strictEqual(pesa(-0.00001).abs().float, 0.00001);
        assert.strictEqual(pesa(200).abs().float, 200);
        assert.strictEqual(pesa(-200).abs().eq(200), true);
        assert.strictEqual(pesa(-200).abs().eq(-200), false);
      });
    });

    describe('split', function () {
      const sum = (list: number[]) => list.reduce((a, b) => a + b);
      const money = pesa(200, 'USD');

      describe('percent list input', function () {
        specify('even splits', function () {
          const splits = money.split([60, 40]).map((m) => m.float);
          assert.strictEqual(splits[0], 120);
          assert.strictEqual(splits[1], 80);
          assert.strictEqual(sum(splits), money.float);
        });

        [0, 1, 2, 4, 6].forEach((d) => {
          specify(`uneven splits 0, d: ${d}`, function () {
            const splits = money.split([33, 33, 34], d).map((m) => m.float);
            assert.strictEqual(sum(splits), money.float);
          });

          specify(`uneven splits 1, d: ${d}`, function () {
            const splits = money.split([49.99, 50.01], d).map((m) => m.float);
            assert.strictEqual(sum(splits), money.float);
          });
        });
      });

      describe('number input', function () {
        [2, 3, 5, 6, 8, 10].forEach((n) => {
          specify(`n: ${n}`, function () {
            const splits = money.split(n).map((m) => m.float);
            assert.strictEqual(sum(splits), money.float);
          });
        });
      });
    });
  });
});
