import PreciseNumber from './preciseNumber';
import { DEF_DISP, DEF_PREC } from './consts';

interface Options {
  precision?: number;
  display?: number;
  currency?: string;
}

type Input = Money | number | string;

export default class Money extends PreciseNumber {
  display: number;
  currency: string;

  constructor(amount: Input, options: Options = {}) {
    super(amount, options.precision ?? DEF_PREC);

    this.display = options.display ?? DEF_DISP;
    this.currency = options.currency ?? '';
  }

  // @ts-ignore will remove it once complete
  convert(to: string, from?: string): Money {
    if (!this.currency && !from) {
      throw Error('currency has not been set for conversion');
    }

    throw Error('Not implemented currency conversion of Money type');
  }
}
