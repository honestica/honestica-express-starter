#!/usr/bin/env node

const git = require('git-rev');
const fs = require('fs');
const originalPath = process.cwd();

git.short(function (str) {
  const build = {
    lastcommit: str,
    version: require(`${originalPath}/package.json`).version
  };

  fs.writeFile(`${originalPath}/build.json`, JSON.stringify(build), (err) => {
    if (err) {
      throw err;
    }
    console.log('Wrote build.json');
  });
})