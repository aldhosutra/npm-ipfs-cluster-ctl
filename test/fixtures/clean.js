"use strict";

const fs = require("fs-extra");
const path = require("path");
const execa = require("execa");

module.exports = async function clean() {
  await fs.remove(path.resolve(__dirname, "../../ipfs-cluster-service"));
  await execa("git", [
    "checkout",
    "--",
    path.resolve(__dirname, "../../bin/ipfs-cluster-service"),
  ]);
};
