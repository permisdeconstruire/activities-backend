#!/bin/bash
source /dev/null
cd /root

indices=( "mongodb_promotions" "mongodb_parcours" "mongodb_pedagogy" "mongodb_activities" "mongodb_pilotes" "mongodb_copilotes" "mongodb_forms" "mongodb_cooperators" "pdc" )
export BOTO_CONFIG="/root/.boto"

for i in "${indices[@]}"
do
  echo "Dumping $i"
  rm /tmp/$i.json
  elasticdump --input http://127.0.0.1:9200/$i --output /tmp/$i.json --type=data
  HASH=`sha256sum /tmp/$i.json | cut -d' ' -f1`
  gzip -c /tmp/$i.json > /tmp/$HASH.json.gz
  /root/google-cloud-sdk/bin/gsutil cp /tmp/$HASH.json.gz gs://pdc_backups/
  /root/google-cloud-sdk/bin/gsutil cp gs://pdc_backups/$HASH.json.gz gs://pdc_backups/${i}_latest.json.gz
done
