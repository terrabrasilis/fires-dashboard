#!/bin/bash

# Stopping all containers
#docker container stop terrabrasilis_focuses_of_fires

VERSION=$(git describe --tags --abbrev=0)
export VERSION
# build all images
docker build --no-cache -t terrabrasilis/focuses-of-fires-dashboard:$VERSION --build-arg VERSION=$VERSION --build-arg INDEX_FILE=focuses-of-fires -f environment/Dockerfile .

# send to dockerhub
docker login
docker push terrabrasilis/focuses-of-fires-dashboard:$VERSION

# If you want run containers, uncomment this lines
#docker run -d --rm -p 84:80 --name terrabrasilis_focuses_of_fires terrabrasilis/focuses-of-fires-dashboard:$VERSION
