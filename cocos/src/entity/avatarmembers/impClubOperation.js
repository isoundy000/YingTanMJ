"use strict";
/*-----------------------------------------------------------------------------------------
												interface
-----------------------------------------------------------------------------------------*/
var impClubOperation = impPlaybackOperation.extend({
	__init__: function () {
		this._super();
		KBEngine.DEBUG_MSG("Create impClubOperation");
		this.club_entity_list = [];
		this.club_entity_dict = {};
	},

	createClub : function(clubName, clubParams) {
	    cc.log("createClub", clubName, clubParams);
		this.baseCall("createClub", clubName, clubParams);
	},

	createClubSucceed:function (club_detail) {
        cc.log("createClubSucceed: ", club_detail);

		var club = new ClubEntity({
            "club_id" : club_detail["club_id"],
            "club_name" : club_detail["club_name"],
            "owner" : club_detail["owner"],
        });
		club.update_club_info(club_detail);
        this.club_entity_list.push(club);
        this.club_entity_dict[club.club_id] = club;
        if(h1global.curUIMgr.clubview_ui && h1global.curUIMgr.clubview_ui.is_show){
            var base_info_list = [];
            for(var i=0; i< this.club_entity_list.length; i++){
                base_info_list.push(this.club_entity_list[i].get_base_info());
            }
            h1global.curUIMgr.clubview_ui.update_club_scroll(base_info_list);
        }
        if(h1global.curUIMgr.club_ui && !h1global.curUIMgr.club_ui.is_show){
            h1global.curUIMgr.club_ui.show_by_info(club.club_id);
        }
    },

	deleteClub: function (club_id) {
		this.baseCall("deleteClub", club_id);
	},

	deleteClubSucceed: function (club_id) {
		if(this.club_entity_dict[club_id]){
			delete this.club_entity_dict[club_id];
			for(var i=0; i<this.club_entity_list.length; i++){
				if(this.club_entity_list[i].club_id === club_id){
                    this.club_entity_list.splice(i, 1);
				}
			}
		}

		if(h1global.curUIMgr.club_ui && h1global.curUIMgr.club_ui.is_show){
            h1global.curUIMgr.club_ui.hide();
		}
        if(h1global.curUIMgr.clubview_ui && h1global.curUIMgr.clubview_ui.is_show){
            var club_base_list = [];
            for(var j=0; j<this.club_entity_list.length; j++){
                club_base_list.push(this.club_entity_list[j].get_base_info());
            }
            h1global.curUIMgr.clubview_ui.update_club_scroll(club_base_list);
        }
    },

	getClubListInfo: function () {
		this.baseCall("getClubListInfo");
	},

	getClubDetailInfo: function (club_id) {
		this.baseCall("getClubDetailInfo", club_id);
	},

	clubOperation: function (op, club_id, args) {
        args = args || [];
        cc.log("clubOperation", op, club_id, args);
		this.baseCall("clubOperation", op, club_id, JSON.stringify(args));
	},

	gotClubListInfo: function (club_base_list) {
		cc.log("gotClubListInfo: ", club_base_list);
        this.club_entity_list = [];
        this.club_entity_dict = {};
        for(var i =0; i<club_base_list.length; i++){
            this.club_entity_list.push(new ClubEntity(club_base_list[i]));
			this.club_entity_dict[club_base_list[i]["club_id"]] = this.club_entity_list[i]
		}
		if(h1global.curUIMgr){
            if(h1global.curUIMgr.clubview_ui && h1global.curUIMgr.clubview_ui.is_show){
                h1global.curUIMgr.clubview_ui.update_club_scroll(club_base_list);
            }
            // 退出/踢出 亲友圈
            if(h1global.curUIMgr.club_ui && h1global.curUIMgr.club_ui.is_show){
                let show_club_id = h1global.curUIMgr.club_ui.club.club_id;
                if(!this.club_entity_dict[show_club_id]){
                    h1global.curUIMgr.club_ui.hide();
                }
            }

            // 退出/踢出 亲友圈
            if(h1global.curUIMgr.clubconfig_ui && h1global.curUIMgr.clubconfig_ui.is_show){
                h1global.curUIMgr.clubconfig_ui.hide();
            }

            if(h1global.curUIMgr.clubmember_ui && h1global.curUIMgr.clubmember_ui.is_show){
                let show_club_id = h1global.curUIMgr.clubmember_ui.club.club_id;
                if(!this.club_entity_dict[show_club_id]){
                    h1global.curUIMgr.clubmember_ui.hide();
                }
            }

            if(h1global.curUIMgr.clubrecord_ui && h1global.curUIMgr.clubrecord_ui.is_show){
                let show_club_id = h1global.curUIMgr.clubrecord_ui.club.club_id;
                if(!this.club_entity_dict[show_club_id]){
                    h1global.curUIMgr.clubrecord_ui.hide();
                }
            }

            if(h1global.curUIMgr.clubmgr_ui && h1global.curUIMgr.clubmgr_ui.is_show){
                let show_club_id = h1global.curUIMgr.clubmgr_ui.club.club_id;
                if(!this.club_entity_dict[show_club_id]){
                    h1global.curUIMgr.clubmgr_ui.hide();
                }
            }
        }
	},

	gotClubDetailInfo: function (club_detail) {
		cc.log("gotClubDetailInfo: ", club_detail);
		if(!this.club_entity_dict[club_detail["club_id"]]){
		    return;
        }
        this.club_entity_dict[club_detail["club_id"]].update_club_info(club_detail);
        if(h1global.curUIMgr.club_ui && !h1global.curUIMgr.club_ui.is_show){
            h1global.curUIMgr.club_ui.show_by_info(club_detail["club_id"]);
        }
	},

	gotTableDetailInfo: function (t_idx, table_detail) {
		cc.log("gotTableDetailInfo: ", t_idx, table_detail);
		if(h1global.curUIMgr.clubroomdetail_ui && !h1global.curUIMgr.clubroomdetail_ui.is_show){
            h1global.curUIMgr.clubroomdetail_ui.show_by_info(t_idx, table_detail)
		}
	},

	gotClubTableList: function (club_id, seat_info_list) {
		cc.log("gotClubTableList: ", club_id, seat_info_list);
        if(!this.club_entity_dict[club_id]){
            return;
        }
        this.club_entity_dict[club_id].update_table_list(seat_info_list);
        if(h1global.curUIMgr.club_ui && h1global.curUIMgr.club_ui.is_show){
            h1global.curUIMgr.club_ui.update_desk_panel(club_id, seat_info_list);
        }
	},

	setClubNameSucceed: function (club_id, name) {
		cc.log("setClubNameSucceed: ", club_id, name);
        if(!this.club_entity_dict[club_id]){
            return;
        }
        this.club_entity_dict[club_id].club_name = name;

        if(h1global.curUIMgr.clubmgr_ui && h1global.curUIMgr.clubmgr_ui.is_show){
            h1global.curUIMgr.clubmgr_ui.update_club_name(club_id);
        }
        if(h1global.curUIMgr.club_ui && h1global.curUIMgr.club_ui.is_show){
            h1global.curUIMgr.club_ui.update_club_name(club_id);
        }
        if(h1global.curUIMgr.clubview_ui && h1global.curUIMgr.clubview_ui.is_show){
            var base_info_list = [];
            for(var i=0; i< this.club_entity_list.length; i++){
                base_info_list.push(this.club_entity_list[i].get_base_info());
            }
            h1global.curUIMgr.clubview_ui.update_club_scroll(base_info_list);
        }
	},

	setClubNoticeSucceed: function (club_id, notice) {
		cc.log("setClubNoticeSucceed: ", club_id, notice);
        if(!this.club_entity_dict[club_id]){
            return;
        }
        this.club_entity_dict[club_id].club_notice = notice;
        if(h1global.curUIMgr.clubmgr_ui && h1global.curUIMgr.clubmgr_ui.is_show){
            h1global.curUIMgr.clubmgr_ui.update_club_notice(club_id);
        }
        if(h1global.curUIMgr.club_ui && h1global.curUIMgr.club_ui.is_show){
            h1global.curUIMgr.club_ui.show_notice(club_id, notice);
        }
        // club_ui ?
	},

	setMemberNotesSucceed: function (club_id, mem_uid, notes) {
		cc.log("setMemberNotesSucceed", club_id, mem_uid, notes);
	},

	gotClubMembers: function (member_list) {
		cc.log("gotClubMembers: ", member_list);
		if(h1global.curUIMgr.clubmember_ui && h1global.curUIMgr.clubmember_ui.is_show){
            h1global.curUIMgr.clubmember_ui.update_club_member(member_list)
		}

        if(h1global.curUIMgr.demise_ui && h1global.curUIMgr.demise_ui.is_show){
            h1global.curUIMgr.demise_ui.update_club_member(member_list)
        }
	},

	gotClubApplicants: function (applicant_list) {
		cc.log("gotClubApplicants: ", applicant_list);
        if(h1global.curUIMgr.clubmember_ui && h1global.curUIMgr.clubmember_ui.is_show){
            h1global.curUIMgr.clubmember_ui.update_club_apply(applicant_list)
        }
	},

    gotClubRecords:function (club_id, record_list) {
        cc.log("gotClubRecords", club_id, record_list);
        if(h1global.curUIMgr.clubrecord_ui && h1global.curUIMgr.clubrecord_ui.is_show){
            h1global.curUIMgr.clubrecord_ui.update_recrod(club_id, record_list);
		}
    },

	clubOperationFailed: function (err_code) {
		cc.log("clubOperationFailed err = ", err_code);
        if(err_code === const_val.CLUB_OP_ERR_PERMISSION_DENY){
            h1global.globalUIMgr.info_ui.show_by_info("权限不足", cc.size(300, 200));
        } else if(err_code === const_val.CLUB_OP_ERR_INVALID_OP){
            h1global.globalUIMgr.info_ui.show_by_info("非法操作", cc.size(300, 200));
        } else if(err_code === const_val.CLUB_OP_ERR_NUM_LIMIT){
            h1global.globalUIMgr.info_ui.show_by_info("亲友圈数量限制", cc.size(300, 200));
        } else if(err_code === const_val.CLUB_OP_ERR_WRONG_ARGS){
            h1global.globalUIMgr.info_ui.show_by_info("参数错误", cc.size(300, 200));
        } else if(err_code === const_val.CLUB_OP_ERR_CLUB_NOT_EXIST){
            h1global.globalUIMgr.info_ui.show_by_info("亲友圈不存在", cc.size(300, 200));
        }
	},

    clubEvent_OC:function (club_id, event_msg) {
        cc.log("clubEvent_OC", club_id, event_msg);

        if(this.club_entity_dict[club_id]){
            var cur_owner_id = this.club_entity_dict[club_id].owner.userId;
             this.club_entity_dict[club_id].owner = event_msg;
            if(this.userId === cur_owner_id || this.userId === event_msg["userId"]){
                h1global.entityManager.close()
            }
        }
    },
    clubEvent_DA:function (club_id, event_msg) {
        cc.log("clubEvent_DA", club_id, event_msg);
        if(this.club_entity_dict[club_id]){
            var cover = false;
            for(var i=0; i<this.club_entity_dict[club_id].dismiss_apply_list.length; i++){
                if(this.club_entity_dict[club_id].dismiss_apply_list[i]["table_index"] === event_msg["table_index"]){
                    this.club_entity_dict[club_id].dismiss_apply_list[i] = event_msg;
                    cover = true;
                    break
                }
            }
            if(!cover){
                this.club_entity_dict[club_id].dismiss_apply_list.push(event_msg);
            }
            if(h1global.curUIMgr.dismissapply_ui && h1global.curUIMgr.dismissapply_ui.is_show){
                h1global.curUIMgr.dismissapply_ui.update_msg(club_id, this.club_entity_dict[club_id].dismiss_apply_list);
            }
        }
    },
    clubEvent_DS:function (club_id, event_msg) {
        cc.log("clubEvent_DS", club_id, event_msg);
        if(this.club_entity_dict[club_id]){
            for(var i=0; i<this.club_entity_dict[club_id].dismiss_apply_list.length; i++){
                if(this.club_entity_dict[club_id].dismiss_apply_list[i]["table_index"] === event_msg){
                    this.club_entity_dict[club_id].dismiss_apply_list.splice(i, 1);
                    break
                }
            }
            if(h1global.curUIMgr.dismissapply_ui && h1global.curUIMgr.dismissapply_ui.is_show){
                h1global.curUIMgr.dismissapply_ui.update_msg(club_id, this.club_entity_dict[club_id].dismiss_apply_list);
            }
        }
    },
    clubEvent_DC:function (club_id, event_msg) {
        cc.log("clubEvent_DC", club_id, event_msg)
        if(this.club_entity_dict[club_id]){
            this.club_entity_dict[club_id].dismiss_apply_list = event_msg;

            if(h1global.curUIMgr.dismissapply_ui && h1global.curUIMgr.dismissapply_ui.is_show){
                h1global.curUIMgr.dismissapply_ui.update_msg(club_id, event_msg);
            }
        }
    },
});