import { DEF_PREC, MAX_PREC, MIN_PREC } from './consts';
import { matchPrecision, scaler, toDecimalString } from './utils';

const enum Operator {
  Add = '+',
  Sub = '-',
  Mul = '*',
  Div = '/',
}

const enum Comparator {
  Eq = '===',
  Gt = '>',
  Lt = '<',
  Gte = '>=',
  Lte = '<=',
}

type Input = PreciseNumber | number | string;

export default class PreciseNumber {
  #precision: number;
  #value: bigint;

  /* ---------------------------------
   * Private methods
   * ---------------------------------*/

  #throwIfInvalidInput(...values: (Input | bigint)[]) {
    values.forEach((value) => {
      if (value === 0 || value === 0n) {
        return;
      }

      if (
        Number.isNaN(value) ||
        value === Infinity ||
        value === -Infinity ||
        !value
      ) {
        throw Error(`invalid value ${value} found`);
      }
    });
  }

  #scaleAndConvert(value: Input): bigint {
    if (value instanceof PreciseNumber) {
      return matchPrecision(value.integer, value.precision, this.precision);
    }

    return scaler(value, this.#precision);
  }

  #neutralizedMul(product: bigint, neutralizer: bigint) {
    const final = product / neutralizer;
    const temp = product.toString();
    const roundingNum =
      parseInt(temp.charAt(temp.length - this.#precision) || '0') > 4 ? 1n : 0n;

    return final + roundingNum;
  }

  #executeOperation(operator: Operator, ...values: Input[]): PreciseNumber {
    this.#throwIfInvalidInput(...values);
    const neutralizer: bigint = 10n ** BigInt(this.#precision);
    const prAmounts: bigint[] = values.map(this.#scaleAndConvert, this);
    const finalAmount: bigint = prAmounts.reduce((a, b) => {
      switch (operator) {
        case Operator.Add:
          return a + b;
        case Operator.Sub:
          return a - b;
        case Operator.Div:
          return (a * neutralizer) / b;
        case Operator.Mul:
          return this.#neutralizedMul(a * b, neutralizer);
        default:
          return 0n;
      }
    });
    // this.#value = finalAmount;
    const result = new PreciseNumber(0, this.#precision);
    result._setInnerValue(finalAmount);
    return result;
  }

  #executeComparison(
    comparator: Comparator,
    valueA: Input,
    valueB: Input
  ): boolean {
    this.#throwIfInvalidInput(valueA, valueB);
    const prAmountA = this.#scaleAndConvert(valueA);
    const prAmountB = this.#scaleAndConvert(valueB);
    switch (comparator) {
      case '===':
        return prAmountA === prAmountB;
      case '>':
        return prAmountA > prAmountB;
      case '<':
        return prAmountA < prAmountB;
      case '>=':
        return prAmountA >= prAmountB;
      case '<=':
        return prAmountA <= prAmountB;
      default:
        return false;
    }
  }

  #validateAndGetPrecision(precision: number) {
    precision = Math.round(precision);
    if (precision > MAX_PREC || precision < MIN_PREC) {
      throw Error(`precision should be between ${MIN_PREC} and ${MAX_PREC}`);
    }

    return precision;
  }

  static #splitInput(values: Input[]): [Input, Input[]] {
    return [values[0], values.slice(1)];
  }

  /* ---------------------------------
   * Constructor and others
   * ---------------------------------*/

  constructor(value: Input = 0, precision: number = DEF_PREC) {
    precision = this.#validateAndGetPrecision(precision);

    this.#value = 0n;
    this.#precision = precision;
    this.value = value;
  }

  _setInnerValue(value: bigint) {
    this.#throwIfInvalidInput(value);
    this.#value = value;
  }

  round(to: number): string {
    this.#throwIfInvalidInput(to);
    to = to >= 0 ? to : 0;

    const diff = to - this.#precision;
    const isNeg = this.#value < 0;
    let stringRep = this.#value.toString().slice(isNeg ? 1 : 0);
    if (stringRep.length < this.precision) {
      stringRep = '0'.repeat(this.precision - stringRep.length) + stringRep;
    }
    const dpoint = stringRep.length - this.precision;
    const whole = stringRep.slice(0, dpoint) || '0';
    const fraction = stringRep.slice(dpoint);
    const trailingZeros = '0'.repeat(Math.max(0, diff));
    const roundingDigit = (parseInt(fraction[to]) || 0) > 4 ? 1n : 0n;
    let lowPrescisionRep = (
      BigInt(whole + fraction.slice(0, to) + trailingZeros) + roundingDigit
    ).toString();
    if (lowPrescisionRep.length < to) {
      lowPrescisionRep =
        '0'.repeat(to - lowPrescisionRep.length) + lowPrescisionRep;
    }
    const newDpoint = lowPrescisionRep.length - to;
    const newWhole = lowPrescisionRep.slice(0, newDpoint) || '0';
    const newFractional = lowPrescisionRep.slice(newDpoint);
    const tail = '.' + newFractional + '0'.repeat(to - newFractional.length);
    return (isNeg ? '-' : '') + newWhole + (tail !== '.' ? tail : '');
  }

  clip(to: number) {
    this.#throwIfInvalidInput(to);
    return new PreciseNumber(this.round(to), this.#precision);
  }

  copy() {
    const pn = new PreciseNumber(0, this.#precision);
    pn._setInnerValue(this.#value);
    return pn;
  }

  /* ---------------------------------
   * Getters and Setters
   * ---------------------------------*/

  get value(): number {
    return Number(this.#value) / Math.pow(10, this.#precision);
  }

  set value(value: Input) {
    this.#throwIfInvalidInput(value);
    this.#value = this.#scaleAndConvert(value);
  }

  get float(): number {
    return this.value;
  }

  get integer(): bigint {
    return this.#value;
  }

  get precision(): number {
    return this.#precision;
  }

  set precision(precision: number) {
    precision = this.#validateAndGetPrecision(precision);
    this.#value = matchPrecision(this.#value, this.precision, this.#precision);
    this.#precision = this.#precision;
  }

  /* ---------------------------------
   * Getters and Setters (Convenience)
   * ---------------------------------*/

  get v() {
    return this.value;
  }

  set v(value: Input) {
    this.value = value;
  }

  get i() {
    return this.integer;
  }

  /* ---------------------------------
   * Operator Methods
   * ---------------------------------*/

  add(...values: Input[]): PreciseNumber {
    return this.#executeOperation(Operator.Add, ...[this, ...values]);
  }

  sub(...values: Input[]): PreciseNumber {
    return this.#executeOperation(Operator.Sub, ...[this, ...values]);
  }

  mul(...values: Input[]): PreciseNumber {
    return this.#executeOperation(Operator.Mul, ...[this, ...values]);
  }

  div(...values: Input[]): PreciseNumber {
    return this.#executeOperation(Operator.Div, ...[this, ...values]);
  }

  /* ---------------------------------
   * Static Operator Methods
   * ---------------------------------*/

  static add(...values: Input[]): PreciseNumber {
    const [first, remaining] = this.#splitInput(values);
    return new this(first).add(...remaining);
  }

  static sub(...values: Input[]): PreciseNumber {
    const [first, remaining] = this.#splitInput(values);
    return new this(first).sub(...remaining);
  }

  static mul(...values: Input[]): PreciseNumber {
    const [first, remaining] = this.#splitInput(values);
    return new this(first).mul(...remaining);
  }

  static div(...values: Input[]): PreciseNumber {
    const [first, remaining] = this.#splitInput(values);
    return new this(first).div(...remaining);
  }

  /* ---------------------------------
   * Comparator Methods
   * ---------------------------------*/

  eq(value: Input): boolean {
    return this.#executeComparison(Comparator.Eq, this, value);
  }

  gt(value: Input): boolean {
    return this.#executeComparison(Comparator.Gt, this, value);
  }

  lt(value: Input): boolean {
    return this.#executeComparison(Comparator.Lt, this, value);
  }

  gte(value: Input): boolean {
    return this.#executeComparison(Comparator.Gte, this, value);
  }

  lte(value: Input): boolean {
    return this.#executeComparison(Comparator.Lte, this, value);
  }

  /* ---------------------------------
   * Static Comparator Methods
   * ---------------------------------*/

  static eq(valueA: Input, valueB: Input): boolean {
    return new this(valueA).eq(valueB);
  }

  static gt(valueA: Input, valueB: Input): boolean {
    return new this(valueA).gt(valueB);
  }

  static lt(valueA: Input, valueB: Input): boolean {
    return new this(valueA).lt(valueB);
  }

  static gte(valueA: Input, valueB: Input): boolean {
    return new this(valueA).gte(valueB);
  }

  static lte(valueA: Input, valueB: Input): boolean {
    return new this(valueA).lte(valueB);
  }

  /* ---------------------------------
   * Checks
   * ---------------------------------*/

  isPositive(): boolean {
    return this.#value > 0n;
  }

  isNegative(): boolean {
    return this.#value < 0n;
  }

  isZero(): boolean {
    return this.#value === 0n;
  }

  /* ---------------------------------
   * Special methods
   * ---------------------------------*/

  toString(): string {
    return toDecimalString(this.#value, this.#precision);
  }

  toJSON(): string {
    return toDecimalString(this.#value, this.#precision);
  }

  valueOf(): bigint {
    return this.#value;
  }
}
