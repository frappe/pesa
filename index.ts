import { DEF_PREC } from './src/consts';
import Money, { Options } from './src/money';
import PreciseNumber from './src/preciseNumber';

export type Input = bigint | number | string;
export type Currency = string;
export type Config = Options | Currency;

export type PreciseNumberMaker = (
  value: Input,
  innerPrecision?: number
) => PreciseNumber;
export type MoneyMaker = (value: Input, innerOptions?: Config) => Money;

export function p(value: Input = 0, precision: number = 6): PreciseNumber {
  return new PreciseNumber(value, precision);
}

export function pesa(value: Input = 0, options: Config = {}): Money {
  if (typeof options === 'string') {
    options = { currency: options };
  }

  return new Money(value, options);
}

export function getPreciseNumberMaker(
  precision: number = DEF_PREC
): PreciseNumberMaker {
  return function (value: Input, innerPrecision?: number) {
    return p(value, innerPrecision ?? precision);
  };
}

export function getMoneyMaker(options: Config = {}): MoneyMaker {
  return function (value: Input, innerOptions?: Config) {
    return pesa(value, innerOptions ?? options);
  };
}
