export type ScalerInput = string | number;

export function scaler(value: ScalerInput, precision: number): bigint {
  if (typeof value === 'string') {
    value = replaceDelimiters(value);
    throwIfNotValid(value);
    value = stripZeros(value);
  }

  const stringRep = typeof value === 'number' ? value + '' : value;
  const floatRep = typeof value === 'string' ? Number(value) : value;

  const parts = stringRep.split('.');
  const whole = parts[0];
  const fractional = parts[1] ?? '';
  const fractionalLength = fractional.length;

  let stringBigRep = whole + fractional;
  stringBigRep = stringBigRep === '-0' ? '0' : stringBigRep;
  let bigRep = BigInt(stringBigRep);

  if (precision > fractionalLength) {
    bigRep *= 10n ** BigInt(precision - fractionalLength);
  } else {
    bigRep /= 10n ** BigInt(fractionalLength - precision);
    if (Number(fractional[precision]) > 4) {
      bigRep += floatRep >= 0 ? 1n : -1n;
    }
  }

  return bigRep;
}

function replaceDelimiters(value: string): string {
  return value.replace(/[_,]/g, '');
}

export function toDecimalString(value: bigint, precision: number): string {
  const isNegative = value < 0;
  let stringRep = value + '';
  stringRep = isNegative ? stringRep.slice(1) : stringRep;

  const d = stringRep.length - precision;
  const sign = isNegative ? '-' : '';

  if (d < 0) {
    return sign + stripZeros('0.' + '0'.repeat(Math.abs(d)) + stringRep);
  } else if (d === 0) {
    return sign + stripZeros('0.' + stringRep);
  }

  const whole = stringRep.slice(0, d) || '0';
  const fractional = stringRep.slice(d);

  if (fractional.length) {
    return (sign + stripZeros(`${whole}.${fractional}`)) as string;
  }
  return sign + whole;
}

function stripZeros(value: string): string {
  if (value.includes('.') && value.endsWith('0')) {
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

function throwIfNotValid(value: string) {
  if (getIsInputValid(value as string)) {
    return;
  }

  throw Error(`invalid input '${value}' of type '${typeof value}'`);
}

export function getIsInputValid(value: string): boolean {
  // regex for: ['22.22', '.22', '22.']
  const hasMatch = value.match(/^-?\d*(?:(?:\.?\d)|(?:\d\.?))\d*$/);
  return Boolean(hasMatch);
}

export function throwRateNotProvided(from: string, to: string) {
  throw Error(`rate not provided for conversion from ${from} to ${to}`);
}

export function scalerNumber(value: ScalerInput, precision: number) {
  if (typeof value === 'string') {
    return scaler(value, precision);
  }

  // const sign = Math.sign(value);
  // const abs = Math.abs(value);

  const frac = (value + '').split('.')[1];
  const fracLength = frac?.length;

  let fracBig = 0n;
  if (frac && fracLength < precision) {
    fracBig = BigInt(frac) * 10n ** BigInt(precision - fracLength);
  }

  if (frac && fracLength >= precision) {
    fracBig = BigInt(frac.substring(0, precision));
  }

  const wholeBig = BigInt(Math.trunc(value)) * 10n ** BigInt(precision);
  const big = wholeBig + fracBig;

  if (fracBig % 10n > 4n) {
    return big + (wholeBig > 0n ? 1n : -1n);
  }

  return big;
}
