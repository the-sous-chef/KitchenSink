import {
    CfnOutput,
    Duration,
    Stack,
    type StackProps,
    aws_apigateway as apigw,
    aws_certificatemanager as acm,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_lambda as lambda,
    aws_lambda_event_sources as lambda_event_sources,
    aws_logs as logs,
    aws_route53 as route53,
    aws_route53_targets as route53_targets,
    aws_ssm as ssm,
} from 'aws-cdk-lib';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Construct } from 'constructs';

import { SSM_BASE_PATHS } from './config.js';
import type { DataStack } from './data-stack.js';
import type { NetworkStack } from './network-stack.js';

export interface WebhooksStackProps extends StackProps {
    readonly network: NetworkStack;
    readonly data: DataStack;
    readonly certificate: acm.ICertificate;
    readonly hostedZone: route53.IHostedZone;
    readonly domainName: string;
    readonly stage: string;
}

export class WebhooksStack extends Stack {
    public readonly apiUrl: string;
    public readonly authorizerFn!: lambda.Function;

    public constructor(scope: Construct, id: string, props: WebhooksStackProps) {
        super(scope, id, props);

        const deployStage = props.stage;
        const isValidStage =
            ['dev', 'staging', 'prod', 'test'].includes(deployStage) ||
            deployStage.startsWith('sandbox-') ||
            deployStage.startsWith('mr-');
        if (!isValidStage) {
            throw new Error(`Invalid STAGE="${deployStage}". Must be dev, staging, prod, test, or sandbox-* / mr-*.`);
        }

        const currentFile = fileURLToPath(import.meta.url);
        const infraDir = path.dirname(currentFile);
        const possiblePaths = [
            path.resolve(infraDir, '../../../../services/identity-webhooks/dist'),
            path.resolve(infraDir, '../../../../packages/services/identity-webhooks/dist'),
        ];
        const distPath = possiblePaths.find((p) => existsSync(p)) ?? possiblePaths[0];
        const runtime = lambda.Runtime.NODEJS_22_X;
        const architecture = lambda.Architecture.ARM_64;
        const identityStage = deployStage === 'prod' ? 'prod' : 'sandbox';
        const derived = (basePath: string): string =>
            ssm.StringParameter.valueForStringParameter(this, `${basePath}/${identityStage}`);

        const commonEnv: Record<string, string> = {
            NODE_ENV: 'production',
            DB_SECRET_ARN: props.data.dbCredentialsSecret.secretArn,
            AUTH_SECRET_ARN: props.data.authSecretKey.secretArn,
            IDP_JWKS_URL: derived(SSM_BASE_PATHS.jwksUrl),
            IDP_ISSUER: derived(SSM_BASE_PATHS.issuer),
            IDP_AUDIENCE: derived(SSM_BASE_PATHS.audience),
            DELETION_QUEUE_URL: props.data.deletionQueue.queueUrl,
            DELETION_QUEUE_ARN: props.data.deletionQueue.queueArn,
            MEDIA_BUCKET_NAME: props.data.mediaBucket.bucketName,
            ARCHIVE_BUCKET_NAME: props.data.archiveBucket.bucketName,
        };

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
        props.data.authSecretKey.grantRead(authorizerRole);
        props.data.dbCredentialsSecret.grantRead(authorizerRole);

        const authorizerFn = new lambda.Function(this, 'AuthorizerFunction', {
            runtime,
            architecture,
            handler: 'authorizer/handler.handler',
            code: lambda.Code.fromAsset(distPath),
            role: authorizerRole,
            vpc: props.network.vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [props.network.lambdaSecurityGroup],
            timeout: Duration.seconds(10),
            memorySize: 256,
            environment: {
                NODE_ENV: 'production',
                AUTH_SECRET_ARN: props.data.authSecretKey.secretArn,
                DB_SECRET_ARN: props.data.dbCredentialsSecret.secretArn,
            },
            logGroup: authorizerLogGroup,
        });

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
        props.data.authSecretKey.grantRead(webhooksRole);
        props.data.deletionQueue.grantSendMessages(webhooksRole);
        props.data.deletionQueue.grantConsumeMessages(webhooksRole);
        props.data.mediaBucket.grantReadWrite(webhooksRole);
        props.data.archiveBucket.grantReadWrite(webhooksRole);

        const webhookFn = new lambda.Function(this, 'WebhookFunction', {
            runtime,
            architecture,
            handler: 'handlers/identityWebhook.handler',
            code: lambda.Code.fromAsset(distPath),
            role: webhooksRole,
            vpc: props.network.vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [props.network.lambdaSecurityGroup],
            timeout: Duration.seconds(30),
            memorySize: 512,
            environment: {
                ...commonEnv,
                WEBHOOK_SECRET_ARN: props.data.authSecretKey.secretArn,
            },
            logGroup: webhooksLogGroup,
        });

        const deletionWorkerFn = new lambda.Function(this, 'DeletionWorkerFunction', {
            runtime,
            architecture,
            handler: 'handlers/deletion-worker.handler',
            code: lambda.Code.fromAsset(distPath),
            role: webhooksRole,
            vpc: props.network.vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [props.network.lambdaSecurityGroup],
            timeout: Duration.seconds(30),
            memorySize: 512,
            environment: {
                ...commonEnv,
            },
            logGroup: webhooksLogGroup,
        });

        const reconciliationFn = new lambda.Function(this, 'ReconciliationFunction', {
            runtime,
            architecture,
            handler: 'handlers/reconciliation.handler',
            code: lambda.Code.fromAsset(distPath),
            role: webhooksRole,
            vpc: props.network.vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [props.network.lambdaSecurityGroup],
            timeout: Duration.seconds(60),
            memorySize: 512,
            environment: {
                ...commonEnv,
            },
            logGroup: webhooksLogGroup,
        });

        deletionWorkerFn.addEventSource(
            new lambda_event_sources.SqsEventSource(props.data.deletionQueue, {
                batchSize: 10,
                reportBatchItemFailures: true,
            }),
        );

        const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayAccessLogGroup', {
            retention: logs.RetentionDays.ONE_MONTH,
        });

        const api = new apigw.RestApi(this, 'IdentityWebhooksApi', {
            restApiName: `kitchensink-identity-webhooks-${props.stage}`,
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

        const customDomain = new apigw.DomainName(this, 'IdentityApiDomain', {
            domainName: props.domainName,
            certificate: props.certificate,
            endpointType: apigw.EndpointType.REGIONAL,
            securityPolicy: apigw.SecurityPolicy.TLS_1_2,
        });
        customDomain.addBasePathMapping(api, { stage: api.deploymentStage });

        new route53.ARecord(this, 'IdentityApiAliasRecord', {
            zone: props.hostedZone,
            recordName: props.domainName,
            target: route53.RecordTarget.fromAlias(new route53_targets.ApiGatewayDomain(customDomain)),
        });

        const requestAuthorizer = new apigw.RequestAuthorizer(this, 'IdentityRequestAuthorizer', {
            handler: authorizerFn,
            identitySources: [apigw.IdentitySource.header('Authorization')],
            resultsCacheTtl: Duration.seconds(300),
        });

        const webhookIntegration = new apigw.LambdaIntegration(webhookFn);

        const webhooksResource = api.root.addResource('webhooks');

        const usersWebhookResource = webhooksResource.addResource('users');
        usersWebhookResource.addMethod('POST', webhookIntegration, {
            authorizationType: apigw.AuthorizationType.NONE,
        });

        const v1Resource = api.root.addResource('v1');
        const usersResource = v1Resource.addResource('users');

        const upsertResource = usersResource.addResource('upsert');
        upsertResource.addMethod('POST', webhookIntegration, {
            authorizer: requestAuthorizer,
            authorizationType: apigw.AuthorizationType.CUSTOM,
        });

        const reconcileResource = usersResource.addResource('reconcile');
        reconcileResource.addMethod('GET', new apigw.LambdaIntegration(reconciliationFn), {
            authorizer: requestAuthorizer,
            authorizationType: apigw.AuthorizationType.CUSTOM,
        });

        const subResource = usersResource.addResource('{sub}');
        subResource.addMethod('DELETE', new apigw.LambdaIntegration(deletionWorkerFn), {
            authorizer: requestAuthorizer,
            authorizationType: apigw.AuthorizationType.CUSTOM,
        });

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

        const stage = props.stage;
        const ssmStage = stage === 'prod' ? 'prod' : 'sandbox';
        const derivedApiUrl = `https://${props.domainName}/v1/webhooks/users`;

        new ssm.StringParameter(this, 'SsmApiUrl', {
            parameterName: `/kitchensink/identity/${ssmStage}/webhooks/api-url`,
            stringValue: derivedApiUrl,
        });

        new ssm.StringParameter(this, 'SsmWebhookUrl', {
            parameterName: `/kitchensink/identity/${stage}/webhooks/webhook-url`,
            stringValue: derivedApiUrl,
        });

        new ssm.StringParameter(this, 'SsmAuthorizerFunctionArn', {
            parameterName: `/kitchensink/identity/${ssmStage}/webhooks/authorizer-function-arn`,
            stringValue: authorizerFn.functionArn,
        });

        new ssm.StringParameter(this, 'SsmWebhooksFunctionArn', {
            parameterName: `/kitchensink/identity/${ssmStage}/webhooks/webhooks-function-arn`,
            stringValue: webhookFn.functionArn,
        });

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
            value: webhookFn.functionArn,
            exportName: `${this.stackName}:IdentityWebhooksFunctionArn`,
        });

        this.authorizerFn = authorizerFn;
    }
}
