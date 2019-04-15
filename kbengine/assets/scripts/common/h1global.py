# -*- coding: utf-8 -*-
import KBEngine
import random
import time
import math
import const
import copy
from KBEDebug import *

UTC_OFFSET = 60 * 60 * 5

class RC:
	def __init__(self):
		return

rc = RC()

def isSameDay(time1, time2):
	if abs(time1 - time2) > const.ONEDAY_TIME:
		return False
	else:		
		curTime_s = time.gmtime(time1 + UTC_OFFSET)
		lastTime_s = time.gmtime(time2 + UTC_OFFSET)
		if curTime_s[2] != lastTime_s[2]:
			return False
	return True

def filterItemInKBEngineList(lst, func):
	delItems = []
	for item in lst:
		if not func(item):
			delItems.append(item)

	for item in delItems:
		lst.remove(item)
	return lst

def transTuple2Dict(tupList):
	res = []
	for tup in tupList:
		res.append({"itemId":tup[0], "count":tup[1]})
	return res

def getPrayAlchemyRewardBase(level):
	reward = (math.floor(level / 10) + 1) * math.floor(level / 10)/2 * 100 + (level % 10) * math.ceil(level/10)*10 - 5
	reward = reward * 1000
	return reward

def initBaseApp():
	# 初始化某些表
	return

def getRandomMercenaryCallList(): #根据权重获取随机的点将列表 2,2,4,4
	def getRandomMercenaryCall(mercenaryCallList):
		allWeight = 0
		for info in mercenaryCallList:
			allWeight = allWeight + info['PROBABILITY']
		if allWeight <= 0:
			return {}
		randWeight = random.randint(1, allWeight)
		curWeight = 0
		for info in mercenaryCallList:
			curWeight = curWeight + info['PROBABILITY']
			if randWeight <= curWeight:
				return info
		return {}

	def getMercenary(mercenaryList, num):
		cloneMercenaryList = copy.copy(mercenaryList)
		if num >= len(cloneMercenaryList):
			return cloneMercenaryList
		newList = []
		while num > 0:
			dic = getRandomMercenaryCall(cloneMercenaryList)
			newList = newList + [dic]
			cloneMercenaryList.remove(dic)
			num = num - 1
		return newList

	mercenaryList = [[], [], [], []]
	mercenaryList[0] = getMercenary(rc.tableMercenaryCallList[0], 2)
	mercenaryList[1] = getMercenary(rc.tableMercenaryCallList[1], 2)
	mercenaryList[2] = getMercenary(rc.tableMercenaryCallList[2], 4)
	mercenaryList[3] = getMercenary(rc.tableMercenaryCallList[3], 4)
	return mercenaryList

def getRandomTokenReward(rewardTuple, rewardNum = 1): #点点女妖精根据道具包里面的权重获取一定数量的道具
	allWeight = 0
	weightList = []
	for reward in rewardTuple:
		allWeight += reward[2]
		weightList.append(allWeight)

	# def getRandomReward():
	# 	randWeight = random.randint(1, allWeight)
	# 	curWeight = 0
	# 	for reward in rewardTuple:
	# 		curWeight += reward[2]
	# 		if randWeight <= curWeight:
	# 			if reward[0] == 0:
	# 				return []
	# 			else:
	# 				itemList = [{"tokenId": reward[0], "count": reward[1]}]
	# 				return itemList

	rewardList = []
	while rewardNum > 0:
		# itemList = getRandomReward()
		idx = binarySearch(weightList, random.randint(1, allWeight))
		if rewardTuple[idx][0] > 0:
			rewardList.append({"tokenId": rewardTuple[idx][0], "count": rewardTuple[idx][1]})
		rewardNum = rewardNum - 1
	return rewardList

def getRandomMercenaryReward(rewardTuple, rewardNum = 1): #点点女妖精根据道具包里面的权重获取一定数量的道具
	allWeight = 0
	weightList = []
	for reward in rewardTuple:
		allWeight = allWeight + reward[1]
		weightList.append(allWeight)

	midList = []
	while rewardNum > 0:
		idx = binarySearch(weightList, random.randint(1, allWeight))
		if rewardTuple[idx][0] > 0:
			midList.append(rewardTuple[idx][0])
		rewardNum = rewardNum - 1
	return midList

def binarySearch(targetList, val, func = (lambda x, val: val-x)):
	# 二分查找
	curIndex = 0
	fromIndex = 0
	toIndex = len(targetList) - 1
	while(toIndex > fromIndex):
		curIndex = int((fromIndex + toIndex) / 2)
		if func(targetList[curIndex], val) < 0:
			toIndex = curIndex
		elif func(targetList[curIndex], val) > 0:
			fromIndex = curIndex + 1
		elif func(targetList[curIndex], val) == 0:
			return curIndex + 1
	return toIndex

# 创建Singleton
def createSingletonFromDB(entityName, globalname, dbid, props):
	def onCreateCallBack(baseRef, databaseID, wasActive):
		if baseRef:
			DEBUG_MSG("createSingletonFromDB: %s create from DB success, databaseID:[%i]" % (entityName, databaseID))
			baseRef.writeToDB()
			# 向全局共享数据中注册这个管理器的mailbox以便在所有逻辑进程中可以方便的访问
			KBEngine.globalData[globalname] = baseRef
		else:
			WARNING_MSG("createSingletonFromDB: %s create from DB failed" % entityName)
			singleton = KBEngine.createEntityLocally( entityName, props )
			def onWriteToDB(success, entity):
				if success:
					DEBUG_MSG("createSingletonFromDB: %s writeToDB success, dbid:[%i]" % (entityName, entity.databaseID))
					entity.writeToDB()	# TODO, to delete if auto-writeToDB each 15 min
					KBEngine.globalData[globalname] = entity
				else:
					ERROR_MSG("createSingletonFromDB: %s writeToDB failed" % entityName)
			singleton.writeToDB(onWriteToDB)
	KBEngine.createEntityFromDBID(entityName, dbid, onCreateCallBack)
