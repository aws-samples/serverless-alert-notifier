/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as sns from '@aws-cdk/aws-sns';
import * as iam from '@aws-cdk/aws-iam';
import * as kms from '@aws-cdk/aws-kms';
import * as targets from '@aws-cdk/aws-events-targets';
import { PythonFunction } from "@aws-cdk/aws-lambda-python";
import { Aws, CfnParameter, Construct } from '@aws-cdk/core';
import { SnsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import * as path from 'path';
import { Effect, PolicyStatement, ServicePrincipal } from '@aws-cdk/aws-iam';
import { Rule } from '@aws-cdk/aws-events';

export class NotifierStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.templateOptions.description = '(SO8028) - Serverless Alert Notifier Cloudformation Template';

    // Define CFN parameters
    const agentID = new CfnParameter(this, "AGENTID Secrets Manager ARN", {
      description: "Secrets Manager ARN of Agent ID of your application",
      type: "String",
    })

    const agentSecret = new CfnParameter(this, "AGENTSECRET Secrets Manager ARN", {
      description: "Secrets Manager ARN of Agent Secret of your application",
      type: "String",
    })

    const corpID = new CfnParameter(this, "CORPID Secrets Manager ARN", {
      description: "Secrets Manager ARN of Corp ID",
      type: "String",
    })

    // Create a KMS CMK for SNS
    const notifierTopicCMK = new kms.Key(this, 'NotifierTopicKey', {
      enableKeyRotation: true,
      description: "Serverless Alert Notifier SNS Topic CMK",
      enabled: true
    });
    notifierTopicCMK.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        principals: [
          new ServicePrincipal("events.amazonaws.com")
        ],
        actions: [
          "kms:GenerateDataKey*",
          "kms:Decrypt"
        ],
        resources: [`*`],
      })
    )

    // Create SNS topic for notification
    const notifierTopic = new sns.Topic(this, 'NotifierTopic', {
      displayName: 'Serverless Alert Notifier subscription topic',
      masterKey: notifierTopicCMK,
    });

    // Create IAM Role for lambda function
    const notifierFunctionRole = new iam.Role(this, 'notifierFunctionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    // Add IAM policy to allow lambda function create CloudWatch Log group and stream
    notifierFunctionRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [`arn:${Aws.PARTITION}:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:log-group:*`],
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
        ]
      })
    )

    // Add IAM policy to allow lambda function write logs to CloudWatch Logs
    notifierFunctionRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [`arn:${Aws.PARTITION}:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:log-group:*:log-stream:*`],
        actions: [
          "logs:PutLogEvents",
        ]
      })
    )

    // Add IAM Policy to allow lambda function access specific secret manager
    notifierFunctionRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [corpID.value.toString(),
                    agentID.value.toString(),
                    agentSecret.value.toString()],
        actions: [
          "secretsmanager:GetSecretValue",
        ]
      })
    )

    // Create Lambda function
    const notifierFunction = new PythonFunction(this, 'NotifierFunction', {
      entry: path.join(__dirname, './lambda.d/notifier'),
      index: 'index.py',
      handler: 'lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_8,
      role: notifierFunctionRole,
      environment: {
        ["CORPID_ARN"]: corpID.value.toString(),
        ["AGENTID_ARN"]: agentID.value.toString(),
        ["AGENTSECRET_ARN"]: agentSecret.value.toString(),
      }
    });

    notifierFunction.addEventSource(new SnsEventSource(notifierTopic));

    // Create Event Bridge rule to monitor EC2 state change event
    const EC2StateRule = new Rule(this, 'EC2 State Rule', {
      description: "EC2 State Rule",
      eventPattern: {
        source: ['aws.ec2'],
        detailType: ['EC2 Instance State-change Notification'],
        detail: {
          "state": ["running", "stopped", "terminated"]
        }
      },
      enabled: true,

    });
    EC2StateRule.addTarget(new targets.SnsTopic(sns.Topic.fromTopicArn(this, 'EC2 State Rule ITopic', notifierTopic.topicArn)));

    // Create Event Bridge rule to monitor services health event
    const HealthStateRule = new Rule(this, 'Health State Rule', {
      description: "Health State Rule",
      eventPattern: {
        source: ['aws.health'],
        detailType: ['AWS Health Event']
      },
    });
    HealthStateRule.addTarget(new targets.SnsTopic(sns.Topic.fromTopicArn(this, 'Health State Rule ITopic', notifierTopic.topicArn)));

    // Create topic policy and allow EventBridge rules to call SNS
    const topicPolicy = new sns.TopicPolicy(this, 'TopicPolicy', {
      topics: [notifierTopic],
    });

    topicPolicy.document.addStatements(new iam.PolicyStatement({
      sid: "AWSEvents_ServerlessAlertNotifier",
      effect: iam.Effect.ALLOW,
      actions: ["sns:Publish"],
      principals: [new iam.ServicePrincipal("events.amazonaws.com")],
      resources: [`${notifierTopic.topicArn}`]
    }));
  }

}
