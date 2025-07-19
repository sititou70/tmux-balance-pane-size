import { describe, expect, test } from "vitest";
import { takeWhile } from "./takeWhile";

describe("takeWhile", () => {
  test("最初の要素がconditionに一致しない場合、空配列が返る", () => {
    const result = takeWhile([1, 2, 4, 6], (elem) => elem % 2 === 0);
    expect(result).toEqual([]);
  });
  describe("最初の要素がconditionに一致する場合、そこから連続して一致する要素が返る", () => {
    test("一致してから、最後まで一致する場合", () => {
      const result = takeWhile([0, 2, 4, 6], (elem) => elem % 2 === 0);
      expect(result).toEqual([0, 2, 4, 6]);
    });
    test("一致してから、途中まで一致する場合", () => {
      const result = takeWhile([0, 2, 4, 6, 7, 8], (elem) => elem % 2 === 0);
      expect(result).toEqual([0, 2, 4, 6]);
    });
  });
});
