# Docker for serve the dashboard

Defines the environment to run a server for dashboard webapp.

This service load data from published layers via WFS server in JSON format.
To load data with more efficience we generate this JSON files using automated task and keep this files on disk, loading them directly.

## Build the docker image

To build image for this dockerfile use this command:

 > Remember to update the project's version number to avoid overwriting the previous image.
 Use the PROJECT_VERSION file.

```bash
./docker-build.sh
```

## Run using compose

Are two ways for run this service using docker-compose.

### To run in atached mode

```bash
docker-compose -f environment/docker-compose.yml up
```

### To run in detached mode

```bash
docker-compose -f environment/docker-compose.yml up -d
```

## Run in your stack like Swarm

For run as a service into a docker stack go to the [Stack files repository](https://github.com/terrabrasilis/docker-stacks).

The docker stack for this services is the experimental-dashboards-stack.yaml