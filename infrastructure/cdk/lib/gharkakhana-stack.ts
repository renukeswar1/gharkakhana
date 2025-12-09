import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class GharKaKhanaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Common bundling options - use local esbuild, no Docker required
    const commonBundling = {
      minify: true,
      sourceMap: false,
      externalModules: ['aws-sdk', '@aws-sdk/*'],
      forceDockerBundling: false, // Use local esbuild instead of Docker
    };

    // ========================================
    // DynamoDB Tables
    // ========================================

    // Main table - Single Table Design
    const mainTable = new dynamodb.Table(this, 'MainTable', {
      tableName: 'GharKaKhanaTable',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });

    // GSI1: For geolocation queries (finding chefs by geohash)
    mainTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: For email/phone lookups
    mainTable.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI3: For order queries by customer/chef
    mainTable.addGlobalSecondaryIndex({
      indexName: 'GSI3',
      partitionKey: { name: 'GSI3PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI3SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // OTP Table for phone verification
    const otpTable = new dynamodb.Table(this, 'OTPTable', {
      tableName: 'GharKaKhanaOTP',
      partitionKey: { name: 'phone', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'expiresAt',
    });

    // ========================================
    // S3 Buckets
    // ========================================

    // Photos bucket for chef photos, menu images, etc.
    const photosBucket = new s3.Bucket(this, 'PhotosBucket', {
      bucketName: `gharkakhana-photos-${this.account}`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        blockPublicPolicy: false,
        ignorePublicAcls: true,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Add bucket policy for public read access to photos
    photosBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:GetObject'],
      resources: [`${photosBucket.bucketArn}/*`],
    }));

    // ========================================
    // IAM Role for Lambda
    // ========================================

    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant permissions
    mainTable.grantReadWriteData(lambdaRole);
    otpTable.grantReadWriteData(lambdaRole);
    photosBucket.grantReadWrite(lambdaRole);

    // Grant SNS permissions for SMS OTP
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sns:Publish'],
      resources: ['*'],
    }));

    // ========================================
    // Environment Variables
    // ========================================

    const lambdaEnvironment = {
      TABLE_NAME: mainTable.tableName,
      OTP_TABLE_NAME: otpTable.tableName,
      BUCKET_NAME: photosBucket.bucketName,
      JWT_SECRET: process.env.JWT_SECRET || 'gharkakhana-jwt-secret-change-in-production',
      ENVIRONMENT: process.env.ENVIRONMENT || 'dev',
    };

    // ========================================
    // Lambda Functions
    // ========================================

    // Auth Lambda - handles register, login, OTP verification
    const authLambda = new NodejsFunction(this, 'AuthFunction', {
      entry: path.join(__dirname, '../../../packages/api/src/handlers/auth-lambda.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: lambdaEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      bundling: commonBundling,
    });

    // Chefs Lambda - handles chef registration, search, profile
    const chefsLambda = new NodejsFunction(this, 'ChefsFunction', {
      entry: path.join(__dirname, '../../../packages/api/src/handlers/chefs-lambda.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: lambdaEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      bundling: commonBundling,
    });

    // Menus Lambda - handles menu CRUD
    const menusLambda = new NodejsFunction(this, 'MenusFunction', {
      entry: path.join(__dirname, '../../../packages/api/src/handlers/menus.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: lambdaEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      bundling: commonBundling,
    });

    // Orders Lambda - handles order CRUD
    const ordersLambda = new NodejsFunction(this, 'OrdersFunction', {
      entry: path.join(__dirname, '../../../packages/api/src/handlers/orders.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: lambdaEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      bundling: commonBundling,
    });

    // Search Lambda - handles chef/menu search by location
    const searchLambda = new NodejsFunction(this, 'SearchFunction', {
      entry: path.join(__dirname, '../../../packages/api/src/handlers/search.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: lambdaEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      bundling: commonBundling,
    });

    // Uploads Lambda - handles presigned URL generation
    const uploadsLambda = new NodejsFunction(this, 'UploadsFunction', {
      entry: path.join(__dirname, '../../../packages/api/src/handlers/uploads.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: lambdaEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      bundling: commonBundling,
    });

    // ========================================
    // API Gateway
    // ========================================

    const api = new apigateway.RestApi(this, 'GharKaKhanaApi', {
      restApiName: 'GharKaKhana API',
      description: 'Home-cooked food delivery platform API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    // ========================================
    // API Routes
    // ========================================

    // Auth endpoints
    const authResource = api.root.addResource('auth');
    
    const registerResource = authResource.addResource('register');
    registerResource.addMethod('POST', new apigateway.LambdaIntegration(authLambda));
    
    const loginResource = authResource.addResource('login');
    loginResource.addMethod('POST', new apigateway.LambdaIntegration(authLambda));
    
    const sendOtpResource = authResource.addResource('send-otp');
    sendOtpResource.addMethod('POST', new apigateway.LambdaIntegration(authLambda));
    
    const verifyOtpResource = authResource.addResource('verify-otp');
    verifyOtpResource.addMethod('POST', new apigateway.LambdaIntegration(authLambda));
    
    const profileResource = authResource.addResource('profile');
    profileResource.addMethod('GET', new apigateway.LambdaIntegration(authLambda));

    // Chefs endpoints
    const chefsResource = api.root.addResource('chefs');
    chefsResource.addMethod('GET', new apigateway.LambdaIntegration(chefsLambda)); // Search chefs
    chefsResource.addMethod('POST', new apigateway.LambdaIntegration(chefsLambda)); // Register as chef
    
    const chefByIdResource = chefsResource.addResource('{chefId}');
    chefByIdResource.addMethod('GET', new apigateway.LambdaIntegration(chefsLambda));
    chefByIdResource.addMethod('PUT', new apigateway.LambdaIntegration(chefsLambda));

    const chefSearchResource = chefsResource.addResource('search');
    chefSearchResource.addMethod('GET', new apigateway.LambdaIntegration(chefsLambda));

    // Menus endpoints
    const menusResource = api.root.addResource('menus');
    menusResource.addMethod('GET', new apigateway.LambdaIntegration(menusLambda));
    menusResource.addMethod('POST', new apigateway.LambdaIntegration(menusLambda));
    
    const menuByIdResource = menusResource.addResource('{menuId}');
    menuByIdResource.addMethod('GET', new apigateway.LambdaIntegration(menusLambda));
    menuByIdResource.addMethod('PUT', new apigateway.LambdaIntegration(menusLambda));
    menuByIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(menusLambda));

    // Orders endpoints
    const ordersResource = api.root.addResource('orders');
    ordersResource.addMethod('GET', new apigateway.LambdaIntegration(ordersLambda));
    ordersResource.addMethod('POST', new apigateway.LambdaIntegration(ordersLambda));
    
    const orderByIdResource = ordersResource.addResource('{orderId}');
    orderByIdResource.addMethod('GET', new apigateway.LambdaIntegration(ordersLambda));
    orderByIdResource.addMethod('PUT', new apigateway.LambdaIntegration(ordersLambda));

    // Search endpoints
    const searchResource = api.root.addResource('search');
    searchResource.addMethod('GET', new apigateway.LambdaIntegration(searchLambda));

    // Uploads endpoints
    const uploadsResource = api.root.addResource('uploads');
    const presignedUrlResource = uploadsResource.addResource('presigned-url');
    presignedUrlResource.addMethod('POST', new apigateway.LambdaIntegration(uploadsLambda));

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: 'GharKaKhanaApiEndpoint',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: mainTable.tableName,
      description: 'DynamoDB main table name',
      exportName: 'GharKaKhanaTableName',
    });

    new cdk.CfnOutput(this, 'PhotosBucketName', {
      value: photosBucket.bucketName,
      description: 'S3 bucket for photos',
      exportName: 'GharKaKhanaPhotosBucket',
    });
  }
}
