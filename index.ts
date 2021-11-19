import Money, { Options } from './src/money';
import PreciseNumber from './src/preciseNumber';
import { DEF_PREC } from './src/consts';

type Input = number | string;
type Currency = string;
type Config = Options | Currency;

export function p(value: Input = 0, precision: number = 6): PreciseNumber {
  return new PreciseNumber(value, precision);
}

export function pesa(value: Input = 0, options: Config = {}): Money {
  if (typeof options === 'string') {
    options = { currency: options };
  }

  return new Money(value, options);
}

export function getPreciseNumberMaker(precision: number = DEF_PREC) {
  return function (value: Input, innerPrecision?: number) {
    return p(value, innerPrecision ?? precision);
  };
}

export function getMoneyMaker(options: Config = {}) {
  return function (value: Input, innerOptions?: Config) {
    return pesa(value, innerOptions ?? options);
  };
}
