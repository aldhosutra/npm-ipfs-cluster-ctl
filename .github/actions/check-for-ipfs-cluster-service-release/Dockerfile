FROM node:14

LABEL "com.github.actions.name"="Update and publish"
LABEL "com.github.actions.description"="Publish new version when a new ipfs-cluster-ctl version is relased"
LABEL "com.github.actions.icon"="rss"
LABEL "com.github.actions.color"="green"

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
