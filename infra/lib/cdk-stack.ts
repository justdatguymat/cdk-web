import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecsPt from '@aws-cdk/aws-ecs-patterns';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as r53 from '@aws-cdk/aws-route53';

const CONTAINER_PORT = 3000;
const HOST_PORT = 3000;
const VPC_MAX_AZS = 2;
const VPC_NAT_GW = 1;

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    cdk.Tags.of(scope).add('Name', 'cdk-demo-ecs');
    cdk.Tags.of(scope).add('Project', 'cdk-demo');

    const vpc = new ec2.Vpc(this, 'cdk-demo-vpc', {
      cidr: ec2.Vpc.DEFAULT_CIDR_RANGE,
      maxAzs: VPC_MAX_AZS,
      natGateways: VPC_NAT_GW,
    });
    const cluster = new ecs.Cluster(this, 'cdk-demo-cluster', { vpc });

    /*
    const taskRole = new iam.Role(this, 'cdk-demo-taskrole', {
      assumedBy: new iam.ServicePrincipal('ecs.amazonaws.com'),
    });
    */

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'cdk-demo-fargate-df');

    const containerRepository = ecr.Repository.fromRepositoryName(this, 'cdk-demo', 'cdk-web');
    const containerDefinition = taskDefinition.addContainer('cdk-demo-container-web', {
      image: ecs.ContainerImage.fromEcrRepository(containerRepository, 'latest'),
    });

    const portMapping = containerDefinition.addPortMappings({
      containerPort: CONTAINER_PORT,
      hostPort: HOST_PORT,
      protocol: ecs.Protocol.TCP,
    });

    const domainZone = r53.HostedZone.fromLookup(this, 'aws-cdk-hz', { domainName: 'koltunm.com' });

    const aj = new ecsPt.ApplicationLoadBalancedFargateService(this, 'cdk-demo-fargate-svc', {
      publicLoadBalancer: true,
      cluster,
      //desiredCount: 2,
      domainZone,
      domainName: 'cdkdemo.koltunm.com',
      taskDefinition,
    });

    aj.service.autoScaleTaskCount({ minCapacity: 1, maxCapacity: 5 });
  }
}
