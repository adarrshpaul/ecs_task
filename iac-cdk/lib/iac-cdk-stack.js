const { Stack, Construct, Duration } = require('aws-cdk-lib');
const { Vpc } = require('aws-cdk-lib/aws-ec2');
const { Cluster, FargateTaskDefinition, FargateService, ContainerImage } = require('aws-cdk-lib/aws-ecs');
const { Role, PolicyDocument, CompositePrincipal, PolicyStatement, ManagedPolicy, Effect, ServicePrincipal } = require('aws-cdk-lib/aws-iam');
const { LogGroup, RetentionDays } = require('aws-cdk-lib/aws-logs');
const { CfnOutput } = require('aws-cdk-lib/aws-cloudformation');

class TestStack extends Stack {
  constructor(scope, id, props) {
    super(scope, `${id}-stack`, props);

    // Define the custom policy document and the trust object outside of the TestStack class:
    const customPolicyDoc = new PolicyDocument({
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: ['*'],
          actions: ['ecr:*', 'cloudwatch:PutMetricData', 'autoscaling:DescribeAutoScalingGroups', 'autoscaling:TerminateInstanceInAutoScalingGroup'],
        }),
      ],
    });

    // Create a VPC for our resources to live in:
    const vpc = new Vpc(this, 'MyVPC');

    // Create an ECS cluster with Fargate capacity providers and enable Fargate capacity providers for scaling purposes:
    const cluster = new Cluster(this, 'Cluster', { vpc, enableFargateCapacityProviders: true });

    // Create a role with the custom policy and managed policies for our ECS tasks to assume:
    const taskRole = new Role(this, 'taskRoleEcs', {
      assumedBy: new ServicePrincipal('ecs.amazonaws.com'),
      inlinePolicies: { 'custom_policy': customPolicyDoc },
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')],
    });

    // Add any managed policies you want to apply to this role (e.g., AWSXRayDaemonWriteAccess) here...
    const executionRole = new Role(this, 'executionRoleEcs', {
      assumedBy: new ServicePrincipal('ecs.amazonaws.com'),
      inlinePolicies: { 'custom_policy': customPolicyDoc },
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')],
    });

    // Define your application container(s) here...
    const appContainer = {};

    // Define your X-Ray daemon container(s) here...
    const daemonContainer = {};

    // Create a CloudWatch log group for our ECS tasks' logs and set its retention period to 14 days (optional):
    const logGroup = new LogGroup(this, 'MyLogGroup', {
      retention: RetentionDays.ONE_MONTH
    });

    const expressApp = new FargateTaskDefinition(this, 'AppTaskDefinition', {
      cpu: 0.5,
      memoryLimitMiB: 512,
      executionRole: executionRole,
      taskRole: taskRole,
    });

    expressApp.addContainer('ExpressAppContainer', {
      image: ContainerImage.fromRegistry('iluvyou3000/xray_instrumented_app:latest'),
      cpu: 0.25,
    });

    expressApp.addContainer('XRayDaemonContainer', {
      image: ContainerImage.fromRegistry('amazon/aws-xray-daemon'),
      cpu: 0.25
    });

    // Now, you can create a service and associate it with your task definition
    const expressAppService = new FargateService(this, 'ExpressAppService', {
      cluster,
      taskDefinition: expressApp,
      desiredCount: 1, // Adjust as needed
    });

  }
}

module.exports = {
  TestStack
}
