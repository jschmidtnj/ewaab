#!/bin/bash

# note - script currently works for python and node.
# does not update java dependencies - this needs to be done manually.

# abort on errors
set -e

cd ..

node_paths=("." "web/")

for path in "${node_paths[@]}"
do
  cd "$path"
  npx npm-check-updates -u
  if [ -f yarn.lock ]; then
    echo "using yarn package manager"
    rm -f package-lock.json
    yarn install
  else
    echo "using npm package manager"
    npm install
  fi
  cd -
done

python_paths=()

source $(conda info --base)/etc/profile.d/conda.sh
for path in "${python_paths[@]}"
do
  cd "$path"
  env_name=$(grep 'name:' environment.yml | cut -d ' ' -f 2)
  conda activate $env_name
  conda env update --file environment.yml --prune
  conda env export --no-builds | grep -v "^prefix: " > environment.yml
  conda deactivate
  cd -
done

go_paths=()

for path in "${go_paths[@]}"
do
  cd "$path/src"
  go get -u
  cd -
done

cd scripts
