/**
 * Creates a new object by omitting specified keys from an existing object.
 *
 * @param obj The original object.
 * @param keys The keys to omit from the new object.
 * @returns A new object that contains all properties from the original object, except for the omitted ones.
 */
export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const newObj = { ...obj };
  for (const key of keys) {
    delete newObj[key];
  }
  return newObj;
}; 