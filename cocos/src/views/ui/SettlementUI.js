"use strict"
var SettlementUI = UIBase.extend({
	ctor:function() {
		this._super();
		this.resourceFilename = "res/ui/SettlementUI.json";
		this.setLocalZOrder(const_val.SettlementZOrder)
	},
	initUI:function(){
		var self = this;
		var confirm_btn = this.rootUINode.getChildByName("confirm_btn");
		var result_btn = this.rootUINode.getChildByName("result_btn");
		var share_btn = this.rootUINode.getChildByName("share_btn");
		var close_btn = this.rootUINode.getChildByName("close_btn");

		var player = h1global.player();
		function confirm_btn_event(sender, eventType){
			if(eventType == ccui.Widget.TOUCH_ENDED){
				// TEST:
				// self.hide();
				// h1global.curUIMgr.gameroomprepare_ui.show();
				// h1global.curUIMgr.notifyObserver("hide");
				// return;
				self.hide();

				//重新开局
                var player = h1global.player();
                if (player) {
                    player.curGameRoom.updatePlayerState(player.serverSitNum, 1);
                    h1global.curUIMgr.gameroomprepare_ui.show();
                    h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "hide");
                    player.prepare();
                } else {
                    cc.warn('player undefined');
                }
			}
		}
		confirm_btn.addTouchEventListener(confirm_btn_event);

        //单局结算分享
        share_btn.addTouchEventListener(function(sender, eventType){
            if(eventType == ccui.Widget.TOUCH_ENDED){
                if((cc.sys.os == cc.sys.OS_ANDROID && cc.sys.isNative)){
                    jsb.fileUtils.captureScreen("", "screenShot.png");
                } else if((cc.sys.os == cc.sys.OS_IOS && cc.sys.isNative)){
                    jsb.reflection.callStaticMethod("WechatOcBridge","takeScreenShot");
                } else {
                    h1global.curUIMgr.share_ui.show();
                }
            }
        });

        close_btn.addTouchEventListener(function (sender, eventType) {
			if(eventType === ccui.Widget.TOUCH_ENDED){
				self.hide()
			}
        });



        if(player.curGameRoom.curRound === player.curGameRoom.maxRound) {
            confirm_btn.setVisible(false);
            result_btn.setVisible(true);
            close_btn.setVisible(false)
        }else {
            confirm_btn.setVisible(true);
            result_btn.setVisible(false);
            close_btn.setVisible(false)
        }

        if ((cc.sys.os == cc.sys.OS_IOS && cc.sys.isNative) && switches.appstore_check == true) {
            share_btn.setVisible(false);
        }

        if(this.is_history){
            close_btn.setVisible(true);
            confirm_btn.setVisible(false);
            result_btn.setVisible(false);
            share_btn.setVisible(false);
		}
	},

	setPlaybackLayout:function (replay_btn_func) {
        let replay_btn = ccui.helper.seekWidgetByName(this.rootUINode, "replay_btn");
        let self = this;
        replay_btn.addTouchEventListener(function (sender,eventType) {
            if(eventType === ccui.Widget.TOUCH_ENDED){
                if (replay_btn_func) replay_btn_func();
                if(self.is_show){
	                self.hide();
				}
            }
        });
        replay_btn.setVisible(true);
        let back_hall_btn = ccui.helper.seekWidgetByName(this.rootUINode, "back_hall_btn");
        back_hall_btn.addTouchEventListener(function (sender,eventType) {
			if(eventType === ccui.Widget.TOUCH_ENDED){
				h1global.runScene(new GameHallScene());
			}
        });
        back_hall_btn.setVisible(true);

        ccui.helper.seekWidgetByName(this.rootUINode, "share_btn").setVisible(false);
        ccui.helper.seekWidgetByName(this.rootUINode, "confirm_btn").setVisible(false);
    },

    show_by_info: function (roundRoomInfo, serverSitNum, confirm_btn_func, replay_btn_func, is_history) {
		cc.log("结算==========>:");
		cc.log("roundRoomInfo :  ",roundRoomInfo);
		var self = this;
		this.is_history = is_history;
		this.show(function(){
			self.player_tiles_panels = [];
			self.player_tiles_panels.push(self.rootUINode.getChildByName("settlement_panel").getChildByName("victory_item_panel1"));
			self.player_tiles_panels.push(self.rootUINode.getChildByName("settlement_panel").getChildByName("victory_item_panel2"));
			self.player_tiles_panels.push(self.rootUINode.getChildByName("settlement_panel").getChildByName("victory_item_panel3"));
			self.player_tiles_panels.push(self.rootUINode.getChildByName("settlement_panel").getChildByName("victory_item_panel4"));	
			var player_round_list = roundRoomInfo["player_round_list"];
			for(var i = 0; i < 4; i++){
				var roundPlayerInfo = player_round_list[i];
				if (!roundPlayerInfo) {
					self.player_tiles_panels[i].setVisible(false)
					continue
				}
				self.player_tiles_panels[i].setVisible(true)
				self.update_score(roundPlayerInfo["idx"], roundPlayerInfo["score"]);  //显示分数
                self.update_player_hand_tiles(i, roundRoomInfo["player_round_list"][i], roundRoomInfo["win_idx"], roundRoomInfo["finalTile"]);   //显示麻将
                self.update_player_up_tiles(i, roundRoomInfo["player_round_list"][i]);
                self.update_player_info(roundPlayerInfo["idx"], roundRoomInfo["player_info_list"][i]);  //idx 表示玩家的座位号
                self.update_player_win(i, roundRoomInfo["win_idx"], roundRoomInfo["from_idx"], roundRoomInfo["dealer_idx"], roundRoomInfo["result_list"], roundRoomInfo["player_round_list"][i]);
                self.update_lucky_tiles(i, roundRoomInfo["lucky_tiles"]);
			}

			// self.update_win_type(roundRoomInfo, roundRoomInfo["result_list"]);
            self.show_title(roundRoomInfo["win_idx"], serverSitNum);
			
			if(confirm_btn_func){
				self.rootUINode.getChildByName("result_btn").addTouchEventListener(function(sender, eventType){
					if(eventType ==ccui.Widget.TOUCH_ENDED){
						self.hide();
						confirm_btn_func();
					}
				});
			}

            if (replay_btn_func) self.setPlaybackLayout(replay_btn_func)
		});
	},

    show_title: function (win_idx, serverSitNum) {
		cc.log("win_idx ",win_idx);
        var bg_img = this.rootUINode.getChildByName("settlement_panel").getChildByName("bg_img");
        var title_img = this.rootUINode.getChildByName("settlement_panel").getChildByName("title_img");
        title_img.ignoreContentAdaptWithSize(true);
        if(win_idx == -1){
            bg_img.loadTexture("res/ui/BackGround/settlement_fail.png");
        	title_img.loadTexture("res/ui/SettlementUI/dogfull_title.png");
        }else if (serverSitNum == win_idx) {
            //胜利
            bg_img.loadTexture("res/ui/BackGround/settlement_win.png");
            title_img.loadTexture("res/ui/SettlementUI/win_title.png");
        } else {
            bg_img.loadTexture("res/ui/BackGround/settlement_fail.png");
            title_img.loadTexture("res/ui/SettlementUI/fail_title.png");
        }
	},

	update_player_hand_tiles:function(serverSitNum, round_info, win_idx, finalTile){
		if(!this.is_show) {return;}
		var cur_player_tile_panel = this.player_tiles_panels[serverSitNum].getChildByName("item_hand_panel");
		if(!cur_player_tile_panel){
			return;
		}
		// tileList = tileList.concat([])
		var tileList = round_info["tiles"];
		if(win_idx == serverSitNum) {
            tileList.pop();
            tileList = tileList.sort(cutil.tileSortFunc);
            tileList.push(finalTile);
        }else {
            tileList = tileList.sort(cutil.tileSortFunc);
		}
		var concealedKongSum = 0;
		for(var i = 0 ; i < round_info["upTiles"].length ; i++){
			if(round_info["upTiles"][i].length > 3){
                concealedKongSum ++;
			}
		}
		var mahjong_hand_str = "mahjong_tile_player_hand.png";
        cur_player_tile_panel.setPositionX((round_info["upTiles"].length * 135) + concealedKongSum * 42 + 236);
		// mahjong_hand_str = "mahjong_tile_player_hand.png";
		for(var i = 0; i < 14; i++){
			var tile_img = ccui.helper.seekWidgetByName(cur_player_tile_panel, "mahjong_bg_img" + i.toString());
			tile_img.stopAllActions();
			if(tileList[i]){
				var mahjong_img = tile_img.getChildByName("mahjong_img");
				tile_img.loadTexture("Mahjong/" + mahjong_hand_str, ccui.Widget.PLIST_TEXTURE);
				tile_img.setVisible(true);
				mahjong_img.ignoreContentAdaptWithSize(true);
				mahjong_img.loadTexture("Mahjong/mahjong_big_" + tileList[i].toString() + ".png", ccui.Widget.PLIST_TEXTURE);
				mahjong_img.setVisible(true);
                if(win_idx == serverSitNum && i == tileList.length - 1){
                    tile_img.setPositionX(tile_img.getPositionX() + 4);
                    tile_img.color = const_val.mark_key_color;
                }
			} else {
				tile_img.setVisible(false);
			}
		}
	},

    update_player_up_tiles: function (serverSitNum, round_info) {
		if(!this.is_show) {return;}
        var cur_player_tile_panel = this.player_tiles_panels[serverSitNum].getChildByName("item_up_panel");
		if(!cur_player_tile_panel){
			return;
		}
		var mahjong_hand_str = "mahjong_tile_player_hand.png";
		var mahjong_down_str = "mahjong_tile_top_hand.png";
        var upTilesList = round_info["upTiles"];
		var idx = 0;
		// for(var i = player.curGameRoom.upTilesList[serverSitNum].length * 3; i < 12; i++){
		// 	var tile_img = ccui.helper.seekWidgetByName(cur_player_tile_panel, "mahjong_bg_img" + i.toString());
		// 	tile_img.setVisible(false);
		// }

		// mahjong_hand_str = "mahjong_tile_player_hand.png";
		// mahjong_down_str = "mahjong_tile_player_down.png";
		for(var i = 0; i < 16; i++){
            var tile_img = ccui.helper.seekWidgetByName(cur_player_tile_panel, "mahjong_bg_img" + i.toString());
            tile_img.setVisible(false);
		}
		for(var i = 0; i < upTilesList.length; i++){
            idx += i == 0 ? i : upTilesList[i - 1].length;
			for(var j = 0; j < upTilesList[i].length; j++){
				var tile_img = ccui.helper.seekWidgetByName(cur_player_tile_panel, "mahjong_bg_img" + (idx + j).toString());
                tile_img.setPositionX(tile_img.getPositionX() + i * 4);
				// tile_img.setPositionY(0);
				tile_img.setTouchEnabled(false);
				var mahjong_img = tile_img.getChildByName("mahjong_img");
				if(upTilesList[i][j]){
					tile_img.loadTexture("Mahjong/" + mahjong_hand_str, ccui.Widget.PLIST_TEXTURE);
					mahjong_img.ignoreContentAdaptWithSize(true);
					mahjong_img.loadTexture("Mahjong/mahjong_big_" + upTilesList[i][j].toString() + ".png", ccui.Widget.PLIST_TEXTURE);
					mahjong_img.setVisible(true);
				} else {
					tile_img.loadTexture("Mahjong/" + mahjong_down_str, ccui.Widget.PLIST_TEXTURE);
					mahjong_img.setVisible(false);
				}
				tile_img.setVisible(true);
			}
		}
	},

    update_player_info: function (serverSitNum, playerInfo) {
		if(!this.is_show) {return;}
		var cur_player_info_panel = this.player_tiles_panels[serverSitNum];
		if(!cur_player_info_panel){
			return;
		}
		cur_player_info_panel.getChildByName("item_name_label").setString(playerInfo["nickname"]);
		cur_player_info_panel.getChildByName("item_id_label").setString("ID:" + playerInfo["userId"].toString());
		cutil.loadPortraitTexture(playerInfo["head_icon"], playerInfo["sex"], function(img){
			if (cur_player_info_panel.getChildByName("item_avatar_img")) {
				cur_player_info_panel.getChildByName("item_avatar_img").removeFromParent();
			}
			var portrait_sprite  = new cc.Sprite(img);
			portrait_sprite.setName("portrait_sprite");
			portrait_sprite.setScale(78 / portrait_sprite.getContentSize().width);
            portrait_sprite.x = 70;
            portrait_sprite.y = 45;
			cur_player_info_panel.addChild(portrait_sprite);
			portrait_sprite.setLocalZOrder(-1);
		});
	},

	update_player_win:function(serverSitNum, win_idx, from_idx, dealer_idx, result, round_info){
		var cur_player_info_panel = this.player_tiles_panels[serverSitNum];
		var item_win_img = cur_player_info_panel.getChildByName("item_win_img");
		if(win_idx < 0 || win_idx > 3){
            item_win_img.setVisible(false);
			return;
		}
        var item_win_type_label = cur_player_info_panel.getChildByName("item_win_type_label");
        item_win_type_label.string = "";
        item_win_type_label.setVisible(true);
        var upTilesList = round_info["upTiles"];
        for(var i = 0; i < upTilesList.length; i++){
            if(upTilesList[i].length > 3){
                item_win_type_label.string += "杠   ";
                break;
            }
        }
        if(serverSitNum == win_idx) {
            for (var i = 0; i < result.length; i++) {
                if (result[i]) {
                    item_win_type_label.string += const_val.WIN_TYPE_LIST[i] + "   ";
                }
            }
        }

        var item_dealer_img = cur_player_info_panel.getChildByName("item_dealer_img");
        item_dealer_img.setVisible(dealer_idx == serverSitNum);
        if (win_idx == from_idx && win_idx == serverSitNum) { // 自摸
            item_win_img.loadTexture("res/ui/SettlementUI/draw_win.png");
            item_win_img.runAction(cc.RepeatForever.create(cc.Sequence.create(
            	cc.Repeat.create(cc.Sequence.create(cc.RotateTo.create(0.08,16,0),cc.RotateTo.create(0.08,0,0)), 4),
				cc.DelayTime.create(2)
            )));
            item_win_img.setVisible(true);
        }else if (win_idx == serverSitNum) { // 胡牌玩家
            item_win_img.loadTexture("res/ui/SettlementUI/give_win.png");
            item_win_img.runAction(cc.RepeatForever.create(cc.Sequence.create(
                cc.Repeat.create(cc.Sequence.create(cc.RotateTo.create(0.08,16,0),cc.RotateTo.create(0.08,0,0)), 4),
                cc.DelayTime.create(2)
            )));

            item_win_img.setVisible(true);
		}else if (from_idx == serverSitNum) { // 放炮玩家
            item_win_img.loadTexture("res/ui/SettlementUI/give_lose.png");
            item_win_img.setVisible(true);
		}else {
            item_win_img.setVisible(false);
		}
	},

	update_score:function(serverSitNum, score){
		var score_label = this.player_tiles_panels[serverSitNum].getChildByName("item_score_label");
		if(score >= 0){
			score_label.setTextColor(cc.color(235, 235, 13));
			score_label.setString("+" + score.toString());
		} else {
			score_label.setTextColor(cc.color(225, 225, 214));
			score_label.setString(score.toString());
		}
	},

    update_lucky_tiles:function(serverSitNum, lucky_tiles){
        var item_mobao_panel = this.player_tiles_panels[serverSitNum].getChildByName("item_mobao_panel");
        if(lucky_tiles <= 0){
            item_mobao_panel.setVisible(false);
            return;
		}
        for(var i = 0 ; i < 2 ; i++){
        	var mahjong_bg_img = item_mobao_panel.getChildByName("mahjong_bg_img" + i.toString());
        	var mahjong_img = mahjong_bg_img.getChildByName("mahjong_img");
            if(lucky_tiles[i]) {
                mahjong_img.ignoreContentAdaptWithSize(true);
            	mahjong_img.loadTexture("Mahjong/mahjong_big_" + lucky_tiles[i].toString() + ".png", ccui.Widget.PLIST_TEXTURE)
            }else{
                mahjong_bg_img.setVisible(false);
            }
		}
	},
});