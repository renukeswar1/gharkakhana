import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'

interface StorageStackProps extends cdk.StackProps {
  projectName: string
  environment: string
}

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.Bucket
  public readonly cdnDistribution: cloudfront.Distribution

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props)

    const { projectName, environment } = props

    // S3 bucket for uploads (images, documents, etc.)
    this.bucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: `${projectName}-uploads-${environment}-${this.account}`,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ['*'], // Will restrict in production
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: environment === 'prod',
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== 'prod',
    })

    // CloudFront distribution for S3 content
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OAI',
      {
        comment: `OAI for ${projectName} uploads`,
      }
    )

    this.bucket.grantRead(originAccessIdentity)

    this.cdnDistribution = new cloudfront.Distribution(this, 'CDN', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
      enabled: true,
      comment: `${projectName} CDN for uploads`,
    })

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket Name',
    })

    new cdk.CfnOutput(this, 'CDNDomain', {
      value: this.cdnDistribution.distributionDomainName,
      description: 'CloudFront Distribution Domain',
    })
  }
}
