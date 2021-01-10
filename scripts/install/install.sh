#!/bin/bash

# abort on errors
set -e

cd ../..

# node
node_paths=("." "web/")

for path in "${node_paths[@]}"
do
  cd "$path"
  echo "install dependencies in $path"
  if ! [ -d node_modules ]; then
    if [ -f yarn.lock ]; then
      echo "using yarn package manager"
      yarn install
    else
      echo "using npm package manager"
      npm install
    fi
  else
    echo "node_modules already exists"
  fi
  cd -
done

# install golang dependencies
go_paths=()

for path in "${go_paths[@]}"
do
  cd "$path/src"
  echo "install dependencies in $path/"
  go get .
  cd -
done

cd scripts/install

# additional installs
./git_secrets.sh
./go_helpers.sh

cd -

# python
python_paths=()

for path in "${python_paths[@]}"
do
  cd "$path"
  echo "install dependencies in $path/"
  # fails if environment already exists
  conda env create --file ./environment.yml
  cd -
done
