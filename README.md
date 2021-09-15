# Serverless Alert Notifier

Serverless Alert Notifier is an one-click serverless solution that automatically deploys the resources for sending notification to common notification platform used by Chinese customers.

With Serverless Alert Notifier, you can perform any alert tasks, for example:
- Send notification to operation engineer's wechat when AWS health event happens
- Send notification to devops engineer's wechat when there is a EC2 instance stop
- Send notification to security engineer's wechat when there is security or compliance issue finded by Security Hub
- Send notification to customer's unified alert platform when there is any AWS resource event happens

## Features

Provided Match Rule
- [Y] EC2 Instance State Change
- [Y] AWS Health State Change

Supported Notification Platform
- [Y] Wechat

## Architecture

![](architecture.png)

## Solution Deployment

> **Time to deploy:** Approximately 2 minutes.

### Launch CloudFormation Stack

Follow the step-by-step instructions to configure and deploy the Data Transfer Hub into your account.

1. Make sure you have sign in AWS Console already.
1. Get CorpId, AgentID and AgentSecret from the notification platform, like wechat, and seperated store them in Secrets Manager.
1. If you want to deploy this solution in China regions, click the following button.

    [![Launch Stack](./launch-stack.png)](https://console.amazonaws.cn/cloudformation/home#/stacks/create/template?stackName=ServerlessAlertNotifier&templateURL=https://aws-gcr-solutions.s3.cn-north-1.amazonaws.com.cn/serverless-alert-notifier/v1.0.0/ServerlessAlertNotifierStack.template)

    If you want to deploy this solution in global regions, click the following button.

    [![Launch Stack](./launch-stack.png)](https://console.aws.amazon.com/cloudformation/home#/stacks/create/template?stackName=ServerlessAlertNotifier&templateURL=https://aws-gcr-solutions.s3.amazonaws.com/serverless-alert-notifier/v1.0.0/ServerlessAlertNotifierStack.template)

1. Input **AGENTID Secrets Manager ARN, AGENTSECRET Secrets Manager ARN, CORPID Secrets Manager ARN** parameters using ARNs of Secrets Manager secret stored before.
1. Click **Next** and select **Create Stack**.

## More Resources

* [How to customize this solution and build your own distributable?](./docs/build-your-own-distributable.md)
* [Deploy this solution via AWS CDK](./docs/deploy-via-cdk.md)