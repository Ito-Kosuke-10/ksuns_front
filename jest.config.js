/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/jest.setup-env.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  modulePathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/.next/standalone/"],
  collectCoverage: true,
  collectCoverageFrom: ["lib/**/*.{ts,tsx}", "!lib/**/__tests__/**"],
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],
};

module.exports = createJestConfig(customJestConfig);
