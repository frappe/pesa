import PreciseNumber from './preciseNumber';
import { DEF_PREC, DEF_DISP } from './consts';
import { getConversionRateKey } from './utils';

export interface Options {
  precision?: number;
  currency?: string;
  display?: number;
}

type Input = PreciseNumber | number | string;
type ArithmeticInput = Money | number | string;
type Rate = string | number;
type ConversionRateMap = Map<string, Rate>;

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
    this.#currency = options.currency ?? '';
    this.#conversionRates = new Map();
    this.display = options.display ?? DEF_DISP;
  }

  /* ---------------------------------
   * Getters and setters
   * ---------------------------------*/

  get float() {
    return this.#preciseNumber.value;
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

  /* ---------------------------------
   * Internal functions
   * ---------------------------------*/

  _setConversionRates(rates: ConversionRateMap) {
    if (Array(...this.#conversionRates.keys()).length === 0) {
      this.#conversionRates = rates;
    }
  }

  #throwCurrencyNotSetIfNotSet() {
    if (!this.#currency) {
      throw Error('currency has not been set for conversion');
    }
  }

  #copySelf(preciseNumber: PreciseNumber, currency: string = ''): Money {
    const options = {
      currency: currency || this.#currency,
      precision: this.#preciseNumber.precision,
      display: this.display,
    };

    const result = new Money(preciseNumber, options);
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
      } else if (valueIsMoney) {
        try {
          finalRate = value.getConversionRate(currency, this.#currency);
        } catch {
          finalRate = this.getConversionRate(currency, this.#currency);
        }
      } else {
        finalRate = this.getConversionRate(currency, this.#currency);
      }

      rhs = rhs.mul(finalRate);
    }

    let lhs = this.#preciseNumber;
    return { lhs, rhs };
  }

  /* ---------------------------------
   * User facing functions (chainable)
   * ---------------------------------*/

  currency(value: string) {
    if (!this.#currency) {
      this.#currency = value;
    }
    return this;
  }

  rate(to: string, value: Rate) {
    this.#throwCurrencyNotSetIfNotSet();
    const key = getConversionRateKey(this.#currency, to);
    this.#conversionRates.set(key, value);
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

  percent(value: number): Money {
    return this.#copySelf(this.#preciseNumber.mul(value / 100));
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
    to = to ?? this.display;
    return this.#preciseNumber.round(to);
  }

  toString() {
    return this.round();
  }

  toJSON() {
    return this.round();
  }

  valueOf(): bigint {
    return this.#preciseNumber.integer;
  }
}
