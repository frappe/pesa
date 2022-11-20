export class Timer {
  timers: Record<string, { start: bigint[]; end: bigint[] }>;
  constructor() {
    this.timers = {};
  }

  start(name: string) {
    this.timers[name] ??= { start: [], end: [] };

    const start = process.hrtime.bigint();
    this.timers[name].start.push(start);
  }

  end(name: string) {
    const end = process.hrtime.bigint();
    this.timers[name]!.end!.push(end);
  }

  mean(): Record<string, bigint> {
    const rec: Record<string, bigint> = {};
    for (const n of Object.keys(this.timers)) {
      rec[n] = this.#mean(n);
    }

    return rec;
  }

  min(): Record<string, bigint> {
    return this.minOrMax('min');
  }

  max(): Record<string, bigint> {
    return this.minOrMax('max');
  }

  minOrMax(type: 'min' | 'max'): Record<string, bigint> {
    const rec: Record<string, bigint> = {};
    for (const n of Object.keys(this.timers)) {
      rec[n] = this.#minOrMax(n, type);
    }

    return rec;
  }

  #mean(name: string): bigint {
    let diffs = this.#diff(name);
    if (!diffs.length) {
      return 0n;
    }

    return diffs.reduce((a, b) => a + b) / BigInt(diffs.length);
  }

  #minOrMax(name: string, type: 'min' | 'max'): bigint {
    const index = type === 'min' ? 0 : -1;
    return this.#diff(name).at(index)!;
  }

  #diff(name: string) {
    const { start, end } = this.timers[name];

    if (!start || !end) {
      throw Error('timers not set');
    }

    if (start.length !== end.length) {
      throw Error(`${start.length - end.length} timers still running`);
    }

    return start.map((v, i) => end[i] - v).sort((a, b) => Number(a - b));
  }
}
