import { App } from 'aws-cdk-lib';

import { DataStack } from '../lib/data-stack.js';
import { IdentityServiceStack } from '../lib/identity-service-stack.js';
import { NetworkStack } from '../lib/network-stack.js';
import { WebhooksStack } from '../lib/webhooks-stack.js';

/**
 * @implements REQ-049 REQ-050 REQ-CN-008 FR-045 ARCH-027 ARCH-031 ARCH-032 MOD-027 MOD-031 MOD-032
 */
const app = new App();

const stage = app.node.tryGetContext('stage') ?? process.env.STAGE ?? 'dev';
const region = process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? 'us-east-1';
const account = process.env.CDK_DEFAULT_ACCOUNT ?? process.env.AWS_ACCOUNT_ID;

const env = account ? { account, region } : { region };

const networkStack = new NetworkStack(app, `IdentityNetwork-${stage}`, {
    env,
    description: 'KitchenSink identity network boundary',
    stackName: `kitchensink-identity-network-${stage}`,
});

const dataStack = new DataStack(app, `IdentityData-${stage}`, {
    env,
    description: 'KitchenSink identity data boundary',
    stackName: `kitchensink-identity-data-${stage}`,
    network: networkStack,
});

new IdentityServiceStack(app, `IdentityService-${stage}`, {
    env,
    description: 'KitchenSink identity ECS service boundary',
    stackName: `kitchensink-identity-service-${stage}`,
    network: networkStack,
    data: dataStack,
});

new WebhooksStack(app, `IdentityWebhooks-${stage}`, {
    env,
    description: 'KitchenSink identity webhooks — Lambda authorizer, API Gateway, webhooks handlers',
    stackName: `kitchensink-identity-webhooks-${stage}`,
    network: networkStack,
    data: dataStack,
});
