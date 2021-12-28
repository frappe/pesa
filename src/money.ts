import { DEF_DISP, DEF_PREC } from './consts';
import PreciseNumber from './preciseNumber';
import {
  getConversionRateKey,
  throwIfInvalidCurrencyCode,
  throwRateNotProvided,
} from './utils';

type Input = PreciseNumber | bigint | number | string;
type ArithmeticInput = Money | number | string;
type Rate = string | number;
type ConversionRateMap = Map<string, Rate>;
interface RateSetting {
  from: string;
  to: string;
  rate: Rate;
}

export interface Options {
  precision?: number;
  currency?: string;
  display?: number;
  rates?: RateSetting | RateSetting[];
}

export default class Money {
  display: number;
  #currency: string;
  #preciseNumber: PreciseNumber;
  #conversionRates: ConversionRateMap;

  constructor(amount: Input, options: Options = {}) {
    this.#preciseNumber = new PreciseNumber(
      amount,
      options.precision ?? DEF_PREC
    );

    this.#currency = '';
    this.#conversionRates = new Map();
    this.display = options.display ?? DEF_DISP;

    const { currency, rates } = options;
    if (currency) {
      this.currency(currency);
    }
    if (rates) {
      this.rate(rates);
    }
  }

  /* ---------------------------------
   * Getters and setters
   * ---------------------------------*/

  get float() {
    return this.#preciseNumber.value;
  }

  get options(): Options {
    const rates: RateSetting[] = Array.from(this.#conversionRates.keys()).map(
      (k) => {
        const [from, to] = k.split('-');
        const rate = this.#conversionRates.get(k) ?? -1;
        return { from, to, rate };
      }
    );

    return {
      currency: this.#currency,
      precision: this.#preciseNumber.precision,
      display: this.display,
      rates,
    };
  }

  get preciseNumber(): PreciseNumber {
    return new PreciseNumber(
      this.#preciseNumber,
      this.#preciseNumber.precision
    );
  }

  get internal() {
    const bigint = this.#preciseNumber.integer;
    const precision = this.#preciseNumber.precision;
    return { bigint, precision };
  }

  get conversionRates() {
    return new Map(this.#conversionRates);
  }

  get store(): string {
    const { precision } = this.#preciseNumber;
    return this.#preciseNumber.round(precision);
  }

  /* ---------------------------------
   * Internal functions
   * ---------------------------------*/

  _setConversionRates(rates: ConversionRateMap) {
    if (Array(...this.#conversionRates.keys()).length === 0) {
      this.#conversionRates = new Map(rates);
    }
  }

  #throwCurrencyNotSetIfNotSet() {
    if (!this.#currency) {
      throw Error('currency has not been set for conversion');
    }
  }

  #copySelf(value: PreciseNumber | string, currency: string = ''): Money {
    const options = {
      currency: currency || this.#currency,
      precision: this.#preciseNumber.precision,
      display: this.display,
    };

    const result = new Money(value, options);
    result._setConversionRates(this.#conversionRates);
    return result;
  }

  #convertInput(value: ArithmeticInput, currency?: string, rate?: number) {
    let rhs;
    const valueIsMoney = value instanceof Money;
    if (valueIsMoney) {
      rhs = value.preciseNumber;
      currency = value.getCurrency() || currency;
    } else {
      rhs = new PreciseNumber(value, this.#preciseNumber.precision);
    }

    if (currency && currency !== this.#currency) {
      let finalRate;
      if (rate) {
        finalRate = rate;
      }

      if (!finalRate && valueIsMoney) {
        try {
          finalRate = value.getConversionRate(currency, this.#currency);
        } catch {}
      }

      if (!finalRate) {
        try {
          finalRate = this.getConversionRate(currency, this.#currency);
        } catch {}
      }

      if (!finalRate) {
        throwRateNotProvided(currency, this.#currency);
      }

      rhs = rhs.mul(finalRate ?? 1); // will never be one cause error if undefined
    }

    let lhs = this.#preciseNumber;
    return { lhs, rhs };
  }

  /* ---------------------------------
   * User facing functions (chainable)
   * ---------------------------------*/

  currency(value: string) {
    if (!this.#currency) {
      throwIfInvalidCurrencyCode(value);
      this.#currency = value;
    }
    return this;
  }

  rate(input: string | RateSetting | RateSetting[], rate?: Rate) {
    if (typeof input === 'string') {
      this.#throwCurrencyNotSetIfNotSet();
    }

    if (typeof input === 'string' && typeof rate === 'undefined') {
      throwRateNotProvided(this.#currency, input);
    }

    let settings: RateSetting[];
    if (input instanceof Array) {
      settings = input;
    } else if (typeof input === 'string') {
      settings = [
        {
          from: this.#currency,
          to: input,
          rate: rate ?? 1, // It will never be '1' there's a guard clause.
        },
      ];
    } else if (input instanceof Object) {
      settings = [input];
    } else {
      throw Error(`invalid input to rate: ${input}`);
    }

    for (let setting of settings) {
      const { from, to, rate } = setting;
      const key = getConversionRateKey(from, to);
      this.#conversionRates.set(key, rate);
    }

    return this;
  }

  /* ---------------------------------
   * User facing functions (chainable, im-mutate)
   * ---------------------------------*/

  to(to: string, rate?: Rate): Money {
    this.#throwCurrencyNotSetIfNotSet();
    if (
      typeof rate === 'number' ||
      (typeof rate === 'string' && !this.hasConversionRate(to))
    ) {
      this.rate(to, rate);
    } else {
      rate = this.getConversionRate(this.#currency, to);
    }
    const preciseNumber = this.#preciseNumber.mul(rate);
    return this.#copySelf(preciseNumber, to);
  }

  /* ---------------------------------
   * User facing functions (chainable, operations)
   * ---------------------------------*/

  add(value: ArithmeticInput, currency?: string, rate?: number): Money {
    const { lhs, rhs } = this.#convertInput(value, currency, rate);
    const outPreciseNumber = lhs.add(rhs);
    return this.#copySelf(outPreciseNumber);
  }

  sub(value: ArithmeticInput, currency?: string, rate?: number): Money {
    const { lhs, rhs } = this.#convertInput(value, currency, rate);
    const outPreciseNumber = lhs.sub(rhs);
    return this.#copySelf(outPreciseNumber);
  }

  mul(value: ArithmeticInput, currency?: string, rate?: number): Money {
    const { lhs, rhs } = this.#convertInput(value, currency, rate);
    const outPreciseNumber = lhs.mul(rhs);
    return this.#copySelf(outPreciseNumber);
  }

  div(value: ArithmeticInput, currency?: string, rate?: number): Money {
    const { lhs, rhs } = this.#convertInput(value, currency, rate);
    const outPreciseNumber = lhs.div(rhs);
    return this.#copySelf(outPreciseNumber);
  }

  /* ---------------------------------
   * User facing functions (chainable, other calcs)
   * ---------------------------------*/

  percent(value: number): Money {
    return this.#copySelf(this.#preciseNumber.mul(value / 100));
  }

  split(values: number | number[], round?: number): Money[] {
    round ??= this.display;
    let percents: number[] = [];
    if (typeof values === 'number') {
      const n = values;
      percents = Array(n - 1)
        .fill(100 / n)
        .map(
          (v) =>
            new PreciseNumber(v, this.#preciseNumber.precision).clip(
              round ?? DEF_DISP
            ).float
        );
      percents.push(100 - percents.reduce((a, b) => a + b));
    } else if (values instanceof Array) {
      percents = values;
    }

    const isFull =
      percents.map((v) => new PreciseNumber(v)).reduce((a, b) => a.add(b))
        .float === 100;
    const final = isFull ? percents.length - 1 : percents.length;

    const splits = percents.slice(0, final).map((v) => {
      const rounded = this.#preciseNumber.mul(v / 100).round(round ?? DEF_DISP);
      return this.#copySelf(rounded);
    });

    if (isFull) {
      const sum = splits.reduce((a, b) => a.add(b)).round(round);
      const finalMoney = this.#copySelf(this.round(round)).sub(sum);
      splits.push(finalMoney);
    }

    return splits;
  }

  abs(): Money {
    if (this.lt(0)) {
      return this.mul(-1);
    }
    return this.copy();
  }

  clip(to?: number): Money {
    to ??= this.display;
    return this.#copySelf(this.#preciseNumber.clip(to), this.#currency);
  }

  copy(): Money {
    return this.#copySelf(this.#preciseNumber.copy(), this.#currency);
  }

  /* ---------------------------------
   * User facing functions (non-chainable, comparisons)
   * ---------------------------------*/

  eq(value: ArithmeticInput, currency?: string, rate?: number): boolean {
    const { lhs, rhs } = this.#convertInput(value, currency, rate);
    return lhs.eq(rhs);
  }

  gt(value: ArithmeticInput, currency?: string, rate?: number): boolean {
    const { lhs, rhs } = this.#convertInput(value, currency, rate);
    return lhs.gt(rhs);
  }

  lt(value: ArithmeticInput, currency?: string, rate?: number): boolean {
    const { lhs, rhs } = this.#convertInput(value, currency, rate);
    return lhs.lt(rhs);
  }

  gte(value: ArithmeticInput, currency?: string, rate?: number): boolean {
    const { lhs, rhs } = this.#convertInput(value, currency, rate);
    return lhs.gte(rhs);
  }

  lte(value: ArithmeticInput, currency?: string, rate?: number): boolean {
    const { lhs, rhs } = this.#convertInput(value, currency, rate);
    return lhs.lte(rhs);
  }

  /* ---------------------------------
   * User facing functions (non-chainable, checks)
   * ---------------------------------*/

  isPositive(): boolean {
    return this.#preciseNumber.integer > 0n;
  }

  isNegative(): boolean {
    return this.#preciseNumber.integer < 0n;
  }

  isZero(): boolean {
    return this.#preciseNumber.integer === 0n;
  }

  /* ---------------------------------
   * User facing functions (non chainable)
   * ---------------------------------*/

  getCurrency() {
    return this.#currency;
  }

  getConversionRate(from: string, to: string): Rate {
    let key = getConversionRateKey(from, to);
    let value = this.#conversionRates.get(key);

    if (!value) {
      key = getConversionRateKey(to, from);
      value = this.#conversionRates.get(key);

      if (value && typeof value === 'string') {
        value = 1 / parseFloat(value);
      } else if (value && typeof value === 'number') {
        value = 1 / value;
      }
    }

    if (!value) {
      throw Error(`please set the conversion rate for ${from} to ${to}`);
    }

    return value;
  }

  hasConversionRate(to: string): boolean {
    let key = getConversionRateKey(this.getCurrency(), to);
    let keyInverse = getConversionRateKey(to, this.getCurrency());
    return (
      this.#conversionRates.has(key) || this.#conversionRates.has(keyInverse)
    );
  }

  /* ---------------------------------
   * User facing functions (display)
   * ---------------------------------*/

  round(to?: number): string {
    to ??= this.display;
    return this.#preciseNumber.round(to);
  }

  toString() {
    return this.#preciseNumber.toString();
  }

  toJSON() {
    return this.#preciseNumber.toJSON();
  }

  valueOf(): bigint {
    return this.#preciseNumber.valueOf();
  }
}
