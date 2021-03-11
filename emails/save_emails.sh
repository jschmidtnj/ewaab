#!/bin/bash

# syncs generated email templates with aws s3 data
# need to be logged in to aws cli to use this script

set -e

target="s3://ewaab-emails/templates"
yarn run build
aws s3 sync dist "$target"
