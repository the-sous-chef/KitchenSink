# Identity Infra Environment Contract

<!-- @implements REQ-049 REQ-050 REQ-CN-008 FR-045 ARCH-027 ARCH-031 ARCH-032 MOD-027 MOD-031 MOD-032 -->

## Stage to account/tenant mapping

| Stage     | AWS Account (example) | Region      | Auth0 Tenant          | Purpose                              |
| --------- | --------------------- | ----------- | --------------------- | ------------------------------------ |
| `local`   | n/a (LocalStack)      | `us-east-1` | Local dev tenant      | Local integration and webhook replay |
| `dev`     | `111111111111`        | `us-east-1` | `kitchensink-dev`     | Shared team development              |
| `staging` | `222222222222`        | `us-east-1` | `kitchensink-staging` | Pre-prod validation                  |
| `prod`    | `333333333333`        | `us-east-1` | `kitchensink-prod`    | Production                           |

## Required CDK environment variables

| Variable                 | Required        | Description                                           |
| ------------------------ | --------------- | ----------------------------------------------------- |
| `STAGE`                  | yes             | Deployment stage (`local`, `dev`, `staging`, `prod`)  |
| `AWS_REGION`             | yes             | Target AWS region                                     |
| `AWS_ACCOUNT_ID`         | yes (non-local) | Target AWS account                                    |
| `IDENTITY_IMAGE_TAG`     | optional        | ECS image tag for identity service (`latest` default) |
| `IDENTITY_DESIRED_COUNT` | optional        | ECS desired count (`2` default)                       |

## Required Serverless environment variables

| Variable      | Required | Description                               |
| ------------- | -------- | ----------------------------------------- |
| `STAGE`       | yes      | Serverless stage, must match CDK stage    |
| `AWS_REGION`  | yes      | API Gateway/Lambda region                 |
| `AWS_PROFILE` | optional | Named profile for deploy/print operations |

## Secret contracts (managed in AWS Secrets Manager)

### `IdentityDatabaseCredentialsSecret`

```json
{
    "username": "identity_app",
    "password": "<generated>"
}
```

### `IdentityAuth0ManagementSecret`

```json
{
    "domain": "<tenant-domain>",
    "audience": "https://<tenant>/api/v2/",
    "clientId": "<m2m-client-id>",
    "clientSecret": "<m2m-client-secret>"
}
```

### `IdentityMigrationPlanSecret`

```json
{
    "bootstrapSql": "CREATE EXTENSION IF NOT EXISTS pg_trgm;",
    "migrationOwner": "@kitchensink/identity-service"
}
```

## LocalStack contract

- LocalStack Community only (`sqs`, `s3`, `events`)
- Postgres 16 container provides local SQL backend
- `npm run dev:local` brings infra up, waits for health, and applies local bootstrap SQL
