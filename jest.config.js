module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '.*\\.test.(j|t)sx?$',
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/lib',
    '<rootDir>/example',
  ],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
