# Docker for serve the dashboards for Experimental projects

Defines the environment to run a server for dashboard webapp.

This service load data from published layers via WFS server in JSON format.
To load data with more efficience we generate this JSON files using automated task and keep this files on disk, loading them directly.

## Run the docker

To build image for this dockerfile use this command:

```bash
docker build -t terrabrasilis/dashboard-server:alpha -f environment/Dockerfile .
```

To run without compose and without shell terminal use this command:

```bash
docker run -d --rm -p 80:80 --name terrabrasilis_dashboard_experimental terrabrasilis/dashboard-server:alpha
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

## Run in your stack

For run as a service into a docker stack use the docker-stack.yaml