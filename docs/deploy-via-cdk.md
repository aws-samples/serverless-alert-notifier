# Deploy via AWS CDK

_Note_: You should choose either Deploy via CloudFormation or [Deploy via AWS CDK](#deploy-via-aws-cdk). If you are don't want to install the dependencies on your local machine, Please choose Deploy via CloudFormation.

## Prerequisites

Please install the following dependencies on your local machine.

* nodejs 12+
* npm 6+
* Docker

You need CDK bootstrap v4+ to deploy this application. To upgrade to latest CDK bootstrap version. Run
```
cdk bootstrap --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

Please make sure Docker is running on your local machine.

## CDK Synth & CDK Deploy
_Note_: Please make sure Docker is running.

```
cd source
npm install 
npm run build
npx cdk synth
npx cdk deploy \
--parameters agentID=<YOUR AGNETID SECRETS MANAGER ARN>
--parameters agentSecret=<YOUR AGENTSECRET SECRETS MANAGER ARN>
--parameters CorpID=<YOUR CORPID SECRETS MANAGER ARN>
```

Please refer to guide document to set up 3 Secrets Manager before you running CDK synth.