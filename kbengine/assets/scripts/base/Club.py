# -*- coding: utf-8 -*-
import KBEngine
from KBEDebug import *
from BaseEntity import BaseEntity
import const
import x42
from clubmembers.ClubTable import TableManager
from Functor import Functor
import utility
import inspect
import dbi
import copy
import time
import Events

OP2NAME = {
	const.CLUB_OP_AGREE_IN		: 'agreeInClub',
	const.CLUB_OP_REFUSE_IN		: 'refuseInClub',
	const.CLUB_OP_INVITE_IN		: 'inviteInClub',
	const.CLUB_OP_KICK_OUT		: 'kickOutClub',
	const.CLUB_OP_APPLY_IN		: 'applyInClub',
	const.CLUB_OP_APPLY_OUT		: 'applyOutClub',
	const.CLUB_OP_SET_NAME		: 'setClubName',
	const.CLUB_OP_SET_NOTICE	: 'setClubNotice',
	const.CLUB_OP_GET_MEMBERS	: 'getClubMembers',
	const.CLUB_OP_GET_APPLICANTS: 'getClubApplicants',
	const.CLUB_OP_SIT_DOWN		: 'sitDown',
	const.CLUB_OP_SET_MEMBER_NOTES	: 'setMemberNotes',
	const.CLUB_OP_GET_TABLE_DETAIL	: 'getTableDetailInfo',
	const.CLUB_OP_GET_RECORDS		: 'getClubRecords',
	const.CLUB_OP_DEMISE			: 'demise',
	const.CLUB_OP_PRODDUCE_DISMISS	: 'produceDismiss',
}

OWNER_ONLY_OP = [const.CLUB_OP_AGREE_IN, const.CLUB_OP_REFUSE_IN, const.CLUB_OP_INVITE_IN,
				 const.CLUB_OP_KICK_OUT, const.CLUB_OP_SET_NAME, const.CLUB_OP_GET_APPLICANTS,
				 const.CLUB_OP_SET_NOTICE, const.CLUB_OP_SET_MEMBER_NOTES, const.CLUB_OP_DEMISE]
MEMBER_ONLY_OP = [const.CLUB_OP_APPLY_OUT]
COMMON_OP = [const.CLUB_OP_GET_MEMBERS, const.CLUB_OP_SIT_DOWN, const.CLUB_OP_GET_TABLE_DETAIL,
			 const.CLUB_OP_GET_RECORDS]
NON_MEMBER_OP = [const.CLUB_OP_APPLY_IN]


class Club(BaseEntity):

	def __init__(self):
		BaseEntity.__init__(self)
		# 先初始化消息管理器
		self.event_mgr = Events.EventMgr()
		self.table_mgr = TableManager(self)
		self.registerEvent()
		self.dismiss_apply = {}

	def registerEvent(self):
		self.event_mgr.destroy()
		self.event_mgr.register_event(Events.EVENT_OWNER_CHANGE, self.onOwnerChange)
		self.event_mgr.register_event(Events.EVENT_DISMISS_ADD, self.onDissmissAdd)
		self.event_mgr.register_event(Events.EVENT_DISMISS_SUB, self.onDissmissSub)
		self.event_mgr.register_event(Events.EVENT_DISMISS_CHANGE, self.onDissmissChange)


	def doOperation(self, avatar_mb, op, args):
		""" 各种操作的dispatcher, 集中检查权限 """
		INFO_MSG("Club doOperation op_uid = {}, op = {}, args = {}".format(avatar_mb.userId, op, args))
		uid = avatar_mb.userId

		# 检查操作是否存在
		if op not in OP2NAME:
			avatar_mb.clubOperationFailed(const.CLUB_OP_ERR_WRONG_ARGS)
			return

		# 检查操作权限
		if op not in NON_MEMBER_OP and not self.isMember(uid):
			avatar_mb.clubOperationFailed(const.CLUB_OP_ERR_PERMISSION_DENY)
			return
		if op in OWNER_ONLY_OP and not self.isOwner(uid):
			avatar_mb.clubOperationFailed(const.CLUB_OP_ERR_PERMISSION_DENY)
			return
		if op in MEMBER_ONLY_OP:
			if self.isOwner(uid):
				if op == const.CLUB_OP_APPLY_OUT:
					avatar_mb.showTip("无法退出, 请解散亲友圈")
					return

		f = getattr(self, OP2NAME[op])
		if callable(f):
			sig = inspect.signature(f)
			if len(sig.parameters.keys()) == len(args) + 1:
				f(avatar_mb, *args)
			else:
				ERROR_MSG("Club doOperation Arguments Error:{}".format((avatar_mb.userId, op, args)))
		else:
			ERROR_MSG("Club doOperation NonFunction Error:{}".format((avatar_mb.userId, op, args)))

##################################################################################################################
# ---------------------------------------------- CLUB OPERATION --------------------------------------------------
##################################################################################################################

	def demise(self, avt_mb, uid):
		if self.isOwner(uid) or not self.isMember(uid):
			avt_mb.showTip("被转让玩家权限不足")
			return
		avt = x42.GW.avatars.get(self.owner['userId'])
		if avt and avt.isDestroyed is False: 	# 被转让玩家在线
			pass
		else:									# 被转让玩家不在线
			pass

		def query_cb(result):
			if result:
				member_info = self.members[uid]
				self.owner = {
					'userId'		: member_info['userId'],
					'uuid'			: member_info['uuid'],
					'sex'			: member_info['sex'],
					'nickname'		: member_info['nickname'],
					'head_icon'		: member_info['head_icon'],
					'accountName' 	: result['accountName']
				}
				self.event_mgr.push_event(Events.EVENT_OWNER_CHANGE)
				# self.event_mgr.push_event(Events.EVENT_DISMISS_CHANGE)
			else:
				avt_mb.showTip("玩家不存在")

		x42.GW.getUserInfoByUID(uid, query_cb)

	def applyDismiss(self, table_index, room_id):
		info = {
			'table_index'	: table_index,
			'room_id'		: room_id,
			'time'			: int(time.time())
		}
		self.dismiss_apply[table_index] = info
		self.event_mgr.push_event(Events.EVENT_DISMISS_ADD, info)

	def cancelDismiss(self, table_index):
		if self.dismiss_apply.get(table_index, None) is None:
			return
		self.dismiss_apply.pop(table_index)
		self.event_mgr.push_event(Events.EVENT_DISMISS_SUB, table_index)

	def produceDismiss(self, avatar_mb, table_index, agree):
		if self.dismiss_apply.get(table_index, None) is None:
			avatar_mb.showTip("申请不存在")
			return
		self.dismiss_apply.pop(table_index)
		self.event_mgr.push_event(Events.EVENT_DISMISS_SUB, table_index)
		agree and self.table_mgr.dismissTableRoom(avatar_mb, table_index)

	def applyInClub(self, avatar_mb):
		uid = avatar_mb.userId
		if len(avatar_mb.clubList) >= const.CLUB_NUM_LIMIT:
			avatar_mb.showTip("达到亲友圈数量上限, 无法加入更多亲友圈")
			return
		if uid in self.members:
			avatar_mb.showTip("您已经在该亲友圈中, 无需重复加入")
			return
		if self.isApplicant(uid):
			avatar_mb.showTip("请等待审核, 无需重复申请")
			return
		if len(self.members) >= const.CLUB_MEMBER_LIMIT:
			avatar_mb.showTip("亲友圈成员已满, 请加入别的亲友圈")
			return

		app_info = {
			'userId': uid,
			'uuid': avatar_mb.uuid,
			'sex':avatar_mb.sex,
			'nickname': avatar_mb.name,
			'head_icon': avatar_mb.head_icon,
			'ts': utility.get_cur_timestamp(),
		}
		self.applicants[uid] = app_info
		avatar_mb.showTip("申请已发送, 请联系亲友圈老板通过审核")

	def applyOutClub(self, avatar_mb):
		uid = avatar_mb.userId
		if self.isOwner(uid):
			avatar_mb.showTip("无法退出, 请解散亲友圈")
			return

		if uid in self.members:
			del self.members[uid]
		avatar_mb.leaveOneClub(self.clubId, "退出亲友圈成功")

	def agreeInClub(self, avatar_mb, target_uid):
		app_info = self.applicants.get(target_uid)
		if app_info is None:
			app_list = self.getApplicants()
			avatar_mb.gotClubApplicants(app_list)
			return
		if len(self.members) >= const.CLUB_MEMBER_LIMIT:
			avatar_mb.showTip("操作失败, 亲友圈成员已满")
			return

		# 移出申请列表
		del self.applicants[target_uid]

		if target_uid in self.members:
			avatar_mb.showTip("该玩家已经是亲友圈成员")
			avatar_mb.gotClubApplicants(self.getApplicants())
			return

		# 将玩家加入亲友圈成员
		mem_info = {
			'userId': target_uid,
			'uuid': app_info['uuid'],
			'sex': app_info['sex'],
			'nickname': app_info['nickname'],
			'head_icon': app_info['head_icon'],
			'notes': '',
			'ts': utility.get_cur_timestamp(),
		}

		def add_cb(avatar_mb, result, msg=None):
			if result:
				avatar_mb.gotClubMembers(self.getMembers())
			else:
				msg and avatar_mb.showTip(msg)
		self._addMemberIn(target_uid, mem_info, Functor(add_cb, avatar_mb))
		avatar_mb.gotClubApplicants(self.getApplicants())

	def refuseInClub(self, avatar_mb, target_uid):
		if target_uid in self.applicants:
			del self.applicants[target_uid]

		avatar_mb.gotClubApplicants(self.getApplicants())

	def kickOutClub(self, avatar_mb, target_uid):
		if target_uid not in self.members:
			avatar_mb.gotClubMembers(self.getMembers())
			return

		if self.isOwner(target_uid):
			avatar_mb.showTip("不能对亲友圈老板进行该操作")
			return

		self._kickMemberOut(target_uid)
		avatar_mb.gotClubMembers(self.getMembers())

	def setClubName(self, avatar_mb, new_name):
		new_name = utility.filter_emoji(new_name)
		new_name = new_name[:const.CLUB_NAME_LENGTH]
		self.name = new_name
		avatar_mb.setClubNameSucceed(self.clubId, new_name)

	def setClubNotice(self, avatar_mb, new_notice):
		new_notice = utility.filter_emoji(new_notice)
		new_notice = new_notice[:const.CLUB_NOTICE_LENGTH]
		self.notice = new_notice
		avatar_mb.setClubNoticeSucceed(self.clubId, new_notice)

	def setMemberNotes(self, avatar_mb, target_uid, notes):
		mem = self.members.get(target_uid)
		if mem:
			notes = utility.filter_emoji(notes)
			notes = notes[:const.MEMBER_NOTES_LENGTH]
			mem['notes'] = notes
			avatar_mb.gotClubMembers(self.getMembers())
		else:
			avatar_mb.showTip("成员不存在")
			avatar_mb.gotClubMembers(self.getMembers())

	def inviteInClub(self, avatar_mb, target_uid):
		if target_uid in self.members:
			avatar_mb.showTip("该玩家已经是亲友圈成员")
			return

		def query_cb(uinfo):
			# 将玩家加入亲友圈成员
			mem_info = {
				'userId': target_uid,
				'uuid': uinfo['uuid'],
				'sex': uinfo['sex'],
				'nickname': uinfo['name'],
				'head_icon': uinfo['head_icon'],
				'notes': '',
				'ts': utility.get_cur_timestamp(),
			}

			def add_cb(avatar_mb, result, msg=None):
				if result:
					avatar_mb.showTip("邀请成功")
					avatar_mb.gotClubMembers(self.getMembers())
				else:
					msg and avatar_mb.showTip(msg)

			self._addMemberIn(target_uid, mem_info, Functor(add_cb, avatar_mb))

		x42.GW.getUserInfoByUID(target_uid, query_cb)

	def getClubMembers(self, avatar_mb):
		if self.isOwner(avatar_mb.userId):
			mem_list = self.getMembers()
		else:
			mem_list = self.getMembersWithoutNotes()
		avatar_mb.gotClubMembers(mem_list)

	def getClubApplicants(self, avatar_mb):
		app_list = self.getApplicants()
		avatar_mb.gotClubApplicants(app_list)

	def sitDown(self, avatar_mb, table_idx):
		DEBUG_MSG("sit down table_idx:{}".format(table_idx))
		self.table_mgr.takeASeat(avatar_mb, table_idx)

	def getTableDetailInfo(self, avatar_mb, table_idx):
		table = self.table_mgr.getTable(table_idx)
		if table is None:
			avatar_mb.showTip("桌子编号错误")
			return

		detail = table.getDetailInfo()
		avatar_mb.gotTableDetailInfo(table_idx, detail)

	def getClubRecords(self, avatar_mb):
		rec = list(self.records)
		avatar_mb.gotClubRecords(self.clubId, rec)

##################################################################################################################
# ---------------------------------------------- CLUB OPERATION --------------------------------------------------
##################################################################################################################

	def _kickALLMembersOut(self):
		""" 仅仅在解散的时候调用 """
		for uid in self.members:
			avt = x42.GW.avatars.get(uid)
			if avt and not avt.isDestroyed:
				avt.leaveOneClub(self.clubId)

		# 玩家上线的时候会检查处理, 其实这里不操作DB也没问题
		def delete_cb(result, error):
			if error:
				ERROR_MSG("kickOutClub delete_cb Error = {}".format(error))

		dbi.deleteClub(self.clubId, delete_cb)

	def _kickMemberOut(self, target_uid):
		""" 这里写的通用逻辑, 不要直接使用此接口, 因为没有检查权限 """
		# 移出亲友圈成员列表
		self.members.pop(target_uid, None)
		# 处理玩家的亲友圈列表
		avt = x42.GW.avatars.get(target_uid)
		if avt and not avt.isDestroyed:
			avt.leaveOneClub(self.clubId)
		else:
			# 玩家上线的时候会检查处理, 其实这里不操作DB也没问题
			def kick_cb(club_id, uid, result, error):
				if not result:
					ERROR_MSG("_kickMemberOut kick_cb clubId:{}, userId: Error = {}".format(club_id, uid, error))

			dbi.kickOfflineMemberOutClub(self.clubId, target_uid, Functor(kick_cb, self.clubId, target_uid))

	def _addMemberIn(self, target_uid, mem_info, callback=None):
		""" 这里写的通用逻辑, 不要直接使用此接口, 因为没有检查权限 """
		# 需要检查玩家加入的亲友圈数量
		avt = x42.GW.avatars.get(target_uid)
		if avt and not avt.isDestroyed:
			if len(avt.clubList) < const.CLUB_NUM_LIMIT:
				# 加入亲友圈成员列表
				self.members[target_uid] = mem_info
				avt.joinOneClub(self.clubId)
				callable(callback) and callback(True)
			else:
				callable(callback) and callback(False, "该玩家亲友圈数量达到上限, 无法再加入本亲友圈")
		else:
			def add_cb(result, error):
				if result:
					# 加入亲友圈成员列表
					self.members[target_uid] = mem_info
					callable(callback) and callback(True)
				else:
					DEBUG_MSG("_addMemberIn add_cb clubId:{}, userId: Error = {}".format(self.clubId, target_uid, error))
					callable(callback) and callback(False, "该玩家亲友圈数量达到上限, 无法再加入本亲友圈")

			dbi.addOfflineMemberInClub(self.clubId, target_uid, add_cb)

	def dismiss(self):
		""" 解散亲友圈, 此条目将从数据库中删除 """
		try:
			x42.GW.clubDismissed(self.clubId)
			self._kickALLMembersOut()
		except:
			import traceback
			ERROR_MSG(traceback.format_exc())
		finally:
			self.destroy(True)

	def saveTableResult(self, result):
		self.records.append(result)

	def processTableResult(self):
		now = utility.get_cur_timestamp()
		keep = []
		for r in self.records:
			ts = r['time']
			if now - ts < const.CLUB_TABLE_RESULT_TTL:
				keep.append(r)
		self.records = keep

	def isOwner(self, user_id):
		return self.owner['userId'] == user_id

	def isMember(self, user_id):
		return user_id in self.members

	def isApplicant(self, user_id):
		return user_id in self.applicants

	def broadcastSeatInfo(self):
		seat_list = self.table_mgr.getTableListInfo()
		for uid in self.members:
			avt = x42.GW.avatars.get(uid)
			avt and avt.gotClubTableList(self.clubId, seat_list)

	def getMembers(self):
		mem_list = copy.deepcopy(list(self.members.values()))
		mem_list = sorted(mem_list, key=lambda x: x['ts'], reverse=True)
		return mem_list

	def getApplicants(self):
		app_list = copy.deepcopy(list(self.applicants.values()))
		app_list = sorted(app_list, key=lambda x: x['ts'])
		return app_list

	def getMembersWithoutNotes(self):
		mem_list = copy.deepcopy(list(self.members.values()))
		for mem in mem_list:
			mem['notes'] = ''
		mem_list = sorted(mem_list, key=lambda x: x['ts'], reverse=True)
		return mem_list

	def getAbstract(self, uid):
		return {
			'club_id': self.clubId,
			'club_name': self.name,
			'owner': dict(self.owner),
			'room_type': utility.getRoomParams(dict(self.roomType)),
			'dismiss_apply_list': list(self.dismiss_apply.values()) if self.owner['userId'] == uid else []
		}

	def getDetailInfo(self, uid):
		return {
			'club_id': self.clubId,
			'club_name': self.name,
			'club_notice': self.notice,
			'member_num': len(self.members),
			'room_type':  utility.getRoomParams(dict(self.roomType)),
			'owner': dict(self.owner),
			'table_info_list': self.table_mgr.getTableListInfo(),
			'dismiss_apply_list': list(self.dismiss_apply.values()) if self.owner['userId'] == uid else []
		}

	def onOwnerChange(self, event_args):
		self.broadCastEvent(Events.EVENT_OWNER_CHANGE, self.owner)

	def onDissmissChange(self, event_args):
		self.broadCastOwnerEvent(Events.EVENT_DISMISS_CHANGE, list(self.dismiss_apply.values()))

	def onDissmissAdd(self, event_args):
		self.broadCastOwnerEvent(Events.EVENT_DISMISS_ADD, event_args)

	def onDissmissSub(self, event_args):
		self.broadCastOwnerEvent(Events.EVENT_DISMISS_SUB, event_args)

	def broadCastEvent(self, event_id, data):
		INFO_MSG("###Event### broadCastEvent club[{}] event[{}] data:{}".format(self.clubId, event_id, data))
		for uid in self.members.keys():
			avt = x42.GW.avatars.get(uid)
			if avt and avt.isDestroyed is False:
				avt.pushClubEventToClient(self.clubId, event_id, data)

	def broadCastOwnerEvent(self, event_id, data):
		INFO_MSG("###Event### broadCastOwnerEvent club[{}] event[{}] data:{}".format(self.clubId, event_id, data))
		avt = x42.GW.avatars.get(self.owner['userId'])
		if avt and avt.isDestroyed is False:
			avt.pushClubEventToClient(self.clubId, event_id, data)