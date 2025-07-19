export const takeWhile = <T>(
  array: T[],
  condition: (elem: T) => boolean
): T[] => {
  const lastUnmatchedIndex = array.findIndex((elem) => !condition(elem));
  if (lastUnmatchedIndex === -1) return array;

  return array.slice(0, lastUnmatchedIndex);
};
