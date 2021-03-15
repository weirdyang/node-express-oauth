module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {},
  overrides: [
    {
      files: ['*.test.js', 'test/**/*.js'],
      env: { mocha: true },
      rules: {
        'no-unused-expressions': 'off',
        'no-console': 'off',
        strict: ['error', 'never'],
        'linebreak-style': ['error', 'windows'],
      },
    },
  ],
};
