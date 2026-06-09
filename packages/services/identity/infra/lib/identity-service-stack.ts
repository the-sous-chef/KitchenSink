import {
    CfnOutput,
    Duration,
    Stack,
    type StackProps,
    aws_cloudwatch as cloudwatch,
    aws_ec2 as ec2,
    aws_ecr as ecr,
    aws_ecs as ecs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_iam as iam,
    aws_logs as logs,
} from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import type { DataStack } from './data-stack.js';
import type { NetworkStack } from './network-stack.js';

export interface IdentityServiceStackProps extends StackProps {
    readonly network: NetworkStack;
    readonly data: DataStack;
    readonly imageTag: string;
    readonly desiredCount: number;
}

/**
 * @implements REQ-018 REQ-019 REQ-020 REQ-021 REQ-022 REQ-023 REQ-024 REQ-035 REQ-036 REQ-037 REQ-038 REQ-050 FR-018 FR-019 FR-020 FR-021 FR-022 FR-023 FR-024 FR-035 FR-036 FR-037 FR-038 ARCH-015 ARCH-016 ARCH-026 ARCH-031 MOD-015 MOD-016 MOD-026 MOD-031
 */
export class IdentityServiceStack extends Stack {
    public constructor(scope: Construct, id: string, props: IdentityServiceStackProps) {
        super(scope, id, props);

        const imageTag = props.imageTag;
        const desiredCount = props.desiredCount;
        const repository = new ecr.Repository(this, 'IdentityServiceRepository', {
            imageScanOnPush: true,
            imageTagMutability: ecr.TagMutability.MUTABLE,
            lifecycleRules: [
                {
                    maxImageCount: 25,
                },
            ],
        });

        const cluster = new ecs.Cluster(this, 'IdentityServiceCluster', {
            vpc: props.network.vpc,
            containerInsightsV2: ecs.ContainerInsights.ENHANCED,
        });

        const taskExecutionRole = new iam.Role(this, 'IdentityTaskExecutionRole', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
            ],
        });

        const taskRole = new iam.Role(this, 'IdentityTaskRole', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            description: 'Least-privilege runtime role for identity service',
        });

        props.data.dbCredentialsSecret.grantRead(taskRole);
        props.data.authSecretKey.grantRead(taskRole);
        props.data.migrationPlanSecret.grantRead(taskRole);
        props.data.deletionQueue.grantConsumeMessages(taskRole);
        props.data.mediaBucket.grantReadWrite(taskRole);
        props.data.archiveBucket.grantReadWrite(taskRole);

        const taskDefinition = new ecs.FargateTaskDefinition(this, 'IdentityTaskDefinition', {
            cpu: 512,
            memoryLimitMiB: 1024,
            runtimePlatform: {
                operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
                cpuArchitecture: ecs.CpuArchitecture.ARM64,
            },
            executionRole: taskExecutionRole,
            taskRole,
        });

        const logGroup = new logs.LogGroup(this, 'IdentityServiceLogGroup', {
            retention: logs.RetentionDays.ONE_MONTH,
        });

        taskDefinition.addContainer('IdentityServiceContainer', {
            image: ecs.ContainerImage.fromEcrRepository(repository, imageTag),
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: 'identity-service',
                logGroup,
            }),
            environment: {
                NODE_ENV: 'production',
                PORT: '3000',
                DB_HOST: props.data.database.dbInstanceEndpointAddress,
                DB_PORT: props.data.database.dbInstanceEndpointPort,
                DB_NAME: props.data.databaseName,
                DELETION_QUEUE_URL: props.data.deletionQueue.queueUrl,
                MEDIA_BUCKET_NAME: props.data.mediaBucket.bucketName,
                ARCHIVE_BUCKET_NAME: props.data.archiveBucket.bucketName,
                AUTH_SECRET_ARN: props.data.authSecretKey.secretArn,
            },
            secrets: {
                DB_USERNAME: ecs.Secret.fromSecretsManager(props.data.dbCredentialsSecret, 'username'),
                DB_PASSWORD: ecs.Secret.fromSecretsManager(props.data.dbCredentialsSecret, 'password'),
                AUTH_PUBLISHABLE_KEY: ecs.Secret.fromSecretsManager(props.data.authSecretKey, 'publishableKey'),
            },
            portMappings: [
                {
                    containerPort: 3000,
                },
            ],
            healthCheck: {
                command: ['CMD-SHELL', 'curl -f http://localhost:3000/health || exit 1'],
                interval: Duration.seconds(30),
                timeout: Duration.seconds(5),
                retries: 3,
                startPeriod: Duration.seconds(30),
            },
        });

        const service = new ecs.FargateService(this, 'IdentityService', {
            cluster,
            taskDefinition,
            desiredCount,
            assignPublicIp: false,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroups: [props.network.serviceSecurityGroup],
            minHealthyPercent: 50,
            maxHealthyPercent: 200,
            healthCheckGracePeriod: Duration.seconds(60),
            circuitBreaker: {
                rollback: true,
            },
        });

        const scalableTarget = service.autoScaleTaskCount({
            minCapacity: 2,
            maxCapacity: 6,
        });
        scalableTarget.scaleOnCpuUtilization('IdentityServiceCpuScaling', {
            targetUtilizationPercent: 60,
            scaleInCooldown: Duration.minutes(2),
            scaleOutCooldown: Duration.minutes(1),
        });

        const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'IdentityServiceAlb', {
            vpc: props.network.vpc,
            internetFacing: true,
            securityGroup: props.network.albSecurityGroup,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,
            },
        });

        const listener = loadBalancer.addListener('IdentityServiceListener', {
            port: 80,
            open: true,
        });

        const targetGroup = listener.addTargets('IdentityServiceTargets', {
            port: 3000,
            protocol: elbv2.ApplicationProtocol.HTTP,
            targets: [service.loadBalancerTarget({ containerName: 'IdentityServiceContainer', containerPort: 3000 })],
            healthCheck: {
                enabled: true,
                path: '/health',
                healthyHttpCodes: '200',
                interval: Duration.seconds(30),
                timeout: Duration.seconds(5),
                healthyThresholdCount: 2,
                unhealthyThresholdCount: 3,
            },
        });

        new cloudwatch.Alarm(this, 'IdentityAlb5xxAlarm', {
            metric: loadBalancer.metrics.httpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT, {
                period: Duration.minutes(5),
                statistic: 'sum',
            }),
            threshold: 5,
            evaluationPeriods: 1,
            datapointsToAlarm: 1,
            alarmDescription: 'Identity ALB target 5xx alarm',
        });

        new cloudwatch.Alarm(this, 'IdentityServiceHighCpuAlarm', {
            metric: service.metricCpuUtilization({
                period: Duration.minutes(5),
                statistic: 'avg',
            }),
            threshold: 80,
            evaluationPeriods: 2,
            datapointsToAlarm: 2,
            alarmDescription: 'Identity ECS CPU high-water mark',
        });

        new CfnOutput(this, 'IdentityEcrRepositoryUri', {
            value: repository.repositoryUri,
            exportName: `${this.stackName}:IdentityEcrRepositoryUri`,
        });
        new CfnOutput(this, 'IdentityClusterArn', {
            value: cluster.clusterArn,
            exportName: `${this.stackName}:IdentityClusterArn`,
        });
        new CfnOutput(this, 'IdentityServiceArn', {
            value: service.serviceArn,
            exportName: `${this.stackName}:IdentityServiceArn`,
        });
        new CfnOutput(this, 'IdentityTaskExecutionRoleArn', {
            value: taskExecutionRole.roleArn,
            exportName: `${this.stackName}:IdentityTaskExecutionRoleArn`,
        });
        new CfnOutput(this, 'IdentityTaskRoleArn', {
            value: taskRole.roleArn,
            exportName: `${this.stackName}:IdentityTaskRoleArn`,
        });
        new CfnOutput(this, 'IdentityAlbArn', {
            value: loadBalancer.loadBalancerArn,
            exportName: `${this.stackName}:IdentityAlbArn`,
        });
        new CfnOutput(this, 'IdentityAlbDnsName', {
            value: loadBalancer.loadBalancerDnsName,
            exportName: `${this.stackName}:IdentityAlbDnsName`,
        });
        new CfnOutput(this, 'IdentityAlbListenerArn', {
            value: listener.listenerArn,
            exportName: `${this.stackName}:IdentityAlbListenerArn`,
        });
        new CfnOutput(this, 'IdentityAlbTargetGroupArn', {
            value: targetGroup.targetGroupArn,
            exportName: `${this.stackName}:IdentityAlbTargetGroupArn`,
        });
        new CfnOutput(this, 'IdentityServiceLogGroupName', {
            value: logGroup.logGroupName,
            exportName: `${this.stackName}:IdentityServiceLogGroupName`,
        });
    }
}
