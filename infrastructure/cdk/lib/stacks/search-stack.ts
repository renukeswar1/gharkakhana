import * as cdk from 'aws-cdk-lib'
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'

interface SearchStackProps extends cdk.StackProps {
  projectName: string
  environment: string
}

export class SearchStack extends cdk.Stack {
  public readonly domain: opensearch.Domain

  constructor(scope: Construct, id: string, props: SearchStackProps) {
    super(scope, id, props)

    const { projectName, environment } = props

    // OpenSearch domain for menu search
    this.domain = new opensearch.Domain(this, 'SearchDomain', {
      domainName: `${projectName}-search-${environment}`,
      version: opensearch.EngineVersion.OPENSEARCH_2_11,
      
      // Capacity - start small for dev, scale for prod
      capacity: {
        dataNodeInstanceType: environment === 'prod' 
          ? 't3.medium.search' 
          : 't3.small.search',
        dataNodes: environment === 'prod' ? 2 : 1,
      },
      
      // EBS storage
      ebs: {
        volumeSize: environment === 'prod' ? 50 : 10,
        volumeType: ec2.EbsDeviceVolumeType.GP3,
      },

      // Node-to-node encryption
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },

      // Fine-grained access control
      fineGrainedAccessControl: {
        masterUserName: 'admin',
      },

      // Enforce HTTPS
      enforceHttps: true,

      // Zone awareness for prod
      zoneAwareness: environment === 'prod' ? {
        enabled: true,
        availabilityZoneCount: 2,
      } : undefined,

      // Logging
      logging: {
        slowSearchLogEnabled: true,
        appLogEnabled: true,
        slowIndexLogEnabled: true,
      },

      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    })

    // Access policy
    this.domain.addAccessPolicies(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ['es:*'],
        resources: [`${this.domain.domainArn}/*`],
      })
    )

    // Outputs
    new cdk.CfnOutput(this, 'DomainEndpoint', {
      value: this.domain.domainEndpoint,
      description: 'OpenSearch Domain Endpoint',
    })

    new cdk.CfnOutput(this, 'DomainArn', {
      value: this.domain.domainArn,
      description: 'OpenSearch Domain ARN',
    })
  }
}
