import { MIN_PREC, DEF_PREC, MAX_PREC } from './consts';
import { scaler, toDecimalString } from './utils';

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
  precision: number;
  #value: bigint;

  /* ---------------------------------
   * Private methods
   * ---------------------------------*/

  #scaleAndConvert(value: Input): bigint {
    if (value instanceof PreciseNumber) {
      return value.#value;
    }

    return scaler(value, this.precision);
  }

  #executeOperation(operator: Operator, ...values: Input[]): PreciseNumber {
    const neutralizer: bigint = BigInt(Math.pow(10, this.precision));
    const prAmounts: bigint[] = values.map(this.#scaleAndConvert, this);
    const finalAmount: bigint = prAmounts.reduce((a, b) => {
      switch (operator) {
        case Operator.Add:
          return a + b;
        case Operator.Sub:
          return a - b;
        case Operator.Div:
          return (a / b) * neutralizer;
        case Operator.Mul:
          return (a * b) / neutralizer;
        default:
          return 0n;
      }
    });
    this.#value = finalAmount;
    return this;
  }

  #executeComparison(
    comparator: Comparator,
    valueA: Input,
    valueB: Input
  ): boolean {
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

  static #splitInput(values: Input[]): [Input, Input[]] {
    return [values[0], values.slice(1)];
  }

  /* ---------------------------------
   * Constructor and overridables
   * ---------------------------------*/

  constructor(value: Input = 0, precision: number = DEF_PREC) {
    precision = Math.round(precision);
    if (precision > MAX_PREC || precision < MIN_PREC) {
      throw Error(`precision should be between ${MIN_PREC} and ${MAX_PREC}`);
    }

    this.#value = 0n;
    this.precision = precision;
    this.value = value;
  }

  /* ---------------------------------
   * Getters and Setters
   * ---------------------------------*/

  get value(): number {
    return Number(this.#value) / Math.pow(10, this.precision);
  }

  set value(value: Input) {
    this.#value = this.#scaleAndConvert(value);
  }

  get integer(): bigint {
    return this.#value;
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
   * Special methods
   * ---------------------------------*/

  toString(): string {
    return toDecimalString(this.#value, this.precision);
  }

  toJSON(): string {
    return toDecimalString(this.#value, this.precision);
  }

  valueOf(): bigint {
    return this.#value;
  }
}
