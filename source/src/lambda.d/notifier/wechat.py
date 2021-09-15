# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import requests
import json
from alarm import Alarm

class Wechat:
    s = requests.session()
    token = None

    def __init__(self, corpId, corpSecret):
        self.corpId = corpId
        self.corpSecret = corpSecret
        self.token = self.get_token(corpId, corpSecret)

    # Get Access Token
    def get_token(self, corpId, corpSecret):
        url = "https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid={0}&corpsecret={1}".format(corpId, corpSecret)
        rep = self.s.get(url)
        if rep.status_code == 200:
            content = json.loads(rep.content)
            # Check errcode to verify the call is succeed
            if content['errcode'] == 0:
                # If succeed
                return content['access_token']
            else:
                # If failed
                raise Exception('Non-zero errorcode: {}'.format(content['errcode']))
        else:
            raise Exception('Request failed with return code: {}'.format(rep.status_code))

    # Message Type: Card
    def send_msg(self, wxAlarm):
        url = "https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=" + self.token
        header = {
            "Content-Type": "application/json"
        }
        form_data = {
            "touser": wxAlarm.toUser,
            "toparty": wxAlarm.toParty,
            "totag": wxAlarm.toTag,
            "msgtype": "textcard",
            "agentid": wxAlarm.agentId,
            "textcard": {
                "title": wxAlarm.title,
                "description": wxAlarm.description,
                "url": wxAlarm.url,
                "btntxt": "More"
            }
        }
        rep = self.s.post(url, data=json.dumps(form_data).encode('utf-8'), headers=header)
        if rep.status_code == 200:
            return json.loads(rep.content)
        else:
            print("request failed.")
            return None
    
    # Message Type: text
    def send_text_msg(self, wxAlarm):
        url = "https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=" + self.token
        header = {
            "Content-Type": "application/json"
        }
        form_data = {
            "touser": wxAlarm.toUser,
            "toparty": wxAlarm.toParty,
            "totag": wxAlarm.toTag,
            "msgtype": "text",
            "agentid": wxAlarm.agentId,
            "text" : {
                "content": wxAlarm.description
            }
        }
        rep = self.s.post(url, data=json.dumps(form_data).encode('utf-8'), headers=header)
        if rep.status_code == 200:
            content = json.loads(rep.content)
            if content['errcode'] == 0:
                # If succeed
                pass
            else:
                raise Exception('Errcode: {} , Errmsg: {}'.format(content['errcode'], content['errmsg']))                    
        else:
            raise Exception('Request failed with status_code: {}'.format(rep.status_code))


if __name__ == '__main__':
   pass

