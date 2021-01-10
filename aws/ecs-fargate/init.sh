#!/bin/sh

# see https://aws.amazon.com/blogs/compute/securing-credentials-using-aws-secrets-manager-with-aws-fargate/

REGION=us-east-1

# login to aws
# aws configure

# create roles:
aws iam create-role --region $REGION --role-name ewaab-task-role --assume-role-policy-document file://ewaab-ecs-task-role-trust-policy.json
aws iam create-role --region $REGION --role-name ewaab-task-execution-role --assume-role-policy-document file://ewaab-ecs-task-role-trust-policy.json

# update roles:
aws iam put-role-policy --region $REGION --role-name ewaab-task-role --policy-name ewaab-iam-policy-task-role --policy-document file://ewaab-iam-policy-task-role.json
aws iam put-role-policy --region $REGION --role-name ewaab-task-execution-role --policy-name ewaab-iam-policy-task-execution-role --policy-document file://ewaab-iam-policy-task-execution-role.json
