"use strict";

var GameRoomEntity = KBEngine.Entity.extend({
	ctor : function(player_num)
	{
		
		this._super();
		this.roomID = undefined;
		this.curRound = 0;
		this.maxRound = 8;
		this.luckyTileNum = 0;
		this.ownerId = undefined;
		this.dealerIdx = 0;
		this.isAgent = false;
		this.king_num = 1;
  		this.player_num = player_num || 4;
  		this.pay_mode = 0;
  		this.game_mode = 0;
  		this.max_lose = 9999;
  		this.hand_prepare = 1;
  		this.roomType = undefined;
    	this.club_id = 0;

        this.playerInfoList = [];
        this.playerDistanceList = [];
        this.playerStateList = [];
        this.handTilesList = [];
        this.upTilesList = [];
        this.upTilesOpsList = [];
        this.discardTilesList = [];
        this.cutIdxsList = [];
        this.wreathsList = [];
        this.discardStateList = [];
    	for(var i=0; i<player_num; i++){
            this.playerInfoList.push(null);
            this.playerDistanceList.push(new Array(this.player_num).fill(-1));
            this.playerStateList.push(0);
            this.handTilesList.push([]);
            this.upTilesList.push([]);
            this.upTilesOpsList.push([]);
            this.discardTilesList.push([]);
            this.cutIdxsList.push([]);
            this.wreathsList.push([]);
            this.discardStateList.push(const_val.DISCARD_FREE)
		}

		this.prevailing_wind = const_val.WIND_EAST;
		this.playerWindList = [const_val.WIND_EAST, const_val.WIND_SOUTH, const_val.WIND_WEST, const_val.WIND_NORTH];
		this.curPlayerSitNum = 0;
		this.room_state = const_val.ROOM_WAITING;
		this.lastDiscardTile = -1;
		this.lastDrawTile = -1;
    	this.last_op = -1;
		this.lastDiscardTileFrom = -1;
		this.leftTileNum = 60;

		this.kingTiles = [];	// 财神(多个)

		this.applyCloseLeftTime = 0;
		this.applyCloseFrom = 0;
		this.applyCloseStateList = new Array(this.player_num).fill(0);

		this.waitAidList = []; // 玩家操作列表，[]表示没有玩家操作

		this.history_result = {};
		// 每局不清除的信息
		this.playerScoreList = new Array(this.player_num).fill(0);
		this.msgList = [];		//所有的聊天记录
	    KBEngine.DEBUG_MSG("Create GameRoomEntity")
  	},

  	reconnectRoomData : function(recRoomInfo){
  		cc.log("reconnectRoomData",recRoomInfo)
  		this.curPlayerSitNum = recRoomInfo["curPlayerSitNum"];
  		this.room_state = recRoomInfo["room_state"];
  		this.playerStateList = recRoomInfo["player_state_list"];
  		this.lastDiscardTile = recRoomInfo["lastDiscardTile"];
  		this.lastDrawTile = recRoomInfo["lastDrawTile"]
  		this.lastDiscardTileFrom = recRoomInfo["lastDiscardTileFrom"];
  		this.leftTileNum = recRoomInfo["leftTileNum"];
  		this.kingTiles = recRoomInfo["kingTiles"];
  		this.prevailing_wind = recRoomInfo["prevailing_wind"];
        this.last_op = recRoomInfo["last_op"];
        if(recRoomInfo["history_result"].length>0){
            this.history_result = recRoomInfo["history_result"][0];
		} else {
            this.history_result = {}
		}
  		for(var i = 0; i < recRoomInfo["player_advance_info_list"].length; i++){

  			var curPlayerInfo = recRoomInfo["player_advance_info_list"][i];
  			this.wreathsList[i] = curPlayerInfo["wreaths"];
  			this.playerWindList[i] = curPlayerInfo["wind"];

  			this.handTilesList[i] = curPlayerInfo["tiles"];
  			this.discardTilesList[i] = curPlayerInfo["discard_tiles"];
  			this.cutIdxsList[i] = curPlayerInfo["cut_idxs"];
 
  			for(var j = 0; j < curPlayerInfo["op_list"].length; j++){
  				var op_info = curPlayerInfo["op_list"][j]; //[opId, [tile]]
  				if(op_info["opId"] == const_val.OP_PONG){
  					this.upTilesList[i].push([op_info["tiles"][0], op_info["tiles"][0], op_info["tiles"][0]]);
  					this.upTilesOpsList[i].push([op_info]);
  				} else if(op_info["opId"] == const_val.OP_EXPOSED_KONG){ //明杠
  					this.upTilesList[i].push([op_info["tiles"][0], op_info["tiles"][0], op_info["tiles"][0], op_info["tiles"][0]]);
  					this.upTilesOpsList[i].push([op_info]);
  				} else if(op_info["opId"] == const_val.OP_CONTINUE_KONG){ // 风险杠
  					var kongIdx = h1global.player().getContinueKongUpIdx(this.upTilesList[i], op_info["tiles"][0]);
  					this.upTilesList[i][kongIdx].push(op_info["tiles"][0]);
	  				this.upTilesOpsList[i][kongIdx].push(op_info);
  				}else if(op_info["opId"] == const_val.OP_CONCEALED_KONG){ // 暗杠
					if(i == h1global.player().serverSitNum){
                        this.upTilesList[i].push([0, 0, 0, op_info["tiles"][0]]);
					}else{
                        this.upTilesList[i].push([0, 0, 0, 0]);
					}

  					this.upTilesOpsList[i].push([op_info]);
  				} else if(op_info["opId"] == const_val.OP_CHOW){
  					this.upTilesList[i].push((op_info["tiles"].concat()).sort(cutil.tileSortFunc));
  					this.upTilesOpsList[i].push([op_info]);
  				}
  			}
  		}

  		this.applyCloseLeftTime = recRoomInfo["applyCloseLeftTime"];
  		this.applyCloseFrom = recRoomInfo["applyCloseFrom"];
		this.applyCloseStateList = recRoomInfo["applyCloseStateList"];
		if(this.applyCloseLeftTime > 0){
			onhookMgr.setApplyCloseLeftTime(this.applyCloseLeftTime);
		}
		this.waitAidList = recRoomInfo["waitAidList"];
		for (var i = 0; i < recRoomInfo["discardStateList"].length; i++) {
			this.updateDiscardState(i, recRoomInfo["discardStateList"][i])
		}
		this.updateRoomData(recRoomInfo["init_info"]);
		for(var i = 0; i < recRoomInfo["player_advance_info_list"].length; i++){
			var curPlayerInfo = recRoomInfo["player_advance_info_list"][i];
			this.playerInfoList[i]["score"] = curPlayerInfo["score"]
			this.playerInfoList[i]["total_score"] = curPlayerInfo["total_score"]
		}
		if (this.discard_seconds > 0) {
			onhookMgr.setWaitLeftTime(recRoomInfo["waitTimeLeft"])
		}

        if (const_val.FAKE_COUNTDOWN > 0) {
            onhookMgr.setWaitLeftTime(const_val.FAKE_COUNTDOWN);
        }
  	},

  	updateRoomData : function(roomInfo){
  		cc.log('updateRoomData:',roomInfo)
  		this.roomID = roomInfo["roomID"];
  		this.ownerId = roomInfo["ownerId"];
  		this.dealerIdx = roomInfo["dealerIdx"];
  		this.curRound = roomInfo["curRound"]
  		this.maxRound = roomInfo["maxRound"];
  		this.king_num = roomInfo["king_num"];
  		this.player_num = roomInfo["player_num"];
  		this.pay_mode = roomInfo["pay_mode"];
  		this.game_mode = roomInfo["game_mode"];
  		this.isAgent = roomInfo["isAgent"];
		this.max_lose= roomInfo["max_lose"];
		this.luckyTileNum = roomInfo["lucky_num"];
		this.discard_seconds = roomInfo["discard_seconds"];
		this.hand_prepare = roomInfo["hand_prepare"];
      	this.club_id = roomInfo["club_id"];
        this.roomType = roomInfo["roomType"];
  		for(var i = 0; i < roomInfo["player_base_info_list"].length; i++){
  			this.updatePlayerInfo(roomInfo["player_base_info_list"][i]["idx"], roomInfo["player_base_info_list"][i]);
		}
        this.updateDistanceList();
		this.addMenuShareAppMsg()
  	},

  	updatePlayerInfo : function(serverSitNum, playerInfo){
  		this.playerInfoList[serverSitNum] = playerInfo;
  	},

  	updatePlayerState : function(serverSitNum, state){
  		this.playerStateList[serverSitNum] = state;
  	},

  	updatePlayerOnlineState : function(serverSitNum, state){
  		this.playerInfoList[serverSitNum]["online"] = state;
  	},

  	updateDiscardState : function(serverSitNum, state){
  		this.discardStateList[serverSitNum] = state
  	},

	updateDistanceList : function () {
        for(var i = 0 ; i < this.playerInfoList.length ; i++) {
            for(var j = 0 ; j < this.playerInfoList.length ; j++) {
                if(i === j){this.playerDistanceList[i][j] = -1;continue;}
                if(this.playerInfoList[i] && this.playerInfoList[j]) {
                    var distance = cutil.calc_distance(parseFloat(this.playerInfoList[i]["lat"]), parseFloat(this.playerInfoList[i]["lng"]), parseFloat(this.playerInfoList[j]["lat"]), parseFloat(this.playerInfoList[j]["lng"]));
                    this.playerDistanceList[i][j] = (distance || distance == 0 ? distance : -1);
                }else {
                    this.playerDistanceList[i][j] = -1;
				}
            }
        }
    },

	getRoomCreateDict:function () {
  		return {
			"maxRound"  : this.maxRound,
			"pay_mode"  : this.pay_mode,
			"game_mode" : this.game_mode,
			"max_lose"  : this.max_lose,
			"luckyTileNum" : this.luckyTileNum,
			"hand_prepare" : this.hand_prepare,
            "player_num" : this.player_num,
		};
    },

  	startGame : function(kingTiles, wreathsList){
  		this.curRound = this.curRound + 1;
  		this.room_state = const_val.ROOM_PLAYING;
  		this.wreathsList = wreathsList;
  		this.kingTiles = kingTiles;
  		var wreathsNum = 0;
      	this.last_op = -1;
  		for (var i = 0; i < wreathsList.length; i++) {
  			wreathsNum += wreathsList[i].length
  		}

        this.handTilesList = [];
        this.upTilesList = [];
        this.upTilesOpsList = [];
        this.discardTilesList = [];
        this.cutIdxsList = [];
  		for(var i=0; i<this.player_num; i++){
            this.handTilesList.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            this.upTilesList.push([]);
            this.upTilesOpsList.push([]);
            this.discardTilesList.push([]);
            this.cutIdxsList.push([]);
		}
  		this.waitAidList = [];
  		this.discardStateList = [const_val.DISCARD_FREE, const_val.DISCARD_FREE, const_val.DISCARD_FREE, const_val.DISCARD_FREE];
  		this.leftTileNum = 135 - 13*this.player_num - wreathsNum;
  	},

  	endGame : function(){
  		// 重新开始准备
  		this.room_state = const_val.ROOM_WAITING;
  		this.playerStateList = new Array(this.player_num).fill(0)
  	},

  	addMenuShareAppMsg : function(){
  		var self = this;
        if(!((cc.sys.os == cc.sys.OS_IOS && cc.sys.isNative) || (cc.sys.os == cc.sys.OS_ANDROID && cc.sys.isNative)) || switches.TEST_OPTION){
            var roominfo_list = [["普通麻将,","东带庄,"],["无摸宝,","摸一宝,","摸二宝,"]];
            var share_title = self.club_id > 0 ? ' 亲友圈号【' + self.club_id.toString() + '】,招募群主,1000红包奖励群主!' : ' 房间号【' + self.roomID.toString() + '】,招募群主,1000红包奖励群主!';
            var share_desc = (roominfo_list[0][self.game_mode]) + (self.maxRound + '局,') + (roominfo_list[1][self.luckyTileNum]) + (self.max_lose === 9999 ? '无封顶' : self.max_lose + '分封顶');
            cutil.share_func(share_title, share_desc);
		}
  	},
});