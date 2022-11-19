import { randomInt } from 'crypto';
import { Input, p, pesa } from '../index';
import _PreciseNumber from '../src/_preciseNumber';
import { Timer } from './timer';

const MAX = 100_000;

function _p(value: Input = 0, precision: number = 6): _PreciseNumber {
  return new _PreciseNumber(value, precision);
}

function randomBigInt(max: number): bigint {
  return BigInt(randomInt(max));
}

function doPNumber() {
  return p(randomInt(MAX))
    .add(randomInt(MAX))
    .mul(randomInt(MAX))
    .div(randomInt(MAX) || 1)
    .sub(randomInt(MAX)).float;
}

function doPesa() {
  return pesa(randomInt(MAX))
    .add(randomInt(MAX))
    .mul(randomInt(MAX))
    .div(randomInt(MAX) || 1)
    .sub(randomInt(MAX)).float;
}

function doNumber() {
  return (
    ((randomInt(MAX) + randomInt(MAX)) * randomInt(MAX)) /
      (randomInt(MAX) || 1) -
    randomInt(MAX)
  );
}

function doBigint() {
  return (
    ((randomBigInt(MAX) + randomBigInt(MAX)) * randomBigInt(MAX)) /
      (randomBigInt(MAX) || 1n) -
    randomBigInt(MAX)
  );
}

export const pf = {
  doPNumber,
  doPesa,
  doNumber,
  doBigint,
};

const toProfile = {
  initPn: () => p(randomInt(MAX)),
  init_Pn: () => _p(randomInt(MAX)),
  initPesa: () => pesa(randomInt(MAX)),
  addPn: () => p(randomInt(MAX)).add(randomInt(MAX)),
  addPesa: () => pesa(randomInt(MAX)).add(randomInt(MAX)),
  randomInt: () => randomInt(MAX),
  randomBigInt: () => randomBigInt(MAX),
};

function loop(fn: () => void, count: number = MAX) {
  for (let i = 0; i <= count; i++) {
    fn();
  }
}

function print(t: Timer) {
  console.log('means');
  console.log(format(t.mean()));

  console.log('\nmins');
  console.log(format(t.min()));

  console.log('\nmaxes');
  console.log(format(t.max()));
}

function format(obj: Record<string, bigint>) {
  return Object.keys(obj)
    .map((k, i) => {
      const time = (Number(obj[k]).toString() + ' ns').padStart(15);
      return `${i.toString().padStart(3)}. ${k.padEnd(15)}: ${time}`;
    })
    .join('\n');
}

(function run() {
  const t = new Timer();
  t.start('total');
  for (const key of Object.keys(toProfile)) {
    const fn = toProfile[key as keyof typeof toProfile];

    loop(() => {
      t.start(key);
      fn();
      t.end(key);
    });
  }

  t.end('total');
  print(t);
})();
