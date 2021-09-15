# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import json
import boto3
import os
from wechat import Wechat
from alarm import Alarm

# Get arns of tokens from envrionment variables
corpIdArn = os.environ['CORPID_ARN']
agentIdArn = os.environ['AGENTID_ARN']
agentSecretArn = os.environ['AGENTSECRET_ARN']

# Get information from Secrets Manager
secret_manager_client = boto3.client('secretsmanager')

get_corp_id_value_response = secret_manager_client.get_secret_value(
        SecretId=corpIdArn
    )
corpId = get_corp_id_value_response['SecretString']

get_agent_id_secret_response = secret_manager_client.get_secret_value(
        SecretId=agentIdArn
    )
agentId = get_agent_id_secret_response['SecretString']

get_agent_secret_value_response = secret_manager_client.get_secret_value(
        SecretId=agentSecretArn
    )
agentSecret = get_agent_secret_value_response['SecretString']

# Initiate and get Access Token
wechat = Wechat(corpId, agentSecret)

def lambda_handler(event, context):
    print(event)
    msg = msg_format(event) 
    print(msg)

    wxAlarm = Alarm(
        toUser = "@all",
        toParty = "",
        toTag = "",
        agentId = agentId,
        description = msg,
    )
    
    wechat.send_text_msg(wxAlarm)
    
    response = {
        "statusCode": 200,
        "body": "Message Sent."
    }

    return response

def msg_format(event):
    try:
        # Get message from SNS
        msg = event['Records'][0]['Sns']['Message']
        
        # Handle strings
        msg = msg.replace("\\n", "\n")
        if msg[0] == '\"' and msg[-1] == '\"' :
            msg = msg[1:-1]

        return msg
    except:
        # return event if resource is not SNS
        return event

    
