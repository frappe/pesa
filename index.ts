import PreciseNumber from './src/preciseNumber';
import Money from './src/money';

export function p(value: number = 0, precision: number = 6): PreciseNumber {
  return new PreciseNumber(value, precision);
}

export default {
  PreciseNumber,
  Money,
};
