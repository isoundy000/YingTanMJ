"use strict";

var ClubUI = UIBase.extend({
    ctor:function () {
       this._super();
       this.resourceFilename = "res/ui/ClubUI.json";
    },

    show_by_info:function (club_id) {
        this.club = h1global.player().club_entity_dict[club_id];
        if(!this.club){
            return
        }
        this.show();
    },
   
    initUI:function () {
        this.init_top_panel();
        this.init_bottom_panel();
        this.update_desk_panel(this.club.club_id, this.club.table_info_list);
        this.show_notice(this.club.club_id, this.club.club_notice);
        var bg_img = this.rootUINode.getChildByName("bg_img");
        var bg_img_content_size = bg_img.getContentSize();
        var scale = cc.winSize.width/bg_img_content_size.width;
        if (cc.winSize.height/bg_img_content_size.height > scale){
            scale = cc.winSize.height/bg_img_content_size.height;
        }
        bg_img.setScale(scale);
    },

    init_top_panel:function () {
        var self = this;
        var player = h1global.player();
        var top_panel = this.rootUINode.getChildByName("top_panel");

        var back_btn = top_panel.getChildByName("back_btn");
        function back_btn_event(sender, eventType) {
            if(eventType === ccui.Widget.TOUCH_ENDED){
                self.hide();
            }
        }
        back_btn.addTouchEventListener(back_btn_event);

        var info_dict = eval('(' + cc.sys.localStorage.getItem("INFO_JSON") + ')');
        // head_panel
        var head_panel = top_panel.getChildByName("head_panel");
        head_panel.getChildByName("name_label").setString(info_dict["nickname"]);
        head_panel.getChildByName("user_id_label").setString("ID:" + info_dict["user_id"]);


        var club_name_panel = top_panel.getChildByName("club_name_panel");
        club_name_panel.getChildByName("club_name_label").setString(this.club.club_name);

        var card_panel = top_panel.getChildByName("card_panel");
        card_panel.getChildByName("card_label").setString("— —");

        var id_panel = top_panel.getChildByName("id_panel");
        id_panel.getChildByName("club_id_label").setString("亲友圈ID:" + this.club.club_id);

        // 房卡 仅房主可见
        if(player.userId === this.club.owner.userId){
            cutil.get_user_info("wx_" + info_dict["unionid"], function(content){
                if(content[0] !== '{'){
                    return
                }
                var info = eval('(' + content + ')');
                card_panel.getChildByName("card_label").setString(info["card"].toString());
            });
            card_panel.setVisible(true);
        } else {
            card_panel.setVisible(false);
        }
        // 头像
        var head_img = head_panel.getChildByName("head_img");
        var aim_sprite =  head_panel.getChildByName("portrait_sprite");
        cutil.loadPortraitTexture(info_dict["headimgurl"], info_dict["sex"], function(img){
            if(self && self.is_show){
                var portrait_sprite  = new cc.Sprite(img);
                portrait_sprite.setScale(100/portrait_sprite.getContentSize().width);
                // var stencil = new cc.Sprite("res/ui/ClubUI/club_head_mask.png"); // 遮罩模板 -- 就是你想把图片变成的形状
                // var clipnode = new cc.ClippingNode();
                // clipnode.x = 56;
                // clipnode.y = 55.5;
                // clipnode.setInverted(false);
                // clipnode.setAlphaThreshold(0.5);
                // clipnode.setStencil(stencil);
                // clipnode.addChild(portrait_sprite);
                // head_panel.addChild(clipnode);
                // head_panel.reorderChild(clipnode, -1);
                // clipnode.setPosition(head_img.getPosition());
                aim_sprite.addChild(portrait_sprite);
                portrait_sprite.setPosition(cc.p(aim_sprite.getContentSize().width/2, aim_sprite.getContentSize().height/2));
            }
        });
        var dismiss_apply_btn = top_panel.getChildByName("dismiss_apply_btn");
        dismiss_apply_btn.addTouchEventListener(function (sender, eventType) {
            if(eventType === ccui.Widget.TOUCH_ENDED){
                if(h1global.curUIMgr.dismissapply_ui && !h1global.curUIMgr.dismissapply_ui.is_show && self.club){
                    h1global.curUIMgr.dismissapply_ui.show_by_info(self.club.club_id)
                }

            }
        });

        var demise_btn = top_panel.getChildByName("demise_btn");
        demise_btn.addTouchEventListener(function (sender, eventType) {
            if(eventType === ccui.Widget.TOUCH_ENDED){
                if(h1global.curUIMgr.demise_ui && !h1global.curUIMgr.demise_ui.is_show && self.club){
                    h1global.curUIMgr.demise_ui.show_by_info(self.club.club_id)
                }
            }
        });
        if(player.userId === this.club.owner.userId){
            dismiss_apply_btn.setVisible(true);
            demise_btn.setVisible(true);
        } else {
            dismiss_apply_btn.setVisible(false);
            demise_btn.setVisible(false);
        }
    },

    init_bottom_panel:function () {
        var self = this;
        var player = h1global.player();
        var bottom_panel = this.rootUINode.getChildByName("bottom_panel");

        var exit_btn = bottom_panel.getChildByName("setting_btn");
        exit_btn.addTouchEventListener(function (sender, eventType) {
            if(eventType === ccui.Widget.TOUCH_ENDED){
                // if(h1global.curUIMgr.confirm_ui && !h1global.curUIMgr.confirm_ui.is_show && self.club){
                //     h1global.curUIMgr.confirm_ui.show_by_info("退出亲友圈你将无法游戏,是否确定退出?", function () {
                //         h1global.player().clubOperation(const_val.CLUB_OP_APPLY_OUT, self.club.club_id);
                //     });
                // }
                if(!self.club){
                    return
                }
                if(h1global.curUIMgr.clubconfig_ui && !h1global.curUIMgr.clubconfig_ui.is_show ){
                    h1global.curUIMgr.clubconfig_ui.show_by_info(self.club.club_id)
                }
            }
        });
        var mgr_btn = bottom_panel.getChildByName("mgr_btn");
        mgr_btn.addTouchEventListener(function (sender, eventType) {
            if(eventType === ccui.Widget.TOUCH_ENDED){
                if(h1global.curUIMgr.clubmgr_ui && !h1global.curUIMgr.clubmgr_ui.is_show && self.club){
                    h1global.curUIMgr.clubmgr_ui.show_by_info(self.club.club_id);
                }
            }
        });
        var mem_btn = bottom_panel.getChildByName("mem_btn");
        mem_btn.addTouchEventListener(function (sender, eventType) {
            if(eventType === ccui.Widget.TOUCH_ENDED){
                if(h1global.curUIMgr.clubmember_ui && !h1global.curUIMgr.clubmember_ui.is_show && self.club){
                    h1global.curUIMgr.clubmember_ui.show_by_info(self.club.club_id)
                }
            }
        });
        var record_btn = bottom_panel.getChildByName("record_btn");
        record_btn.addTouchEventListener(function (sender, eventType) {
            if(eventType === ccui.Widget.TOUCH_ENDED){
                if(h1global.curUIMgr.clubrecord_ui && !h1global.curUIMgr.clubrecord_ui.is_show && self.club){
                    h1global.curUIMgr.clubrecord_ui.show_by_info(self.club.club_id)
                }
            }
        });
        var play_btn = bottom_panel.getChildByName("play_btn");
        play_btn.addTouchEventListener(function (sender, eventType) {
            if(eventType === ccui.Widget.TOUCH_ENDED){
                if(h1global.curUIMgr.help_ui && !h1global.curUIMgr.help_ui.is_show && self.club){
                    h1global.curUIMgr.help_ui.show_by_info(self.club.getRoomCreateDict())
                }
            }
        });

        var share_title = "亲友圈(鹰潭麻将),亲友圈ID:" + this.club.club_id.toString() + ",建群奖励1000元红包";
        var data = this.club.getRoomCreateDict();
        var share_desc = cutil.get_club_share_desc(data);
        var share_btn = bottom_panel.getChildByName("share_btn");
        share_btn.addTouchEventListener(function (sender, eventType) {
            if(eventType === ccui.Widget.TOUCH_ENDED){
                if ((cc.sys.os === cc.sys.OS_ANDROID && cc.sys.isNative)) {
                    jsb.reflection.callStaticMethod(switches.package_name + "/AppActivity", "callWechatShareUrl", "(ZLjava/lang/String;Ljava/lang/String;Ljava/lang/String;)V", true, switches.share_android_url, share_title, share_desc);
                } else if ((cc.sys.os === cc.sys.OS_IOS && cc.sys.isNative)) {
                    jsb.reflection.callStaticMethod("WechatOcBridge", "callWechatShareUrlToSession:fromUrl:withTitle:andDescription:", true, switches.share_ios_url, share_title, share_desc);
                } else {
                    cutil.share_func(share_title, share_desc);
                    h1global.curUIMgr.share_ui.show();
                }
            }
        });

        if(player.userId === this.club.owner.userId){
            mgr_btn.setVisible(true);
            exit_btn.setVisible(false);
        }else{
            mgr_btn.setVisible(false);
            exit_btn.setVisible(true);
        }
    },

    update_desk_panel:function (club_id, table_info_list) {
        var self = this;
        if(!this.is_show){return;}
        if(this.club.club_id !== club_id){return;}
        var room_panel = this.rootUINode.getChildByName("room_panel");
        var desk_scroll = room_panel.getChildByName("desk_scroll");
        var tuple_list = []
        for(var i=0; i<table_info_list.length; i++){
            var index = Math.floor(i/4);
            if(!tuple_list[index]){tuple_list[index] = []}
            tuple_list[index].push(table_info_list[i])
        }
        function desk_func(item_panel, data, index) {
            for(let j=0; j<4; j++){
                var desk = item_panel.getChildByName("desk_"+ j.toString());
                // cc.error(j, item_panel, desk)
                if(j+1 > data.length){desk.setVisible(false); return;}

                let table_value = data[j];
                let table_index = index * 4 + j;

                let values = (table_value & 1) + ((table_value & 2) >> 1) + ((table_value & 4) >> 2) + ((table_value & 8) >> 3);

                var detail_btn = desk.getChildByName("detail_btn");
                // cc.error(detail_btn)
                detail_btn.addTouchEventListener(function (sender, eventType) {
                    if(eventType === ccui.Widget.TOUCH_ENDED){
                        if(values<=0){
                            h1global.globalUIMgr.info_ui.show_by_info("房间暂时还没有人坐下", cc.size(300, 200));
                            return;
                        }
                        h1global.player().clubOperation(const_val.CLUB_OP_GET_TABLE_DETAIL, self.club.club_id, [table_index])
                    }
                });

                var desk_img = desk.getChildByName("desk_panel").getChildByName("desk_img");
                desk_img.addTouchEventListener(function (sender, eventType) {
                    if(eventType === ccui.Widget.TOUCH_ENDED){
                        if(values>=self.club.room_type["player_num"]){
                            h1global.globalUIMgr.info_ui.show_by_info("游戏房间人数已满", cc.size(300, 200));
                            return;
                        }
                        cutil.lock_ui();
                        h1global.player().clubOperation(const_val.CLUB_OP_SIT_DOWN, self.club.club_id, [table_index])
                    }
                });
                detail_btn.getChildByName("desk_label").setString("NO." + String(table_index + 1) + " 查看详情");

                desk_img.loadTexture("ClubUI/club_desk_" + values + ".png", ccui.Widget.PLIST_TEXTURE)
                desk.setVisible(true)
            }
        }
        UICommonWidget.update_scroll_items(desk_scroll, tuple_list, desk_func)
    },

    update_club_name:function (club_id) {
        if(!this.is_show || this.club.club_id !== club_id){
            return;
        }
        var top_panel = this.rootUINode.getChildByName("top_panel");
        var club_name_panel = top_panel.getChildByName("club_name_panel");
        club_name_panel.getChildByName("club_name_label").setString(this.club.club_name);
    },

    show_notice:function (club_id, content) {
        var broadcast_panel = this.rootUINode.getChildByName("broadcast_panel");
        if(!this.is_show || this.club.club_id != club_id){
            return;
        }
        if(content.length <= 0){
            broadcast_panel.setVisible(false);
            return;
        }
        broadcast_panel.setVisible(true);
        var label_panel = broadcast_panel.getChildByName("label_panel");
        var broadcast_label = label_panel.getChildByName("broadcast_label");

        broadcast_label.ignoreContentAdaptWithSize(true);
        broadcast_label.setString(content);

        broadcast_label.stopAllActions();
        var fly_time = Math.max(broadcast_label.getContentSize().width/50, 9);
        broadcast_label.runAction(cc.RepeatForever.create(cc.Sequence.create(
            cc.CallFunc.create(function () {
                broadcast_label.setPositionX(label_panel.getContentSize().width);
            }),
            cc.MoveTo.create(fly_time,cc.p(-broadcast_label.getContentSize().width, broadcast_label.getPositionY())),
            cc.DelayTime.create(2.0)
        )))
    },
});