import {
    CfnOutput,
    Duration,
    Stack,
    type StackProps,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_iam as iam,
    aws_logs as logs,
} from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import type { DataStack } from './data-stack.js';
import type { NetworkStack } from './network-stack.js';

export interface IdentityServiceStackProps extends StackProps {
    readonly network: NetworkStack;
    readonly data: DataStack;
    readonly stage: string;
}

/**
 * @implements REQ-018..REQ-026 REQ-032..REQ-038 REQ-050 FR-018..FR-026 FR-032..FR-038 FR-041..FR-044 ARCH-014..ARCH-019 ARCH-032 MOD-014..MOD-019 MOD-032
 */
export class IdentityServiceStack extends Stack {
    public readonly serviceUrl: string;

    public constructor(scope: Construct, id: string, props: IdentityServiceStackProps) {
        super(scope, id, props);

        const deployStage = props.stage;

        const cluster = new ecs.Cluster(this, 'IdentityCluster', {
            vpc: props.network.vpc,
            clusterName: `kitchensink-identity-${deployStage}`,
        });

        const taskRole = new iam.Role(this, 'IdentityTaskRole', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            description: 'Task role for identity ECS service',
        });
        props.data.dbCredentialsSecret.grantRead(taskRole);
        props.data.authSecretKey.grantRead(taskRole);
        props.data.deletionQueue.grantSendMessages(taskRole);
        props.data.mediaBucket.grantReadWrite(taskRole);
        props.data.archiveBucket.grantReadWrite(taskRole);

        const executionRole = new iam.Role(this, 'IdentityExecutionRole', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            description: 'Execution role for identity ECS service',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
            ],
        });
        props.data.dbCredentialsSecret.grantRead(executionRole);

        const logGroup = new logs.LogGroup(this, 'IdentityServiceLogGroup', {
            retention: logs.RetentionDays.ONE_MONTH,
        });

        const image = ecs.ContainerImage.fromAsset('../../packages/services/identity', {
            file: 'Dockerfile',
        });

        const dbPassword = props.data.dbCredentialsSecret.secretValueFromJson('password').unsafeUnwrap();
        const dbHost = props.data.database.dbInstanceEndpointAddress;
        const dbPort = props.data.database.dbInstanceEndpointPort;
        const dbName = props.data.databaseName;
        const databaseUrl = `postgresql://identity_app:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

        const albService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'IdentityFargateService', {
            cluster,
            taskImageOptions: {
                image,
                containerPort: 3001,
                environment: {
                    NODE_ENV: 'production',
                    PORT: '3001',
                    STAGE: deployStage,
                    DATABASE_URL: databaseUrl,
                    DELETION_QUEUE_URL: props.data.deletionQueue.queueUrl,
                    AUTH_SECRET_ARN: props.data.authSecretKey.secretArn,
                },
                taskRole,
                executionRole,
                logDriver: ecs.LogDriver.awsLogs({
                    streamPrefix: 'identity',
                    logGroup,
                }),
            },
            desiredCount: 1,
            memoryLimitMiB: 512,
            cpu: 256,
            assignPublicIp: false,
            securityGroups: [props.network.serviceSecurityGroup],
            taskSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            healthCheckGracePeriod: Duration.seconds(60),
            circuitBreaker: { rollback: true },
        });

        albService.targetGroup.configureHealthCheck({
            path: '/health',
            port: '3001',
            healthyThresholdCount: 2,
            unhealthyThresholdCount: 3,
            timeout: Duration.seconds(5),
            interval: Duration.seconds(10),
        });

        albService.loadBalancer.addSecurityGroup(props.network.albSecurityGroup);

        this.serviceUrl = `http://${albService.loadBalancer.loadBalancerDnsName}`;

        new CfnOutput(this, 'ServiceUrl', {
            value: this.serviceUrl,
        });

        new CfnOutput(this, 'LoadBalancerDns', {
            value: albService.loadBalancer.loadBalancerDnsName,
        });
    }
}
