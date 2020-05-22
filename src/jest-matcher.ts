import * as Utils from 'jest-matcher-utils';

export type JestMatcher = {
  isNot: boolean;
  promise: 'rejects' | 'resolves' | '';
  equals(a: any, b: any): boolean;
  expand: boolean;
  utils: typeof Utils;
  testPath: string;
  currentTestName: string;
};

export interface MatcherResult {
  message(): string;
  pass: boolean;
  actual?: string;
  expected?: string;
}
