import { randomInt } from 'crypto';
import { p, pesa } from '../../index';
import { loop, MAX, print } from './helpers';
import { Timer } from './timer';

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

export const pf = {};

class Empty {
  #value: bigint;
  constructor(value: number) {
    this.#value = BigInt(value);
  }
  get value() {
    return this.#value;
  }
}

const toProfile = {
  initEmpty: () => new Empty(randomInt(MAX)),
  initPn: () => p(randomInt(MAX)),
  initPesa: () => pesa(randomInt(MAX)),
  doPNumber,
  doPesa,
  doNumber,
  doBigint,
};

(function run() {
  const timers: Timer[] = [];

  loop(() => {
    const t = new Timer();
    for (const key of Object.keys(toProfile)) {
      const fn = toProfile[key as keyof typeof toProfile];

      loop(() => {
        t.start(key);
        fn();
        t.end(key);
      }, MAX / 5);
    }

    timers.push(t);
  }, 3);

  print(timers);
})();
