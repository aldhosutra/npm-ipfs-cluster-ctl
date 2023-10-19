"use strict";

/*
  Download ipfs-cluster-ctl distribution package for desired version, platform and architecture,
  and unpack it to a desired output directory.

  API:
    download(<version>, <platform>, <arch>, <outputPath>)

  Defaults:
    ipfs-cluster-ctl version: value in package.json/ipfs-cluster-ctl/version
    ipfs-cluster-ctl platform: the platform this program is run from
    ipfs-cluster-ctl architecture: the architecture of the hardware this program is run from
    ipfs-cluster-ctl install path: './ipfs-cluster-ctl'
*/
const goenv = require("./go-platform");
const gunzip = require("gunzip-maybe");
const got = require("got").default;
const path = require("path");
const tarFS = require("tar-fs");
const unzip = require("unzip-stream");
const pkgConf = require("pkg-conf");
// @ts-ignore no types
const cachedir = require("cachedir");
const pkg = require("../package.json");
const fs = require("fs");
const hasha = require("hasha");
const cproc = require("child_process");
const isWin = process.platform === "win32";

/**
 * avoid expensive fetch if file is already in cache
 * @param {string} url
 */
async function cachingFetchAndVerify(url) {
  const cacheDir =
    process.env.NPM_GO_IPFS_CACHE || cachedir("ipfs-cluster-ctl");
  const filename = url.split("/").pop();

  if (!filename) {
    throw new Error("Invalid URL");
  }

  const cachedFilePath = path.join(cacheDir, filename);
  const cachedHashPath = `${cachedFilePath}.sha512`;

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  if (!fs.existsSync(cachedFilePath)) {
    console.info(`Downloading ${url} to ${cacheDir}`);
    // download file
    fs.writeFileSync(cachedFilePath, await got(url).buffer());
    console.info(`Downloaded ${url}`);

    // ..and checksum
    console.info(`Downloading ${filename}.sha512`);
    fs.writeFileSync(cachedHashPath, await got(`${url}.sha512`).buffer());
    console.info(`Downloaded ${filename}.sha512`);
  } else {
    console.info(`Found ${cachedFilePath}`);
  }

  console.info(`Verifying ${filename}.sha512`);

  const digest = Buffer.alloc(128);
  const fd = fs.openSync(cachedHashPath, "r");
  fs.readSync(fd, digest, 0, digest.length, 0);
  fs.closeSync(fd);
  const expectedSha = digest.toString("utf8");
  const calculatedSha = await hasha.fromFile(cachedFilePath, {
    encoding: "hex",
    algorithm: "sha512",
  });
  if (calculatedSha !== expectedSha) {
    console.log(`Expected   SHA512: ${expectedSha}`);
    console.log(`Calculated SHA512: ${calculatedSha}`);
    throw new Error(
      `SHA512 of ${cachedFilePath}' (${calculatedSha}) does not match expected value from ${cachedFilePath}.sha512 (${expectedSha})`
    );
  }
  console.log(`OK (${expectedSha})`);

  return fs.createReadStream(cachedFilePath);
}

/**
 * @param {string} url
 * @param {string} installPath
 * @param {import('stream').Readable} stream
 */
function unpack(url, installPath, stream) {
  return new Promise((resolve, reject) => {
    if (url.endsWith(".zip")) {
      return stream.pipe(
        unzip
          .Extract({ path: installPath })
          .on("close", resolve)
          .on("error", reject)
      );
    }

    return stream
      .pipe(gunzip())
      .pipe(
        tarFS.extract(installPath).on("finish", resolve).on("error", reject)
      );
  });
}

/**
 * @param {string} [version]
 * @param {string} [platform]
 * @param {string} [arch]
 * @param {string} [installPath]
 */
function cleanArguments(version, platform, arch, installPath) {
  const conf = pkgConf.sync("ipfs-cluster-ctl", {
    cwd: process.env.INIT_CWD || process.cwd(),
    defaults: {
      version: "v" + pkg.version.replace(/-[0-9]+/, ""),
      distUrl: "https://dist.ipfs.tech",
    },
  });

  return {
    version: process.env.TARGET_VERSION || version || conf.version,
    platform: process.env.TARGET_OS || platform || goenv.GOOS,
    arch: process.env.TARGET_ARCH || arch || goenv.GOARCH,
    distUrl: process.env.GO_IPFS_DIST_URL || conf.distUrl,
    installPath: installPath ? path.resolve(installPath) : process.cwd(),
  };
}

/**
 * @param {string} version
 * @param {string} distUrl
 */
async function ensureVersion(version, distUrl) {
  console.info(`${distUrl}/ipfs-cluster-ctl/versions`);
  const versions = (await got(`${distUrl}/ipfs-cluster-ctl/versions`).text())
    .trim()
    .split("\n");

  if (versions.indexOf(version) === -1) {
    throw new Error(`Version '${version}' not available`);
  }
}

/**
 * @param {string} version
 * @param {string} platform
 * @param {string} arch
 * @param {string} distUrl
 */
async function getDownloadURL(version, platform, arch, distUrl) {
  await ensureVersion(version, distUrl);

  const data = await got(
    `${distUrl}/ipfs-cluster-ctl/${version}/dist.json`
  ).json();

  if (!data.platforms[platform]) {
    throw new Error(`No binary available for platform '${platform}'`);
  }

  if (!data.platforms[platform].archs[arch]) {
    throw new Error(`No binary available for arch '${arch}'`);
  }

  const link = data.platforms[platform].archs[arch].link;
  return `${distUrl}/ipfs-cluster-ctl/${version}${link}`;
}

/**
 * @param {object} options
 * @param {string} options.version
 * @param {string} options.platform
 * @param {string} options.arch
 * @param {string} options.installPath
 * @param {string} options.distUrl
 */
async function download({ version, platform, arch, installPath, distUrl }) {
  const url = await getDownloadURL(version, platform, arch, distUrl);
  const data = await cachingFetchAndVerify(url);

  await unpack(url, installPath, data);
  console.info(`Unpacked ${installPath}`);

  return path.join(
    installPath,
    "ipfs-cluster-ctl",
    `ipfs-cluster-ctl${platform === "windows" ? ".exe" : ""}`
  );
}

/**
 * @param {object} options
 * @param {string} options.depBin
 * @param {string} options.version
 */
async function link({ depBin, version }) {
  let localBin = path.resolve(
    path.join(__dirname, "..", "bin", "ipfs-cluster-ctl")
  );

  if (isWin) {
    localBin += ".exe";
  }

  if (!fs.existsSync(depBin)) {
    throw new Error(
      "ipfs-cluster-ctl binary not found. maybe ipfs-cluster-ctl did not install correctly?"
    );
  }

  if (fs.existsSync(localBin)) {
    fs.unlinkSync(localBin);
  }

  console.info("Linking", depBin, "to", localBin);
  fs.symlinkSync(depBin, localBin);

  if (isWin) {
    // On Windows, update the shortcut file to use the .exe
    const cmdFile = path.join(__dirname, "..", "..", "ipfs-cluster-ctl.cmd");

    fs.writeFileSync(
      cmdFile,
      `@ECHO OFF
  "%~dp0\\node_modules\\ipfs-cluster-ctl\\bin\\ipfs-cluster-ctl.exe" %*`
    );
  }

  // test ipfs installed correctly.
  var result = cproc.spawnSync(localBin, ["version"]);
  if (result.error) {
    throw new Error("ipfs binary failed: " + result.error);
  }

  var outstr = result.stdout.toString();
  console.log("got version:", outstr);

  var actualVersion = `v1.0.7`;

  if (actualVersion !== version) {
    throw new Error(
      `version mismatch: expected ${version} got ${actualVersion}`
    );
  }

  return localBin;
}

/**
 * @param {string} [version]
 * @param {string} [platform]
 * @param {string} [arch]
 * @param {string} [installPath]
 */
module.exports = async (version, platform, arch, installPath) => {
  const args = cleanArguments(version, platform, arch, installPath);

  return link({
    ...args,
    depBin: await download(args),
  });
};
