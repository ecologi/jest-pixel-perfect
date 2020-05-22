import { toBePixelPerfect } from './to-be-pixel-perfect';

import {
  JestPixelPerfectConfiguration,
  setDefaultConfiguration,
  restoreDefaultConfiguration,
} from './config';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBePixelPerfect(
        expected: string,
        configuration?: JestPixelPerfectConfiguration,
      ): Promise<R>;
    }
  }
}

// @ts-ignore
const jestExpect = global.expect;

if (jestExpect !== undefined) {
  jestExpect.extend({ toBePixelPerfect });
} else {
  console.error(
    "Unable to find Jest's global expect." +
      '\nPlease check you have added jest-extended correctly to your jest configuration.' +
      '\nSee https://github.com/mathieudutour/jest-pixel-perfect#setup for help.',
  );
}

export {
  toBePixelPerfect,
  JestPixelPerfectConfiguration,
  setDefaultConfiguration,
  restoreDefaultConfiguration,
};
