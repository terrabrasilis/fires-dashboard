#!/bin/bash
if [[ -f "/data/disclaimer-pt-br.txt" ]];
then
    # File exists!
    rm -rf /usr/share/nginx/html/data \
    && ln -s /data /usr/share/nginx/html/data
else
    # File not found.
    mv /usr/share/nginx/html/data/* /data/ \
    && rm -rf /usr/share/nginx/html/data \
    && ln -s /data /usr/share/nginx/html/data
fi;

# run nginx in foreground
nginx -g 'daemon off;'