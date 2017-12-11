#!/usr/bin/env node

const git = require("git-rev");
const fs = require("fs");
const originalPath = process.cwd();

git.short(function(str) {
  const versionNumber = process.env.VERSION ? process.env.VERSION : "dev";

  const build = {
    lastcommit: str,
    version: versionNumber ? versionNumber : "notspecifed"
  };

  fs.writeFile(`${originalPath}/build.json`, JSON.stringify(build), err => {
    if (err) {
      throw err;
    }
    console.log("Wrote build.json");
  });
});
