import PreciseNumber from "./src/preciseNumber";
import Money from "./src/preciseNumber";

export default {
  PreciseNumber,
  Money,
  p(value: number = 0, precision: number = 6): PreciseNumber {
    return new PreciseNumber(value, precision);
  },
};
