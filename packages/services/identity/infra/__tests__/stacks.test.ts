import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, it, expect, beforeAll } from 'vitest';

import { DataStack } from '../lib/data-stack.js';
import { NetworkStack } from '../lib/network-stack.js';
import { IdentityServiceStack } from '../lib/identity-service-stack.js';

let dataTemplate: Template;
let serviceTemplate: Template;

beforeAll(() => {
    const app = new App({ context: { stage: 'test' } });

    const network = new NetworkStack(app, 'TestNetwork', {
        env: { account: '123456789012', region: 'us-east-1' },
    });

    const data = new DataStack(app, 'TestData', {
        env: { account: '123456789012', region: 'us-east-1' },
        network,
    });

    const service = new IdentityServiceStack(app, 'TestService', {
        env: { account: '123456789012', region: 'us-east-1' },
        network,
        data,
        imageTag: 'test',
        desiredCount: 1,
    });

    dataTemplate = Template.fromStack(data);
    serviceTemplate = Template.fromStack(service);
});

describe('No Auth0 references', () => {
    it('service stack JSON contains no AUTH0_DOMAIN', () => {
        const json = JSON.stringify(serviceTemplate.toJSON());
        expect(json).not.toContain('AUTH0_DOMAIN');
    });

    it('service stack JSON contains no AUTH0_CLIENT_ID', () => {
        const json = JSON.stringify(serviceTemplate.toJSON());
        expect(json).not.toContain('AUTH0_CLIENT_ID');
    });

    it('service stack JSON contains no AUTH0_CLIENT_SECRET', () => {
        const json = JSON.stringify(serviceTemplate.toJSON());
        expect(json).not.toContain('AUTH0_CLIENT_SECRET');
    });

    it('data stack JSON contains no auth0 in secret description', () => {
        const json = JSON.stringify(dataTemplate.toJSON());
        expect(json.toLowerCase()).not.toContain('auth0');
    });
});

describe('Identity env vars present', () => {
    it('service task has AUTH_SECRET_ARN env var', () => {
        const allFunctions = serviceTemplate.findResources('AWS::ECS::TaskDefinition');
        const hasIdentityKey = Object.values(allFunctions).some((task: any) =>
            (task.Properties?.ContainerDefinitions ?? []).some((container: any) =>
                (container.Environment ?? []).some((env: any) => env.Name === 'AUTH_SECRET_ARN'),
            ),
        );
        expect(hasIdentityKey).toBe(true);
    });
});
