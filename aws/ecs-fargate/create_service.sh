#!/bin/bash

set -e

aws ecs create-service --cli-input-json file://ewaab-service.json
