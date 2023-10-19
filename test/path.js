var test = require("tape");
var fs = require("fs");
var path = require("path");
var cp = require("child_process");
var ipfs = path.join(__dirname, "..", "bin", "ipfs-cluster-ctl");

test("ensure ipfs-cluster-ctl bin path exists", function (t) {
  t.plan(4);
  fs.stat(ipfs, function (err, stats) {
    t.error(err, "ipfs-cluster-ctl bin should stat witout error");
    cp.exec([ipfs, "--version"].join(" "), function (err, stdout, stderr) {
      t.error(err, "ipfs-cluster-ctl runs without error");
      t.true(
        stdout.indexOf("ipfs-cluster-ctl version") >= 0,
        "ipfs-cluster-ctl version retreived"
      );
      t.false(stderr, "no stderr output");
    });
  });
});
