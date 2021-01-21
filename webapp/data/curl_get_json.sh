#!/bin/bash
# download data from geoserver
URL="http://terrabrasilis.dpi.inpe.br/geoserver/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0"
URL_PRODES=$URL"&OUTPUTFORMAT=application%2Fjson&TYPENAME=experimentals:fof_amz_d"
URL_CAR=$URL"&OUTPUTFORMAT=application%2Fjson&TYPENAME=experimentals:fof_car_d"
URL_DATE=$URL"&OUTPUTFORMAT=application%2Fjson&TYPENAME=experimentals:updated_date"

curl "$URL_PRODES" -H 'User-Agent: cURL from Focuses of Fires dashboard script' \
-H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
-H 'Accept-Language: en,en-US;q=0.5' \
--compressed -H 'Connection: keep-alive' \
-H 'Pragma: no-cache' -H 'Cache-Control: no-cache' > focuses-of-fires-prodes.json

curl "$URL_CAR" -H 'User-Agent: cURL from Focuses of Fires dashboard script' \
-H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
-H 'Accept-Language: en,en-US;q=0.5' \
--compressed -H 'Connection: keep-alive' \
-H 'Pragma: no-cache' -H 'Cache-Control: no-cache' > focuses-of-fires-car.json

curl "$URL_DATE" -H 'User-Agent: cURL from Focuses of Fires dashboard script' \
-H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
-H 'Accept-Language: en,en-US;q=0.5' \
--compressed -H 'Connection: keep-alive' \
-H 'Pragma: no-cache' -H 'Cache-Control: no-cache' > updated-date.json