const { Stack, Construct } = require('aws-cdk-lib');
const { Vpc } = require('aws-cdk-lib/aws-ec2');
const { Cluster, FargateTaskDefinition, FargateService } = require('aws-cdk-lib/aws-ecs');
const { Role, PolicyDocument, CompositePrincipal, PolicyStatement, ManagedPolicy } = require('aws-cdk-lib/aws-iam');
const { LogGroup } = require('aws-cdk-lib/aws-logs');
const { Duration } = require('aws-cdk-lib/aws-steps');
const { CfnOutput } = require('aws-cdk-lib/aws-cloudformation');

class TestStack extends Stack {
  constructor(scope, id, props) {
    super(scope, `${id}-stack`, props);

    // Define the custom policy document and the trust object outside of the TestStack class:
    const customPolicyDoc = new PolicyDocument({
      statements: [
        new PolicyStatement({
          effect: 'ALLOW',
          resources: ['*'],
          actions: ['ecr:*', 'logs:*', 'cloudwatch:PutMetricData', 'autoscaling:DescribeAutoScalingGroups', 'autoscaling:TerminateInstanceInAutoScalingGroup'],
        }),
      ],
    });

    const trust = new CompositePrincipal({
      service: 'ecs-tasks.amazonaws.com',
    });

    // Create a VPC for our resources to live in:
    const vpc = new Vpc(this, 'MyVPC');

    // Create an ECS cluster with Fargate capacity providers and enable Fargate capacity providers for scaling purposes:
    const cluster = new Cluster(this, 'Cluster', { vpc, enableFargateCapacityProviders: true });

    // Create a role with the custom policy and managed policies for our ECS tasks to assume:
    const taskRole = new Role(this, 'taskRoleEcs', {
      assumedBy: trust,
      inlinePolicies: { 'custom_policy': customPolicyDoc },
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')],
    });

    // Add any managed policies you want to apply to this role (e.g., AWSXRayDaemonWriteAccess) here...
    const executionRole = new Role(this, 'executionRoleEcs', {
      assumedBy: trust,
      inlinePolicies: { 'custom_policy': customPolicyDoc },
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')],
    });

    // Create a separate execution role for ECS tasks to assume (optional)... Here...
    // Add any managed policies you want to apply to this role (e.g., AWSXRayDaemonWriteAccess) here...

    // Define your application container(s) here...
    const appContainer = {};

    // Define your X-Ray daemon container(s) here...
    const daemonContainer = {};

    // Create a CloudWatch log group for our ECS tasks' logs and set its retention period to 14 days (optional):
    const logGroup = new LogGroup(this, 'MyLogGroup', {
      retention: Duration.days(14),
    });

    const expressApp = new FargateTaskDefinition(this, 'AppTaskDefinition', {
      cpu: 512,
      memoryLimitMiB: 512,
      executionRole: executionRole,
      taskRole: taskRole,
    });

    expressApp.addContainer('ExpressAppContainer', {
      image: 'iluvyou3000/xray_instrumented_app:16',
      cpu: 256,
    });

    const xrayDaemon = new FargateTaskDefinition(this, 'XRayDaemonTaskDefinition', {
      cpu: 256,
      executionRole: executionRole,
      taskRole: taskRole,
    });

    xrayDaemon.addContainer('XRayDaemonContainer', {
      image: 'amazon/aws-xray-daemon',
      cpu: 256,
    });

    // Now, you can create a service and associate it with your task definition
    const expressAppService = new FargateService(this, 'ExpressAppService', {
      cluster,
      taskDefinition: expressApp,
      desiredCount: 2, // Adjust as needed
    });

    // Output the service URL
    new CfnOutput(this, 'ServiceUrl', {
      value: expressAppService.loadBalancer.loadBalancerDnsName,
    });
  }
}

module.exports = {
  TestStack
}
