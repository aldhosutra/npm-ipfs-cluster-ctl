var test = require("tape");
var fs = require("fs");
var path = require("path");
var cp = require("child_process");
var ipfs = path.join(__dirname, "..", "bin", "ipfs-cluster-service");

test("ensure ipfs-cluster-service bin path exists", function (t) {
  t.plan(3);
  fs.stat(ipfs, function (err, stats) {
    t.error(err, "ipfs-cluster-service bin should stat witout error");
    cp.exec([ipfs, "version"].join(" "), function (err, stdout, stderr) {
      t.error(err, "ipfs-cluster-service runs without error");
      t.false(stderr, "no stderr output");
    });
  });
});
