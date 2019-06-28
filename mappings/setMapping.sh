#!/bin/bash

for f in ./mapping_*
do
  index=$(echo $f | cut -d'_' -f2- | cut -d'.' -f1)
  curl http://127.0.0.1:9201/$index?pretty -X PUT -H 'Content-Type: application/json' --data @$f
  echo '--'
done
