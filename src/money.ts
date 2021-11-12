import PreciseNumber from "./preciseNumber";
import { DEF_DISP, DEF_PREC } from "./consts";

interface Options {
  precision?: number;
  display?: number;
  currency?: string;
}

const defaultOptions: Options = {
  precision: DEF_PREC,
  display: DEF_DISP,
  currency: "",
};

// to handle conversions and formatting
export default class Money extends PreciseNumber {
  display: number;
  currency: string;

  constructor(amount, options: Options = {}) {
    const { precision, display, currency } = Object.assign(
      {},
      defaultOptions,
      options
    );
    super(amount, precision);

    this.display = display;
    this.currency = currency;
  }

  convert(to: string, from?: string): Money {
    if (!this.currency && !from) {
      throw Error("currency has not been set for conversion");
    }

    throw Error("Not implemented currency conversion of Money type");
  }
}
