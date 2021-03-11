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
cp *.yml "$dist_folder"
cp -R lib/* "$dist_folder"

cd "$dist_folder"
yarn install --prod
zip -r "$output" *
mv "$output" ..

cd -
