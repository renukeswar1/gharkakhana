import * as cdk from 'aws-cdk-lib'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as path from 'path'
import { Construct } from 'constructs'

interface ApiStackProps extends cdk.StackProps {
  projectName: string
  environment: string
  table: dynamodb.Table
  bucket: s3.Bucket
  userPool: cognito.UserPool
  userPoolClient: cognito.UserPoolClient
  searchDomain: opensearch.Domain
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi
  public readonly apiUrl: string

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props)

    const {
      projectName,
      environment,
      table,
      bucket,
      userPool,
      userPoolClient,
      searchDomain,
    } = props

    // Common Lambda environment variables
    const lambdaEnv = {
      TABLE_NAME: table.tableName,
      BUCKET_NAME: bucket.bucketName,
      USER_POOL_ID: userPool.userPoolId,
      USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      OPENSEARCH_ENDPOINT: searchDomain.domainEndpoint,
      ENVIRONMENT: environment,
    }

    // Lambda layer for shared code
    const sharedLayer = new lambda.LayerVersion(this, 'SharedLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../packages/shared')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'Shared utilities and types',
    })

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      'CognitoAuthorizer',
      {
        cognitoUserPools: [userPool],
        identitySource: 'method.request.header.Authorization',
      }
    )

    // API Gateway
    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `${projectName}-api-${environment}`,
      description: 'GharKaKhana API',
      deployOptions: {
        stageName: environment,
        throttlingBurstLimit: 500,
        throttlingRateLimit: 1000,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-User-Location',
        ],
      },
    })

    this.apiUrl = this.api.url

    // Helper function to create Lambda
    const createLambda = (name: string, handler: string): lambdaNode.NodejsFunction => {
      const fn = new lambdaNode.NodejsFunction(this, name, {
        functionName: `${projectName}-${name}-${environment}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'handler',
        entry: path.join(__dirname, `../../../packages/api/src/handlers/${handler}.ts`),
        environment: lambdaEnv,
        layers: [sharedLayer],
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        logRetention: logs.RetentionDays.ONE_WEEK,
        bundling: {
          externalModules: ['aws-sdk'],
          minify: true,
          sourceMap: true,
        },
      })

      // Grant permissions
      table.grantReadWriteData(fn)
      bucket.grantReadWrite(fn)
      searchDomain.grantReadWrite(fn)

      return fn
    }

    // Create Lambda functions
    const authLambda = createLambda('auth', 'auth')
    const usersLambda = createLambda('users', 'users')
    const chefsLambda = createLambda('chefs', 'chefs')
    const menusLambda = createLambda('menus', 'menus')
    const ordersLambda = createLambda('orders', 'orders')
    const searchLambda = createLambda('search', 'search')
    const reviewsLambda = createLambda('reviews', 'reviews')
    const uploadsLambda = createLambda('uploads', 'uploads')

    // Helper to create resource with methods
    const addResource = (
      path: string,
      lambda: lambda.Function,
      methods: string[],
      requireAuth: boolean = true
    ) => {
      const resource = this.api.root.resourceForPath(path)
      
      methods.forEach((method) => {
        resource.addMethod(
          method,
          new apigateway.LambdaIntegration(lambda),
          requireAuth
            ? {
                authorizer,
                authorizationType: apigateway.AuthorizationType.COGNITO,
              }
            : {}
        )
      })
    }

    // Auth endpoints (no auth required)
    addResource('/auth/register', authLambda, ['POST'], false)
    addResource('/auth/login', authLambda, ['POST'], false)
    addResource('/auth/verify-otp', authLambda, ['POST'], false)
    addResource('/auth/forgot-password', authLambda, ['POST'], false)
    addResource('/auth/reset-password', authLambda, ['POST'], false)

    // User endpoints
    addResource('/users/me', usersLambda, ['GET', 'PUT'])
    addResource('/users/me/addresses', usersLambda, ['GET', 'POST'])
    addResource('/users/me/addresses/{addressId}', usersLambda, ['PUT', 'DELETE'])

    // Chef endpoints
    addResource('/chefs/register', chefsLambda, ['POST'])
    addResource('/chefs/me', chefsLambda, ['GET', 'PUT'])
    addResource('/chefs/me/verification', chefsLambda, ['GET', 'POST'])
    addResource('/chefs/me/availability', chefsLambda, ['PUT'])
    addResource('/chefs/{chefId}', chefsLambda, ['GET'], false)
    addResource('/chefs/{chefId}/menus', chefsLambda, ['GET'], false)
    addResource('/chefs/{chefId}/reviews', chefsLambda, ['GET'], false)

    // Menu endpoints
    addResource('/menus', menusLambda, ['POST'])
    addResource('/menus/my', menusLambda, ['GET'])
    addResource('/menus/{menuId}', menusLambda, ['GET', 'PUT', 'DELETE'])
    addResource('/menus/{menuId}/items/{itemId}/availability', menusLambda, ['PUT'])

    // Order endpoints
    addResource('/orders', ordersLambda, ['GET', 'POST'])
    addResource('/orders/{orderId}', ordersLambda, ['GET'])
    addResource('/orders/{orderId}/confirm-payment', ordersLambda, ['POST'])
    addResource('/orders/{orderId}/status', ordersLambda, ['PUT'])
    addResource('/orders/{orderId}/cancel', ordersLambda, ['POST'])
    addResource('/orders/{orderId}/steel-box-return', ordersLambda, ['POST'])

    // Search endpoints (no auth required)
    addResource('/search/chefs', searchLambda, ['GET'], false)
    addResource('/search/menus', searchLambda, ['GET'], false)
    addResource('/search/suggestions', searchLambda, ['GET'], false)

    // Review endpoints
    addResource('/reviews', reviewsLambda, ['POST'])
    addResource('/reviews/{reviewId}', reviewsLambda, ['GET', 'PUT', 'DELETE'])
    addResource('/reviews/{reviewId}/response', reviewsLambda, ['POST'])
    addResource('/reviews/{reviewId}/helpful', reviewsLambda, ['POST'])

    // Upload endpoints
    addResource('/uploads/presigned-url', uploadsLambda, ['POST'])

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
    })
  }
}
