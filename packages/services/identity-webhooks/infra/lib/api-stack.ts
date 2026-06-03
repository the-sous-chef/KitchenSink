import {
    CfnOutput,
    Duration,
    Stack,
    type StackProps,
    aws_apigateway as apigw,
    aws_lambda as lambda,
    aws_logs as logs,
    aws_ssm as ssm,
} from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import type { DataStack } from './data-stack.js';
import type { NetworkStack } from './network-stack.js';

export interface ApiStackProps extends StackProps {
    readonly network: NetworkStack;
    readonly data: DataStack;
    readonly serviceUrl: string;
    readonly stage: string;
    readonly authorizerFn: lambda.IFunction;
}

/**
 * @implements REQ-039 REQ-040 REQ-042 REQ-050 FR-038..FR-043 ARCH-009 ARCH-032 MOD-009 MOD-032
 */
export class ApiStack extends Stack {
    public readonly apiUrl: string;

    public constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        const deployStage = props.stage;

        const apiLogGroup = new logs.LogGroup(this, 'IdentityApiLogGroup', {
            retention: logs.RetentionDays.ONE_MONTH,
        });

        const api = new apigw.RestApi(this, 'IdentityApi', {
            restApiName: `kitchensink-identity-api-${deployStage}`,
            description: 'Identity REST API consumed by web and mobile clients',
            deployOptions: {
                stageName: deployStage,
                accessLogDestination: new apigw.LogGroupLogDestination(apiLogGroup),
                accessLogFormat: apigw.AccessLogFormat.jsonWithStandardFields(),
                loggingLevel: apigw.MethodLoggingLevel.ERROR,
                throttlingBurstLimit: 200,
                throttlingRateLimit: 100,
            },
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
                allowHeaders: ['Content-Type', 'Authorization'],
                allowMethods: apigw.Cors.ALL_METHODS,
            },
        });

        const requestAuthorizer = new apigw.RequestAuthorizer(this, 'IdentityApiAuthorizer', {
            handler: props.authorizerFn,
            identitySources: [apigw.IdentitySource.header('Authorization')],
            resultsCacheTtl: Duration.seconds(300),
        });

        const ecsIntegration = new apigw.HttpIntegration(props.serviceUrl, {
            httpMethod: 'ANY',
            options: {
                requestParameters: {
                    'integration.request.path.proxy': 'method.request.path.proxy',
                },
            },
        });

        const proxyResource = api.root.addResource('{proxy+}');
        proxyResource.addMethod('ANY', ecsIntegration, {
            authorizer: requestAuthorizer,
            authorizationType: apigw.AuthorizationType.CUSTOM,
            requestParameters: {
                'method.request.path.proxy': true,
            },
        });

        api.root.addMethod('ANY', ecsIntegration, {
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

        new ssm.StringParameter(this, 'SsmApiUrl', {
            parameterName: `/kitchensink/identity/${deployStage}/api/url`,
            stringValue: this.apiUrl,
        });

        new CfnOutput(this, 'ApiUrl', {
            value: this.apiUrl,
        });
    }
}
