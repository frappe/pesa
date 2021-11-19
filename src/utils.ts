export type ScalerInput = string | number;

function replaceDelimiters(value: ScalerInput) {
  if (typeof value === 'string') {
    return value.replace(/[_,]/g, '');
  }
  return value;
}

export function scaler(value: ScalerInput, precision: number): bigint {
  value = replaceDelimiters(value);
  throwIfNotValid(value);
  value = stripZeros(value);
  const fractionalLength = getFractionalLength(value);
  const stringRep = typeof value === 'number' ? value.toString() : value;
  const floatRep = typeof value === 'string' ? parseFloat(value) : value;
  const parts = stringRep.split('.');
  const whole = parts[0];
  const fractional = parts[1] ?? '';

  let stringBigRep = whole + fractional;
  stringBigRep = stringBigRep === '-0' ? '0' : stringBigRep;
  let bigRep = BigInt(stringBigRep);

  if (precision > fractionalLength) {
    bigRep *= 10n ** BigInt(precision - fractionalLength);
  } else {
    bigRep /= 10n ** BigInt(fractionalLength - precision);
    if (parseInt(fractional[precision]) > 4) {
      bigRep += floatRep >= 0 ? 1n : -1n;
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
  const isNegative = value < 0;
  let stringRep = value.toString();
  stringRep = isNegative ? stringRep.slice(1) : stringRep;

  const d = stringRep.length - precision;
  const sign = isNegative ? '-' : '';

  if (d < 0) {
    return sign + '0.' + '0'.repeat(Math.abs(d)) + stringRep;
  } else if (d === 0) {
    return sign + '0.' + stringRep;
  }

  const whole = stringRep.slice(0, d) || '0';
  const fractional = stringRep.slice(d);

  if (fractional.length) {
    return (sign + stripZeros(`${whole}.${fractional}`)) as string;
  }
  return sign + whole;
}

function stripZeros(value: ScalerInput): ScalerInput {
  if (typeof value === 'string' && value.includes('.') && value.endsWith('0')) {
    let [fractional, whole] = (value as string).split('.');
    whole = whole.replace(/0*$/, '');
    whole = whole.length > 0 ? `.${whole}` : whole;
    return fractional + whole;
  }
  return value;
}

export function getIsCurrencyCode(code: string): boolean {
  return !!code.match(/^[A-Z]{3}$/);
}

export function throwIfInvalidCurrencyCode(code: string) {
  if (!getIsCurrencyCode(code)) {
    throw Error(`invalid currency code '${code}'`);
  }
}

export function getConversionRateKey(from: string, to: string) {
  const keys = [from, to];
  keys.forEach(throwIfInvalidCurrencyCode);
  return keys.join('-');
}

export function matchPrecision(
  value: bigint,
  from: number,
  to: number
): bigint {
  if (from > to) {
    return value / 10n ** BigInt(from - to);
  } else if (from < to) {
    return value * 10n ** BigInt(to - from);
  }
  return value;
}

export function throwRateNotProvided(from: string, to: string) {
  throw Error(`rate not provided for conversion from ${from} to ${to}`);
}
