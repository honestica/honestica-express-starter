#!/usr/bin/env node

const git = require('git-rev');
const fs = require('fs');
const originalPath = process.cwd();

git.short(function (str) {

  const versionFile = fs.readFileSync(`${originalPath}/pom.xml`, 'utf-8');
  const regex = /<version>(.*)<\/version><!-- converted by expand_version, don't delete this comment -->/
  const versionNumber = versionFile.match(regex);

  const build = {
    lastcommit: str,
    version: versionNumber[1] ? versionNumber[1] : 'notspecifed'
  };

  fs.writeFile(`${originalPath}/build.json`, JSON.stringify(build), (err) => {
    if (err) {
      throw err;
    }
    console.log('Wrote build.json');
  });
})
