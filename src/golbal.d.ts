type FixedLengthArray<T, N extends number> = [T, ...T[]] & { length: N };

type LensParams = FixedLengthArray<number, 13>;
type MappingParams = FixedLengthArray<number, 9>;
type RectifyParams = FixedLengthArray<number, 9>;
type Pos = FixedLengthArray<number, 2>;

interface Buffer {
  toDoubleArr(): number[];
  toFloatArr(): number[];
  toIntArr(): number[];
  toStr(): string;
}

interface Array {
  doubleToBuffer(): Buffer;
  floatToBuffer(): Buffer;
  intToBuffer(): Buffer;
}

interface String {
  toBuffer(): Buffer;
}
