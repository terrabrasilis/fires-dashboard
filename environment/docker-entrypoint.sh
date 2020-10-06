#!/bin/bash
mv /usr/share/nginx/html/data/* /data/ \
&& rm -rf /usr/share/nginx/html/data \
&& ln -s /data /usr/share/nginx/html/data

# run nginx in foreground
nginx -g 'daemon off;'