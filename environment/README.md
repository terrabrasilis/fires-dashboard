# Docker for serve the dashboards for Experimental projects

Defines the environment to run a server for dashboard webapp.

This service load data from published layers via WFS server in JSON format.
To load data with more efficience we generate this JSON files using automated task and keep this files on disk, loading them directly.

## Run the docker

To build image for this dockerfile use this command:

```bash
docker build -t terrabrasilis/focuses-of-fires-dashboard:<version> -f environment/Dockerfile .
# or use the docker-build.sh script
./docker-build.sh
```

To run without compose and without shell terminal use this command:

```bash
docker run -d --rm -p 80:80 -v /data:/data --name terrabrasilis_dashboard_experimental terrabrasilis/focuses-of-fires-dashboard:<version>
```