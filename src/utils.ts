export function getFractionalLength(value: number): number {
  const string = value.toString();
  const whereIsTheDot = string.indexOf('.') + 1;
  if (whereIsTheDot === 0) {
    return 0;
  }
  return string.substring(whereIsTheDot).length;
}
