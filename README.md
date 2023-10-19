<p align="center">
<img src="https://ipfscluster.io/cluster/png/IPFS_Cluster_color_no_text.png" alt="logo" width="300" height="300" />
</p>

# ipfs-cluster-ctl

[![](https://img.shields.io/badge/project-ipfs--cluster-ef5c43.svg?style=flat-square)](https://ipfscluster.io/documentation/reference/ctl/)

[IPFS Cluster](https://ipfscluster.io) provides data orchestration across a swarm of IPFS daemons by allocating, replicating and tracking a global pinset distributed among multiple peers.

The [ipfs-cluster-ctl](https://ipfscluster.io/documentation/reference/ctl/) command line application is a user-friendly REST API client for IPFS Cluster. It allows to perform all the operations supported by a Cluster peer:

## Install

Install the latest `ipfs-cluster-ctl` binary:

```sh
# Install globally
> npm install -g ipfs-cluster-ctl
> ipfs-cluster-ctl --version
ipfs-cluster-ctl version 1.0.7

# Install locally
> npm install ipfs-cluster-ctl
> ./node_modules/.bin/ipfs-cluster-ctl --version
ipfs-cluster-ctl version 1.0.7
```

## License

[MIT](LICENSE)
