# To build image for this dockerfile use this command:
#   docker build -t terrabrasilis/focuses-of-fires-dashboard:vx.y.z --build-arg INDEX_FILE=focuses-of-fires -f environment/Dockerfile .
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

ARG VERSION="1.0"
LABEL "br.inpe.dpi"="INPE/DPI-TerraBrasilis"
LABEL br.inpe.dpi.terrabrasilis="application"
LABEL version=${VERSION}
LABEL author="Andre Carvalho"
LABEL author.email="andre.carvalho@inpe.br"
LABEL description="This container provides an http server including the webapp version for deploy the Focuses of Fires dashboards."
#-------------Application Specific Stuff ----------------------------------------------------

## Remove default nginx website
RUN rm -rf /usr/share/nginx/html/* \
&& mkdir /data

COPY environment/config/nginx.conf /etc/nginx/nginx.conf
COPY environment/config/403.html /usr/share/nginx/html/403.html

COPY webapp/ /usr/share/nginx/html/

ARG INDEX_FILE=focuses-of-fires
ENV INDEX_FILE_NAME=$INDEX_FILE

RUN mv /usr/share/nginx/html/$INDEX_FILE_NAME.html /usr/share/nginx/html/index.html

ADD environment/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && rm /docker-entrypoint.sh \
    && ln -s /usr/local/bin/docker-entrypoint.sh /

EXPOSE 80 443

VOLUME [ "/data" ]

ENTRYPOINT [ "/docker-entrypoint.sh" ]
