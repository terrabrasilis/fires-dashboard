#!/bin/bash
if [[ -f "/data/curl_get_json.sh" ]];
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

. ./data/curl_get_json.sh

# run nginx in foreground
nginx -g 'daemon off;'