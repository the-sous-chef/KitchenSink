import {
    CfnOutput,
    Duration,
    Stack,
    type StackProps,
    aws_apigateway as apigw,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_lambda as lambda,
    aws_logs as logs,
    aws_ssm as ssm,
} from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import type { DataStack } from './data-stack.js';
import type { NetworkStack } from './network-stack.js';

export interface WebhooksStackProps extends StackProps {
    readonly network: NetworkStack;
    readonly data: DataStack;
}

/**
 * Provisions the identity-webhooks Lambda functions, the REQUEST authorizer,
 * and the API Gateway REST API that fronts them.
 *
 * Routes:
 *   POST   /v1/users/upsert                  — protected by authorizer
 *   DELETE /v1/users/{sub}                   — protected by authorizer
 *   GET    /v1/users/reconcile               — protected by authorizer
 *   POST   /webhooks/post-registration       — public (Auth0 calls this)
 *   POST   /webhooks/protected/profile       — protected by authorizer
 *
 * @implements REQ-039 REQ-040 REQ-042 REQ-050 REQ-IF-007 REQ-IF-009 FR-038 FR-039 FR-040 FR-042 ARCH-024 ARCH-031 MOD-024 MOD-031
 */
export class WebhooksStack extends Stack {
    public readonly apiUrl: string;

    public constructor(scope: Construct, id: string, props: WebhooksStackProps) {
        super(scope, id, props);

        // ── Shared Lambda configuration ──────────────────────────────────────
        const distPath = '../../services/identity-webhooks/dist';
        const runtime = lambda.Runtime.NODEJS_22_X;
        const architecture = lambda.Architecture.ARM_64;
        const commonEnv: Record<string, string> = {
            NODE_ENV: 'production',
            DB_SECRET_ARN: props.data.dbCredentialsSecret.secretArn,
            AUTH0_MANAGEMENT_SECRET_ARN: props.data.auth0ManagementSecret.secretArn,
            DELETION_QUEUE_URL: props.data.deletionQueue.queueUrl,
            DELETION_QUEUE_ARN: props.data.deletionQueue.queueArn,
            MEDIA_BUCKET_NAME: props.data.mediaBucket.bucketName,
            ARCHIVE_BUCKET_NAME: props.data.archiveBucket.bucketName,
        };

        // ── Authorizer Lambda ─────────────────────────────────────────────────
        const authorizerLogGroup = new logs.LogGroup(this, 'AuthorizerLogGroup', {
            retention: logs.RetentionDays.ONE_MONTH,
        });

        const authorizerRole = new iam.Role(this, 'AuthorizerLambdaRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Least-privilege execution role for identity authorizer Lambda',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
            ],
        });
        authorizerLogGroup.grantWrite(authorizerRole);
        props.data.auth0ManagementSecret.grantRead(authorizerRole);

        const authorizerFn = new lambda.Function(this, 'AuthorizerFunction', {
            runtime,
            architecture,
            handler: 'handlers/authorizer.handler',
            code: lambda.Code.fromAsset(distPath),
            role: authorizerRole,
            vpc: props.network.vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [props.network.lambdaSecurityGroup],
            timeout: Duration.seconds(10),
            memorySize: 256,
            environment: {
                NODE_ENV: 'production',
                AUTH0_MANAGEMENT_SECRET_ARN: props.data.auth0ManagementSecret.secretArn,
            },
            logGroup: authorizerLogGroup,
        });

        // ── Webhooks Lambdas (post-login upsert, post-registration, deletion-worker, reconciliation) ──
        const webhooksLogGroup = new logs.LogGroup(this, 'WebhooksLogGroup', {
            retention: logs.RetentionDays.ONE_MONTH,
        });

        const webhooksRole = new iam.Role(this, 'WebhooksLambdaRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Least-privilege execution role for identity-webhooks Lambda',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
            ],
        });
        webhooksLogGroup.grantWrite(webhooksRole);
        props.data.dbCredentialsSecret.grantRead(webhooksRole);
        props.data.auth0ManagementSecret.grantRead(webhooksRole);
        props.data.deletionQueue.grantSendMessages(webhooksRole);
        props.data.deletionQueue.grantConsumeMessages(webhooksRole);
        props.data.mediaBucket.grantReadWrite(webhooksRole);
        props.data.archiveBucket.grantReadWrite(webhooksRole);

        const webhooksFn = new lambda.Function(this, 'WebhooksFunction', {
            runtime,
            architecture,
            handler: 'handlers/post-registration.handler',
            code: lambda.Code.fromAsset(distPath),
            role: webhooksRole,
            vpc: props.network.vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [props.network.lambdaSecurityGroup],
            timeout: Duration.seconds(30),
            memorySize: 512,
            environment: commonEnv,
            logGroup: webhooksLogGroup,
        });

        const postLoginFn = new lambda.Function(this, 'PostLoginFunction', {
            runtime,
            architecture,
            handler: 'handlers/post-login.handler',
            code: lambda.Code.fromAsset(distPath),
            role: webhooksRole,
            vpc: props.network.vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [props.network.lambdaSecurityGroup],
            timeout: Duration.seconds(30),
            memorySize: 512,
            environment: commonEnv,
            logGroup: webhooksLogGroup,
        });

        // ── API Gateway REST API ──────────────────────────────────────────────
        const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayAccessLogGroup', {
            retention: logs.RetentionDays.ONE_MONTH,
        });

        const api = new apigw.RestApi(this, 'IdentityWebhooksApi', {
            restApiName: `kitchensink-identity-webhooks-${this.node.tryGetContext('stage') ?? process.env.STAGE ?? 'dev'}`,
            description: 'Identity webhooks and user management API',
            deployOptions: {
                stageName: 'v1',
                accessLogDestination: new apigw.LogGroupLogDestination(apiLogGroup),
                accessLogFormat: apigw.AccessLogFormat.jsonWithStandardFields(),
                loggingLevel: apigw.MethodLoggingLevel.ERROR,
                throttlingBurstLimit: 100,
                throttlingRateLimit: 50,
            },
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
                allowHeaders: ['Content-Type', 'Authorization'],
                allowMethods: apigw.Cors.ALL_METHODS,
            },
        });

        // REQUEST authorizer — 300 s cache, identity source = Authorization header
        const requestAuthorizer = new apigw.RequestAuthorizer(this, 'IdentityRequestAuthorizer', {
            handler: authorizerFn,
            identitySources: [apigw.IdentitySource.header('Authorization')],
            resultsCacheTtl: Duration.seconds(300),
        });

        const webhooksIntegration = new apigw.LambdaIntegration(webhooksFn);
        const postLoginIntegration = new apigw.LambdaIntegration(postLoginFn);

        // ── /webhooks ─────────────────────────────────────────────────────────
        const webhooksResource = api.root.addResource('webhooks');

        // POST /webhooks/post-registration  (public — Auth0 calls this)
        const postRegistrationResource = webhooksResource.addResource('post-registration');
        postRegistrationResource.addMethod('POST', webhooksIntegration, {
            authorizationType: apigw.AuthorizationType.NONE,
        });

        const postLoginResource = webhooksResource.addResource('post-login');
        postLoginResource.addMethod('POST', postLoginIntegration, {
            authorizer: requestAuthorizer,
            authorizationType: apigw.AuthorizationType.CUSTOM,
        });

        // POST /webhooks/protected/profile  (authorizer-protected)
        const protectedResource = webhooksResource.addResource('protected');
        const profileResource = protectedResource.addResource('profile');
        profileResource.addMethod('POST', webhooksIntegration, {
            authorizer: requestAuthorizer,
            authorizationType: apigw.AuthorizationType.CUSTOM,
        });

        // ── /v1/users ─────────────────────────────────────────────────────────
        const v1Resource = api.root.addResource('v1');
        const usersResource = v1Resource.addResource('users');

        // POST /v1/users/upsert  (authorizer-protected)
        const upsertResource = usersResource.addResource('upsert');
        upsertResource.addMethod('POST', postLoginIntegration, {
            authorizer: requestAuthorizer,
            authorizationType: apigw.AuthorizationType.CUSTOM,
        });

        // GET /v1/users/reconcile  (authorizer-protected)
        const reconcileResource = usersResource.addResource('reconcile');
        reconcileResource.addMethod('GET', webhooksIntegration, {
            authorizer: requestAuthorizer,
            authorizationType: apigw.AuthorizationType.CUSTOM,
        });

        // DELETE /v1/users/{sub}  (authorizer-protected)
        const subResource = usersResource.addResource('{sub}');
        subResource.addMethod('DELETE', webhooksIntegration, {
            authorizer: requestAuthorizer,
            authorizationType: apigw.AuthorizationType.CUSTOM,
        });

        // ── Gateway responses (CORS headers on 4xx/5xx) ───────────────────────
        api.addGatewayResponse('Default4xx', {
            type: apigw.ResponseType.DEFAULT_4XX,
            responseHeaders: {
                'Access-Control-Allow-Origin': "'*'",
                'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
            },
        });
        api.addGatewayResponse('Default5xx', {
            type: apigw.ResponseType.DEFAULT_5XX,
            responseHeaders: {
                'Access-Control-Allow-Origin': "'*'",
                'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
            },
        });

        this.apiUrl = api.url;

        // ── SSM parameters for cross-stack consumption ────────────────────────
        const stage = this.node.tryGetContext('stage') ?? process.env.STAGE ?? 'dev';

        new ssm.StringParameter(this, 'SsmApiUrl', {
            parameterName: `/kitchensink/identity/${stage}/webhooks/api-url`,
            stringValue: api.url,
            description: 'Identity webhooks API Gateway URL',
        });

        new ssm.StringParameter(this, 'SsmAuthorizerFunctionArn', {
            parameterName: `/kitchensink/identity/${stage}/webhooks/authorizer-function-arn`,
            stringValue: authorizerFn.functionArn,
            description: 'Identity authorizer Lambda ARN',
        });

        new ssm.StringParameter(this, 'SsmWebhooksFunctionArn', {
            parameterName: `/kitchensink/identity/${stage}/webhooks/webhooks-function-arn`,
            stringValue: webhooksFn.functionArn,
            description: 'Identity webhooks Lambda ARN',
        });

        // ── CloudFormation outputs ────────────────────────────────────────────
        new CfnOutput(this, 'IdentityWebhooksApiUrl', {
            value: api.url,
            exportName: `${this.stackName}:IdentityWebhooksApiUrl`,
        });
        new CfnOutput(this, 'IdentityWebhooksApiId', {
            value: api.restApiId,
            exportName: `${this.stackName}:IdentityWebhooksApiId`,
        });
        new CfnOutput(this, 'IdentityAuthorizerFunctionArn', {
            value: authorizerFn.functionArn,
            exportName: `${this.stackName}:IdentityAuthorizerFunctionArn`,
        });
        new CfnOutput(this, 'IdentityWebhooksFunctionArn', {
            value: webhooksFn.functionArn,
            exportName: `${this.stackName}:IdentityWebhooksFunctionArn`,
        });
    }
}
