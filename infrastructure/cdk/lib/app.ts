#!/usr/bin/env node
import 'dotenv/config'
import * as cdk from 'aws-cdk-lib'
import { DatabaseStack } from './stacks/database-stack'
import { StorageStack } from './stacks/storage-stack'
import { AuthStack } from './stacks/auth-stack'
import { ApiStack } from './stacks/api-stack'
import { SearchStack } from './stacks/search-stack'
import { FrontendStack } from './stacks/frontend-stack'

const app = new cdk.App()

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'ap-south-1',
}

const projectName = 'gharkakhana'
const environment = process.env.ENVIRONMENT || 'dev'

// Tags for all resources
const tags = {
  Project: projectName,
  Environment: environment,
  ManagedBy: 'CDK',
}

// Database Stack (DynamoDB)
const databaseStack = new DatabaseStack(app, `${projectName}-database-${environment}`, {
  env,
  projectName,
  environment,
  tags,
})

// Storage Stack (S3)
const storageStack = new StorageStack(app, `${projectName}-storage-${environment}`, {
  env,
  projectName,
  environment,
  tags,
})

// Auth Stack (Cognito)
const authStack = new AuthStack(app, `${projectName}-auth-${environment}`, {
  env,
  projectName,
  environment,
  tags,
})

// Search Stack (OpenSearch)
const searchStack = new SearchStack(app, `${projectName}-search-${environment}`, {
  env,
  projectName,
  environment,
  tags,
})

// API Stack (API Gateway + Lambda)
const apiStack = new ApiStack(app, `${projectName}-api-${environment}`, {
  env,
  projectName,
  environment,
  tags,
  table: databaseStack.table,
  bucket: storageStack.bucket,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  searchDomain: searchStack.domain,
})

apiStack.addDependency(databaseStack)
apiStack.addDependency(storageStack)
apiStack.addDependency(authStack)
apiStack.addDependency(searchStack)

// Frontend Stack (CloudFront + S3 for Next.js static export)
const frontendStack = new FrontendStack(app, `${projectName}-frontend-${environment}`, {
  env,
  projectName,
  environment,
  tags,
  apiUrl: apiStack.apiUrl,
})

frontendStack.addDependency(apiStack)

// Output important values
new cdk.CfnOutput(app, 'ApiUrl', {
  value: apiStack.apiUrl,
  description: 'API Gateway URL',
})

new cdk.CfnOutput(app, 'UserPoolId', {
  value: authStack.userPool.userPoolId,
  description: 'Cognito User Pool ID',
})

new cdk.CfnOutput(app, 'UserPoolClientId', {
  value: authStack.userPoolClient.userPoolClientId,
  description: 'Cognito User Pool Client ID',
})

app.synth()
