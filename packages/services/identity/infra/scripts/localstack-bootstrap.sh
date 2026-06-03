#!/usr/bin/env bash
set -euo pipefail

# LocalStack bootstrap script for identity service local development
# Provisions SQS queues, S3 buckets, Secrets Manager secrets, and EventBridge rules.

ENDPOINT="http://localhost:4566"
REGION="us-east-1"

echo "=== Waiting for LocalStack... ==="
for i in {1..30}; do
    if curl -sf "${ENDPOINT}/_localstack/health" > /dev/null 2>&1; then
        echo "LocalStack is ready"
        break
    fi
    echo "  attempt $i/30..."
    sleep 2
done

echo "=== Creating SQS Deletion Queue ==="
aws --endpoint-url="${ENDPOINT}" --region="${REGION}" sqs create-queue \
    --queue-name kitchensink-identity-deletion-local \
    --attributes '{"VisibilityTimeout":"120","MessageRetentionPeriod":"345600"}'

echo "=== Creating SQS DLQ ==="
aws --endpoint-url="${ENDPOINT}" --region="${REGION}" sqs create-queue \
    --queue-name kitchensink-identity-deletion-dlq-local

echo "=== Creating S3 Media Bucket ==="
aws --endpoint-url="${ENDPOINT}" --region="${REGION}" s3 mb s3://kitchensink-identity-media-local

echo "=== Creating S3 Archive Bucket ==="
aws --endpoint-url="${ENDPOINT}" --region="${REGION}" s3 mb s3://kitchensink-identity-archive-local

echo "=== Creating Secrets Manager Secret ==="
aws --endpoint-url="${ENDPOINT}" --region="${REGION}" secretsmanager create-secret \
    --name kitchensink/local/auth/keys \
    --secret-string '{"secretKey":"sk_test_local","publishableKey":"pk_test_local","webhookSigningSecret":"whsec_local"}'

echo "=== Creating DB Credentials Secret ==="
aws --endpoint-url="${ENDPOINT}" --region="${REGION}" secretsmanager create-secret \
    --name kitchensink/local/db/identity \
    --secret-string '{"username":"identity_app","password":"localdev","host":"postgres","port":"5432","dbname":"kitchensink_identity"}'

echo "=== Creating SSM Parameters ==="
aws --endpoint-url="${ENDPOINT}" --region="${REGION}" ssm put-parameter \
    --name /kitchensink/auth/jwks-url/local \
    --type String \
    --value "https://api.clerk.com/.well-known/jwks.json"

aws --endpoint-url="${ENDPOINT}" --region="${REGION}" ssm put-parameter \
    --name /kitchensink/auth/issuer/local \
    --type String \
    --value "https://clerk.local"

aws --endpoint-url="${ENDPOINT}" --region="${REGION}" ssm put-parameter \
    --name /kitchensink/auth/audience/local \
    --type String \
    --value "local-audience"

echo "=== LocalStack bootstrap complete ==="
