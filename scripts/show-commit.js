#!/usr/bin/env node
// Node.js script to show git commit details
const { execSync } = require('child_process');

const commitHash = process.argv[2];

if (!commitHash) {
  console.error('Usage: node show-commit.js <commit-hash> [--stat] [--no-patch] [--fuller]');
  process.exit(1);
}

const args = process.argv.slice(2);
const gitArgs = ['show', ...args];

try {
  const output = execSync(`git ${gitArgs.join(' ')}`, {
    encoding: 'utf-8',
    stdio: 'inherit'
  });
} catch (error) {
  // Git command will output to stdout/stderr via stdio: 'inherit'
  process.exit(error.status || 1);
}

