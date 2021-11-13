import Money, { Options } from './src/money';
import PreciseNumber from './src/preciseNumber';
import { DEF_PREC } from './src/consts';

type Input = number | string;

interface Config {
  display?: number;
  currency?: string;
  precision?: number;
}

export function p(value: Input = 0, precision: number = 6): PreciseNumber {
  return new PreciseNumber(value, precision);
}

export function m(value: Input = 0, options: Options = {}): Money {
  return new Money(value, options);
}

export function getPreciseNumberMaker(precision: number = DEF_PREC) {
  return function p(value: Input) {
    return new PreciseNumber(value, precision);
  };
}

export function getMoneyMaker(config: Config = {}) {
  return function m(value: Input) {
    return new Money(value, config);
  };
}
