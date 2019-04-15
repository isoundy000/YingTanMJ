var HelpUI = UIBase.extend({
    ctor: function () {
        this._super();
        this.resourceFilename = "res/ui/HelpUI.json";
        this.setLocalZOrder(const_val.MAX_LAYER_NUM);
    },

    show_by_info:function (info_dict) {
        this.info_dict = info_dict;
        this.show();
    },

    initUI: function () {
        var self = this;
        var player = h1global.player();
        var help_panel = this.rootUINode.getChildByName("help_panel");

        var close_btn = help_panel.getChildByName("close_btn");

        var room_mode_btn = help_panel.getChildByName("room_mode_btn");
        var gxmj_btn = help_panel.getChildByName("gxmj_btn");
        room_mode_btn.setTouchEnabled(false);
        room_mode_btn.setBright(false);
        gxmj_btn.setTouchEnabled(true);
        gxmj_btn.setBright(true);

        var room_mode_panel = help_panel.getChildByName("room_mode_panel");
        var gamename_panel = help_panel.getChildByName("gamename_panel");
        room_mode_panel.setVisible(true);
        gamename_panel.setVisible(false);

        if(this.info_dict) {
            this.change_select("rule_chx_" + this.info_dict["game_mode"].toString());
            this.change_select("player_num_chx_" + (this.info_dict["player_num"] !== undefined ? 4-this.info_dict["player_num"] : 0).toString());
            this.change_select("round_chx_" + ((this.info_dict["maxRound"] !== undefined ? this.info_dict["maxRound"] : this.info_dict["game_round"]) / 8 - 1).toString());
            this.change_select("limit_chx_" + ((this.info_dict["max_lose"] / 10) > 3 ? 0 : (this.info_dict["max_lose"] / 10)).toString());

            this.change_select("mobao_chx_" + (this.info_dict["luckyTileNum"] !== undefined ? this.info_dict["luckyTileNum"] : this.info_dict["lucky_num"]).toString());
            // this.change_select("time_chx_" + (Math.ceil(this.info_dict["discard_seconds"] / 10)).toString());
            this.change_select("pay_chx_" + (this.info_dict["pay_mode"]  > 1 ?  0 : this.info_dict["pay_mode"]).toString());
            this.update_pay_label(this.info_dict["pay_mode"] )
        }else {
            this.gamehall_show();
        }

        close_btn.addTouchEventListener(function (sender, eventType) {
            if (eventType === ccui.Widget.TOUCH_ENDED) {
                self.hide();
            }
        });

        room_mode_btn.addTouchEventListener(function (sender, eventType) {
            if (eventType === ccui.Widget.TOUCH_ENDED) {
                room_mode_btn.setTouchEnabled(false);
                room_mode_btn.setBright(false);
                gxmj_btn.setTouchEnabled(true);
                gxmj_btn.setBright(true);
                gamename_panel.setVisible(false);
                room_mode_panel.setVisible(true);
            }
        });

        gxmj_btn.addTouchEventListener(function (sender, eventType) {
            if (eventType === ccui.Widget.TOUCH_ENDED) {
                gxmj_btn.setTouchEnabled(false);
                gxmj_btn.setBright(false);
                room_mode_btn.setTouchEnabled(true);
                room_mode_btn.setBright(true);
                room_mode_panel.setVisible(false);
                gamename_panel.setVisible(true);
            }
        });
    },

    change_select:function (chxName) {
        cc.log(chxName)
        var chx = this.rootUINode.getChildByName("help_panel").getChildByName("room_mode_panel").getChildByName(chxName);
        chx.setBright(true);
    },

    update_pay_label:function (pay_mode) {
        var help_panel = this.rootUINode.getChildByName("help_panel");
        var room_mode_panel = help_panel.getChildByName("room_mode_panel");

        var player = h1global.player();
        var val = "房主支付";
        if(pay_mode   == const_val.AGENT_PAY_MODE){
            val = "代理支付";
        } else if(pay_mode   == const_val.CLUB_PAY_MODE){
            val = "老板支付";
        }
        room_mode_panel.getChildByName("pay_label_0").setString(val)
    },

    gamehall_show:function () {
        var help_panel = this.rootUINode.getChildByName("help_panel");
        var room_mode_btn = help_panel.getChildByName("room_mode_btn");
        var gxmj_btn = help_panel.getChildByName("gxmj_btn");
        var line_img = help_panel.getChildByName("line_img");
        room_mode_btn.setVisible(false);
        line_img.setVisible(false);
        gxmj_btn.setTouchEnabled(false);
        gxmj_btn.setBright(false);
        gxmj_btn.setPositionY(gxmj_btn.getPositionY() + 100);

        var room_mode_panel = help_panel.getChildByName("room_mode_panel");
        var gamename_panel = help_panel.getChildByName("gamename_panel");
        room_mode_panel.setVisible(false);
        gamename_panel.setVisible(true);
    },
});