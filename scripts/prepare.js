"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");

// Consumers installing from npm do not have this repo's .git directory.
// Git-dependency installs without devDependencies will not have Husky.
// In both cases, skip — never fail an install.
if (!fs.existsSync(path.join(root, ".git"))) {
  process.exit(0);
}

let huskyBin;
try {
  huskyBin = require.resolve("husky/bin.js");
} catch {
  process.exit(0);
}

const result = spawnSync(process.execPath, [huskyBin], {
  cwd: root,
  stdio: "inherit",
});

process.exit(result.status === null ? 1 : result.status);
