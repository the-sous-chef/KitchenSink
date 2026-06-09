import { config as dotenvConfig } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { App } from 'aws-cdk-lib';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: join(__dirname, '../../.env') });

import { DataStack } from '../lib/data-stack.js';
import { IdentityServiceStack } from '../lib/identity-service-stack.js';
import { NetworkStack } from '../lib/network-stack.js';

const app = new App();
const stage = app.node.tryGetContext('stage') ?? process.env.STAGE ?? 'dev';
const region = process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? 'us-east-1';
const account = process.env.CDK_DEFAULT_ACCOUNT ?? process.env.AWS_ACCOUNT_ID;
const domainName = process.env.DOMAIN_NAME;

if (!domainName) {
    throw new Error('DOMAIN_NAME env var is required');
}

const env = account ? { account, region } : { region };

const networkStack = new NetworkStack(app, `IdentityNetwork-${stage}`, {
    env,
    stackName: `kitchensink-identity-network-${stage}`,
});

const dataStack = new DataStack(app, `IdentityData-${stage}`, {
    env,
    stackName: `kitchensink-identity-data-${stage}`,
    network: networkStack,
    stage,
});

new IdentityServiceStack(app, `IdentityService-${stage}`, {
    env,
    stackName: `kitchensink-identity-service-${stage}`,
    network: networkStack,
    data: dataStack,
    imageTag: process.env.IDENTITY_IMAGE_TAG ?? 'latest',
    desiredCount: Number(process.env.IDENTITY_DESIRED_COUNT ?? 2),
});

app.synth();
