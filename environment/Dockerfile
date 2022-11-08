# To build image for this dockerfile use this command:
#   docker build -t terrabrasilis/focuses-of-fires-dashboard:vx.y.z -f environment/Dockerfile .
#
# To run without compose and without shell terminal use this command:
#   docker run -d --rm -p 80:80 --name terrabrasilis_focuses_of_fires terrabrasilis/focuses-of-fires-dashboard:vx.y.z
# 
# Information from doc of help about run one container without an explicit service. Run in background
# --------------------------------------------------------------------------------
# --rm,                      Tell to docker engine to remove container after container is stopped
# --name,                    Define one name for running container
# -d, --detach=false         Run container in background and print container ID
# -t, --tty=false            Allocate a pseudo-TTY
# --no-cache                 Ignore all cached intermediary layer
# --build-arg                Build args
# --------------------------------------------------------------------------------
#
#--------- Generic stuff all our Dockerfiles should start with -----------------------------
FROM nginx:latest

LABEL "br.inpe.dpi"="INPE/DPI-TerraBrasilis"
LABEL br.inpe.dpi.terrabrasilis="application"
LABEL author="Andre Carvalho"
LABEL author.email="andre.carvalho@inpe.br"
LABEL description="This container provides an http server including the webapp version for deploy the Focuses of Fires dashboards."
#-------------Application Specific Stuff ----------------------------------------------------

## Remove default nginx website
ARG VERSION="1.0"
RUN rm -rf /usr/share/nginx/html/* \
    && mkdir /data \
    && echo "{\"version\":\"${VERSION}\"}" > /usr/share/nginx/html/PROJECT_VERSION

COPY webapp/ /usr/share/nginx/html/
ADD environment/config/nginx.conf /etc/nginx/nginx.conf
ADD environment/config/403.html /usr/share/nginx/html/403.html
ADD environment/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN mv /usr/share/nginx/html/focuses-of-fires.html /usr/share/nginx/html/index.html \
    && chmod +x /usr/local/bin/docker-entrypoint.sh \
    && rm /docker-entrypoint.sh \
    && ln -s /usr/local/bin/docker-entrypoint.sh /

EXPOSE 80 443

VOLUME [ "/data" ]

ENTRYPOINT [ "/docker-entrypoint.sh" ]
