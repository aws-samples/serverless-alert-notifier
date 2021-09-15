# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# -*- coding: UTF-8 -*-

class Alarm:

    def __init__(self, toUser, toParty, toTag, agentId, title="", description="", url=""):
        self.toUser = toUser
        self.toParty = toParty
        self.toTag = toTag
        self.agentId = agentId
        self.title = title
        self.description = description
        self.url = url

if __name__ == '__main__':
    pass