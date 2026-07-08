import type { RandomNumberProvider } from '../dice';

export const createFixedRandomProvider = (values: readonly number[]): RandomNumberProvider => {
  let index = 0;
  return {
    next: () => {
      const value = values[index];
      index += 1;
      return value ?? values.at(-1) ?? 0;
    },
  };
};
