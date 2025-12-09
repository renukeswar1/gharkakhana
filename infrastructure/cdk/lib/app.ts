#!/usr/bin/env node
import 'dotenv/config';
import * as cdk from 'aws-cdk-lib';
import { GharKaKhanaStack } from './gharkakhana-stack';

const app = new cdk.App();

// GharKaKhana Stack - All-in-one stack (like manuslunchbox pattern)
// This is simpler and more cost-effective than multiple stacks
new GharKaKhanaStack(app, 'GharKaKhanaStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-south-1',
  },
  description: 'GharKaKhana - Home-cooked food delivery platform',
});
