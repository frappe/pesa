export type ScalerInput = string | number;

export function scaler(value: ScalerInput, precision: number): bigint {
  throwIfNotValid(value);
  value = stripZeros(value);
  const fractionalLength = getFractionalLength(value);
  const stringRep = typeof value === 'number' ? value.toString() : value;
  const parts = stringRep.split('.');
  const whole = parts[0];
  const fractional = parts[1] ?? '';

  let bigRep = BigInt(whole + fractional);
  if (precision > fractionalLength) {
    bigRep *= 10n ** BigInt(precision - fractionalLength);
  } else {
    bigRep /= 10n ** BigInt(fractionalLength - precision);
    if (parseInt(fractional[precision]) > 4) {
      bigRep += bigRep > 0 ? 1n : -1n;
    }
  }
  return bigRep;
}

export function getFractionalLength(value: ScalerInput): number {
  const string = value.toString();
  const whereIsTheDot = string.indexOf('.') + 1;
  if (whereIsTheDot === 0) {
    return 0;
  }
  return string.substring(whereIsTheDot).length;
}

function throwIfNotValid(value: ScalerInput) {
  const type = typeof value;
  if (type === 'string' && !getIsInputValid(value as string)) {
    throw Error(`invalid input '${value}' of type '${type}'`);
  }
}

export function getIsInputValid(value: string): boolean {
  // regex for: ['22.22', '.22', '22.']
  const hasMatch = value.match(/^-?\d*(?:(?:\.?\d)|(?:\d\.?))\d*$/);
  return Boolean(hasMatch);
}

export function toDecimalString(value: bigint, precision: number): string {
  const stringRep = value.toString();
  const d = stringRep.length - precision;
  const whole = stringRep.slice(0, d);
  const fractional = stringRep.slice(d);
  if (fractional.length) {
    return stripZeros(`${whole}.${fractional}`) as string;
  }
  return whole;
}

function stripZeros(value: ScalerInput): ScalerInput {
  if (typeof value === 'string') {
    return (value as string).replace(/0+$/, '');
  }
  return value;
}
