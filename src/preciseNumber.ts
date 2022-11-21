import { DEF_PREC, MAX_PREC, MIN_PREC, USE_BNKR } from './consts';
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

type Input = PreciseNumber | bigint | number | string;

export default class PreciseNumber {
  #neutralizer: bigint;
  #precision: number;
  #value: bigint;
  #bankersRounding: boolean;

  /* ---------------------------------
   * Constructor
   * ---------------------------------*/

  constructor(
    value: Input = 0n,
    precision: number = DEF_PREC,
    bankersRounding: boolean = USE_BNKR
  ) {
    this.#precision = validateAndGetPrecision(precision);
    this.#bankersRounding = bankersRounding;
    this.#neutralizer = 10n ** BigInt(this.#precision);
    this.#value = scaleAndConvert(value, this.precision);
  }

  /* ---------------------------------
   * Utility methods
   * ---------------------------------*/

  round(to: number, bankersRounding?: boolean): string {
    bankersRounding ??= this.#bankersRounding;
    throwIfInvalidInput(to);
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
    const ultimateDigit = Number(fraction[to]);
    const isMid =
      ultimateDigit === 5 &&
      [...fraction.slice(to + 1)].every((d) => d === '0');
    let roundingDigit =
      (ultimateDigit || 0) <= 4 ? 0n : isNeg && isMid ? 0n : 1n;

    if (bankersRounding && isMid && trailingZeros.length === 0) {
      const penultimateDigit =
        Number(to - 1 >= 0 ? fraction[to - 1] : whole[dpoint - 1]) || 0;
      roundingDigit = penultimateDigit % 2 === 0 ? 0n : 1n;
    }

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
    const noSign = newWhole + (tail !== '.' ? tail : '');
    return (
      (!isNeg || [...noSign].filter((d) => d !== '.').every((d) => d === '0')
        ? ''
        : '-') + noSign
    );
  }

  clip(to: number) {
    throwIfInvalidInput(to);
    return new PreciseNumber(this.round(to), this.#precision);
  }

  copy() {
    return new PreciseNumber(this.#value, this.#precision);
  }

  /* ---------------------------------
   * Getters and Setters
   * ---------------------------------*/

  get value(): number {
    return Number(this.#value) / Math.pow(10, this.#precision);
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

  get store(): string {
    return this.round(this.precision);
  }

  set precision(precision: number) {
    precision = validateAndGetPrecision(precision);

    this.#value = matchPrecision(this.#value, this.precision, this.#precision);
    this.#precision = precision;
    this.#neutralizer = getNeutralizer(precision);
  }

  /* ---------------------------------
   * Operator Methods
   * ---------------------------------*/

  add(...values: Input[]): PreciseNumber {
    return executeOperation(
      Operator.Add,
      [this, values].flat(),
      this.precision,
      this.#neutralizer
    );
  }

  sub(...values: Input[]): PreciseNumber {
    return executeOperation(
      Operator.Sub,
      [this, values].flat(),
      this.precision,
      this.#neutralizer
    );
  }

  mul(...values: Input[]): PreciseNumber {
    return executeOperation(
      Operator.Mul,
      [this, values].flat(),
      this.precision,
      this.#neutralizer
    );
  }

  div(...values: Input[]): PreciseNumber {
    return executeOperation(
      Operator.Div,
      [this, values].flat(),
      this.precision,
      this.#neutralizer
    );
  }

  /* ---------------------------------
   * Comparator Methods
   * ---------------------------------*/

  eq(value: Input): boolean {
    return executeComparison(Comparator.Eq, this, value, this.precision);
  }

  gt(value: Input): boolean {
    return executeComparison(Comparator.Gt, this, value, this.precision);
  }

  lt(value: Input): boolean {
    return executeComparison(Comparator.Lt, this, value, this.precision);
  }

  gte(value: Input): boolean {
    return executeComparison(Comparator.Gte, this, value, this.precision);
  }

  lte(value: Input): boolean {
    return executeComparison(Comparator.Lte, this, value, this.precision);
  }

  /* ---------------------------------
   * Static Configuration
   * ---------------------------------*/

  static #prec: number = DEF_PREC;

  static #neut: bigint = getNeutralizer(DEF_PREC);

  static get prec() {
    return this.#prec;
  }

  static set prec(value: number) {
    value = validateAndGetPrecision(value);
    this.#prec = value;
    this.#neut = getNeutralizer(value);
  }

  /* ---------------------------------
   * Static Operator Methods
   * ---------------------------------*/

  static add(...values: Input[]): PreciseNumber {
    return executeOperation(Operator.Add, values, this.prec, this.#neut);
  }

  static sub(...values: Input[]): PreciseNumber {
    return executeOperation(Operator.Sub, values, this.prec, this.#neut);
  }

  static mul(...values: Input[]): PreciseNumber {
    return executeOperation(Operator.Sub, values, this.prec, this.#neut);
  }

  static div(...values: Input[]): PreciseNumber {
    return executeOperation(Operator.Sub, values, this.prec, this.#neut);
  }

  /* ---------------------------------
   * Static Comparator Methods
   * ---------------------------------*/

  static eq(valueA: Input, valueB: Input): boolean {
    return executeComparison(Comparator.Eq, valueA, valueB, this.prec);
  }

  static gt(valueA: Input, valueB: Input): boolean {
    return executeComparison(Comparator.Gt, valueA, valueB, this.prec);
  }

  static lt(valueA: Input, valueB: Input): boolean {
    return executeComparison(Comparator.Lt, valueA, valueB, this.prec);
  }

  static gte(valueA: Input, valueB: Input): boolean {
    return executeComparison(Comparator.Gte, valueA, valueB, this.prec);
  }

  static lte(valueA: Input, valueB: Input): boolean {
    return executeComparison(Comparator.Lte, valueA, valueB, this.prec);
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

function validateAndGetPrecision(precision: number) {
  precision = Math.round(precision);
  if (precision > MAX_PREC || precision < MIN_PREC) {
    throw Error(`precision should be between ${MIN_PREC} and ${MAX_PREC}`);
  }

  return precision;
}

function throwIfInvalidInput(...values: (Input | bigint)[]) {
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

function scaleAndConvert(value: Input, precision: number): bigint {
  if (typeof value === 'bigint') {
    return value;
  }

  if (value instanceof PreciseNumber) {
    return matchPrecision(value.integer, value.precision, precision);
  }

  return scaler(value, precision);
}

function neutralizedMul(
  product: bigint,
  precision: number,
  neutralizer: bigint
) {
  const final = product / neutralizer;
  const temp = product.toString();
  const roundingNum =
    Number(temp.charAt(temp.length - precision) || '0') > 4 ? 1n : 0n;

  return final + roundingNum;
}

function getNeutralizer(precision: number) {
  return 10n ** BigInt(precision);
}

function executeOperation(
  operator: Operator,
  values: Input[],
  precision: number,
  neutralizer: bigint
): PreciseNumber {
  throwIfInvalidInput(...values);

  const prAmounts: bigint[] = values.map((val) =>
    scaleAndConvert(val, precision)
  );

  const finalAmount: bigint = prAmounts.reduce((a, b) => {
    switch (operator) {
      case Operator.Add:
        return a + b;
      case Operator.Sub:
        return a - b;
      case Operator.Div:
        return (a * (neutralizer ?? getNeutralizer(precision))) / b;
      case Operator.Mul:
        return neutralizedMul(a * b, precision, neutralizer);
      default:
        return 0n;
    }
  });

  return new PreciseNumber(finalAmount, precision);
}

function executeComparison(
  comparator: Comparator,
  valueA: Input,
  valueB: Input,
  precision: number
): boolean {
  throwIfInvalidInput(valueA, valueB);

  const prAmountA = scaleAndConvert(valueA, precision);
  const prAmountB = scaleAndConvert(valueB, precision);

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
