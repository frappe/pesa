import { Timer } from './timer';

export const MAX = 100_000;
type BigMap = Record<string, bigint>;
type Metric = 'mean' | 'min' | 'max';
const metrics: Metric[] = ['mean', 'min', 'max'];

export function loop(fn: () => void, count: number = MAX) {
  for (let i = 0; i <= count; i++) {
    fn();
  }
}

export function print(t: Timer | Timer[]) {
  if (Array.isArray(t)) {
    return printArr(t);
  }

  for (const key of metrics) {
    console.log(key);
    console.log(format(t[key as Metric]()));
    console.log();
  }
}

function printArr(timers: Timer[], printOnlyMean: boolean = true) {
  const metricArrs: Record<Metric, BigMap[]> = { mean: [], min: [], max: [] };

  for (const tim of timers) {
    for (const met of metrics) {
      metricArrs[met].push(tim[met]());
    }
  }

  const metricGroups = Object.keys(metricArrs).reduce((acc, m) => {
    acc[m] = group(metricArrs[m as Metric]);
    return acc;
  }, {} as Record<string, Record<string, bigint[]>>);

  for (const met in metricGroups) {
    const group = metricGroups[met];
    if (printOnlyMean && met !== 'mean') {
      continue;
    }

    console.log(met + ':');
    for (const key in group) {
      console.log(`  ${key}:`);
      for (const i in group[key]) {
        const value = group[key][i];
        console.log(
          `    ${i.toString().padStart(2)}. ${value.toString().padStart(15)} ns`
        );
      }
      console.log();
    }
  }
}

function group(arr: BigMap[]) {
  return arr.reduce((acc, tim) => {
    for (const k of Object.keys(tim)) {
      acc[k] ??= [];
      acc[k].push(tim[k]);
    }

    return acc;
  }, {} as Record<string, bigint[]>);
}

function format(obj: Record<string, bigint>) {
  return Object.keys(obj)
    .map((k, i) => {
      const time = (Number(obj[k]).toString() + ' ns').padStart(15);
      return `${i.toString().padStart(3)}. ${k.padEnd(15)}: ${time}`;
    })
    .join('\n');
}
