#!/bin/bash

# abort on errors
set -e

cd "../$1"

output="dist.zip"
dist_folder="dist"

rm -rf "$dist_folder" "$output"

mkdir "$dist_folder"
cp package.json "$dist_folder"
cp yarn.lock "$dist_folder"

count=`ls -1 .*.yml 2>/dev/null | wc -l`
if [ $count != 0 ]
then 
  cp .*.yml "$dist_folder"
fi 

cp -R lib/* "$dist_folder"

cd "$dist_folder"
yarn install --prod
zip -r "$output" *
mv "$output" ..

cd -
