# KitchenSink Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-14

## Active Technologies

- TypeScript 5.x, Node.js 22.x (Lambda runtime) + `@auth0/nextjs-auth0` v4.x (web), `react-native-auth0` v5.5.0 (mobile, Expo 53+ compatible — PR #1147), `expo-secure-store` (mobile token storage), `jwks-rsa` (authorizer), `jose` (JWT verification), `@aws-sdk/client-sqs` (SQS), `@sentry/aws-serverless`, `@aws-lambda-powertools/logger`, CDK v2 (`aws-cdk-lib`) (002-auth0-user-auth)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x, Node.js 22.x (Lambda runtime): Follow standard conventions

## Recent Changes

- 002-auth0-user-auth: Added TypeScript 5.x, Node.js 22.x (Lambda runtime) + `@auth0/nextjs-auth0` v4.x (web), `react-native-auth0` v5.5.0 (mobile, Expo 53+ compatible — PR #1147), `expo-secure-store` (mobile token storage), `jwks-rsa` (authorizer), `jose` (JWT verification), `@aws-sdk/client-sqs` (SQS), `@sentry/aws-serverless`, `@aws-lambda-powertools/logger`, CDK v2 (`aws-cdk-lib`)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
