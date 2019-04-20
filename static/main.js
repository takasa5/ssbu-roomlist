var roomListTemp = "\n\
<div class=\"room-list\" v-bind:class=\"{ full : room.member == room.capacity }\">\n\
    <div class=\"icon\">\n\
        <img :src=\"room.icon\">\n\
    </div>\n\
    <div class=\"power\">{{ room.power }}<span v-if=\"room.power != ''\">万</span></div>\n\
    <div class=\"id\">\n\
        <span v-show=\"!room.id_edit\">{{ room.id }}</span>\n\
        <input autofocus v-model=\"room.new_id\" v-show=\"room.id_edit\" type=\"text\" name=\"id_edit\" size=\"5\" maxlength=\"5\" pattern=\"[A-Za-z0-9]{5}\">\n\
        <i v-show=\"!room.id_edit\" @click=\"room.id_edit = true;\" class=\"fas fa-edit\"></i>\n\
        <i v-show=\"room.id_edit\" @click=\"changeID\" class=\"fas fa-undo\"></i>\n\
    </div>\n\
    <div class=\"pass\">{{ room.pass }}</div>\n\
    <div class=\"style\">\n\
        <span v-if=\"checkDevice() == 'pc'\">{{ room.style }}</span>\n\
            <span v-else>\n\
            <span v-if=\"room.style.length > 4\">{{ room.style[0] + room.style[1] + room.style[2] }}</span>\n\
            <span v-else>{{ room.style }}</span>\n\
        </span>\n\
    </div>\n\
    <div class=\"rule\">\n\
        <i v-if=\"room.rule == 'ストック制'\" class=\"fas fa-user\"></i>\n\
        <i v-if=\"room.rule == 'タイム制'\" class=\"far fa-clock\"></i>\n\
        <i v-if=\"room.rule == '体力制'\" class=\"fas fa-heart\"></i>\n\
        <span v-show=\"checkDevice() == 'pc'\">{{ room.rule }}</span>\n\
        <span v-if=\"room.rule == 'ストック制'\">({{ room.stock }})</span>\n\
    </div>\n\
    <div class=\"time\">{{ room.time }}</div>\n\
    <div class=\"ic\">{{ room.ic }}</div>\n\
    <div class=\"overview\">\n\
    <i v-show=\"!room.url_edit\" @click=\"room.url_edit = true;\" v-if=\"room.cast == 'true'\" class=\"fas fa-video fa-fw cast-allow\"></i>\n\
    <i v-show=\"room.cast_url == ''\" v-if=\"room.cast == 'false'\" class=\"fas fa-video-slash fa-fw cast-allow\"></i>\n\
    <input autofocus v-show=\"room.url_edit\" v-model=\"room.new_url\" type=\"url\">\n\
    <i v-show=\"room.url_edit\" @click=\"changeURL\" class=\"fas fa-undo\"></i>\n\
    <a v-if=\"room.cast_url != ''\" v-bind:href = \"room.cast_url\" target=\"_blank\" rel=\"noopener noreferrer\"><i class=\"fas fa-video fa-fw cast-allow\" style=\"text-decoration: underline\"></i></a>\n\
    <div class=\"content\">{{ room.overview }}</div>\n\
    </div>\n\
    <div class=\"stage\">\n\
        <span v-if=\"checkDevice() == 'pc'\">{{ room.stage }}</span>\n\
        <span v-else>\n\
            {{ room.stage[0] }}\n\
        </span>\n\
    </div>\n\
    <div class=\"space\">{{ room.member }}<button type=\"button\" @click=\"addMember\">+</button><button type=\"button\" @click=\"subMember\">-</button><br>/{{ room.capacity }}</div>\n\
    <div class=\"change\">\n\
        <span v-if=\"room.change != ''\">\n\
            <span v-if=\"checkDevice() == 'pc'\">{{ room.change }}</span>\n\
            <span v-else>\n\
                {{ room.change[0] + room.change[4] }}\n\
            </span>\n\
        </span>\n\
    </div>\n\
    <div class=\"start\">{{ room.start }}</div>\n\
    <div class=\"b\">～</div>\n\
    <div class=\"deadline\">{{ room.deadline }}</div>\n\
</div>\n\
";

var c = Vue.component('room-list', {
    props: ['room'],
    template: roomListTemp,
    methods: {
        checkDevice: function () {
            return checkDevice();
        },
        addMember: function () {
            if (this.room.member >= this.room.capacity)
                return;
            else
                socket.emit("update", sample.editpass, client_uuid, this.room.room_uuid, { "member": this.room.member + 1 });
        },
        subMember: function () {
            if (this.room.member == 1) {
                socket.emit("delete", sample.editpass, client_uuid, this.room.room_uuid);
                sample.roomFlag = false;
            } else
                socket.emit("update", sample.editpass, client_uuid, this.room.room_uuid, { "member": this.room.member - 1 });
        },
        changeID: function () {
            if (this.room.new_id != "" && this.room.new_id.length == 5)
                socket.emit("update", sample.editpass, client_uuid, this.room.room_uuid, { "id": this.room.new_id });
            this.room.id_edit = false;
        },
        changeURL: function () {
            socket.emit("update_cast", client_uuid, this.room.room_uuid, "cast_url", this.room.new_url);
            this.room.url_edit = false;
        }
    }
})

var images = [];
for (var i = 0; i < 106; i++) {
    images.push("/static/img/" + i + ".jpg?0421");
}

var sample = new Vue({
    el: "#display",
    data: {
        icon: "",
        power: "",
        id: "",
        pass: "",
        style: "",
        stock: "",
        rule: "",
        time: "",
        ic: "",
        stage: "",
        overview: "",
        change: "",
        member: "",
        capacity: "",
        editpass: "",
        images: images,
        change: "",
        start: "",
        deadline: "",
        room_uuid: "",
        id_edit: false,
        new_id: "",
        temp_string: "",
        success: false,
        roomFlag: false,
        cast: null,
        cast_url: "",
        url_edit: false,
        new_url: false
    },
    mounted() {
        if (sessionStorage["editpass"]) {
            this.editpass = sessionStorage["editpass"];
        }
    },
    methods: {
        checkDevice: function () {
            return checkDevice();
        },
        makeTempString: function () {
            this.temp_string = "";
            this.temp_string += "【部屋ID】" + this.id + "\n";
            this.temp_string += "【パス】" + this.pass + "\n";
            this.temp_string += "【乱闘形式】" + this.style + "\n";
            this.temp_string += "【ルール】" + this.rule;
            if (this.rule == "ストック制")
                this.temp_string += " " + this.stock + "ストック\n";
            else
                this.temp_string += "\n";
            this.temp_string += "【制限時間】" + this.time + "\n";
            this.temp_string += "【ステージ】";
            if (this.stage == "ランダム")
                this.temp_string += "ギミックなしランダム\n";
            else if (this.stage == "ギミック")
                this.temp_string += "ギミックありランダム\n";
            else
                this.temp_string += this.stage + "\n";
            this.temp_string += "【アイテム】" + this.ic[0] + "\n";
            this.temp_string += "【チャージ切り札】" + this.ic[2] + "\n";
            this.temp_string += "【入れ換え】" + this.change + "\n";
            this.temp_string += this.overview;
        },
        submit: function (event) {
            if (!room_uuid) {
                socket.emit("create", client_uuid, {
                    icon: this.icon,
                    power: this.power,
                    id: this.id,
                    pass: this.pass,
                    style: this.style,
                    stock: this.stock,
                    rule: this.rule,
                    time: this.time,
                    ic: this.ic,
                    stage: this.stage,
                    overview: this.overview,
                    change: this.change,
                    member: 1,
                    capacity: this.capacity,
                    deadline: this.deadline,
                    editpass: this.editpass,
                    id_edit: false,
                    new_id: "",
                    cast: this.cast,
                    cast_url: this.cast_url,
                    url_edit: this.url_edit,
                    new_url: ""
                });
                sessionStorage["editpass"] = this.editpass;
                this.roomFlag = true;
            } else {
                socket.emit("update", this.editpass, client_uuid, room_uuid, {
                    icon: this.icon,
                    power: this.power,
                    id: this.id,
                    pass: this.pass,
                    style: this.style,
                    stock: this.stock,
                    rule: this.rule,
                    time: this.time,
                    ic: this.ic,
                    stage: this.stage,
                    overview: this.overview,
                    change: this.change,
                    capacity: this.capacity,
                    deadline: this.deadline,
                    cast: this.cast,
                    cast_url: this.cast_url
                });
            }
        },
        inputOnes: function () {
            this.style = "1on1";
            this.rule = "ストック制";
            this.stock = "2";
            this.time = "5分";
            this.stage = "終点化";
            this.ic = "無/無";
            this.change = "負け抜け1人";
            this.capacity = 4;
        },
        inputFours: function () {
            this.style = "乱闘";
            this.rule = "タイム制";
            this.time = "3分";
            this.stage = "ギミック";
            this.ic = "有/有";
            this.change = "負け抜け2人";
            this.capacity = 6;
        },
        changeURL: function () { },
    },
    template: "\n\
    <form id=\"inputArea\" action=\"\" method=\"get\" v-on:submit.prevent=\"submit\">\n\
    <div style=\"text-align:center\">\n\
        <button type=\"button\" @click=\"inputOnes\">1on1入力</button>\n\
        <button type=\"button\" @click=\"inputFours\">乱闘入力</button>\n\
    </div>\n\
    <table class=\"ftbl\" id=\"ftbl\" style=\"position: static; left: 50%; margin-left: auto; margin-right: auto; top: 16711px; visibility: visible;\">\n\
    <tbody>\n\
        <tr>\n\
            <td class=\"ftdc\">\n\
                <b>*部屋ID</b>\n\
            </td>\n\
            <td>\n\
                <input v-model=\"id\" type=\"text\" name=\"id\" size=\"5\" maxlength=\"5\" pattern=\"[A-Za-z0-9]{5}\" required> 英数字5文字\n\
            </td>\n\
        </tr>\n\
        <tr>\n\
            <td class=\"ftdc\">\n\
                <b>パス</b>\n\
            </td>\n\
            <td>\n\
                <input id=\"pass\" v-model=\"pass\" type=\"number\" name=\"pass\" size=\"8\" oninput=\"sliceMaxLength(this, 8)\">\n\
            </td>\n\
        </tr>\n\
        <tr>\n\
            <td class=\"ftdc\">\n\
                <b>参考戦闘力(万)</b>\n\
            </td>\n\
            <td>\n\
                <input v-model=\"power\" type=\"number\" name=\"power\" size=\"3\" min=\"1\" max=\"999\">\n\
            </td>\n\
        </tr>\n\
        <tr>\n\
            <td class=\"ftdc\">\n\
                <b>*乱闘形式</b>\n\
            </td>\n\
            <td>\n\
                <label><input v-model=\"style\" name=\"style\" type=\"radio\" value=\"1on1\" required>1on1</label>\n\
                <label><input v-model=\"style\" name=\"style\" type=\"radio\" value=\"乱闘\">乱闘</label>\n\
                <label><input v-model=\"style\" name=\"style\" type=\"radio\" value=\"チーム乱闘\">チーム乱闘</label>\n\
            </td>\n\
        </tr>\n\
        <tr>\n\
            <td class=\"ftdc\">\n\
                <b>*ルール</b>\n\
            </td>\n\
            <td>\n\
                <label><input v-model=\"rule\" type=\"radio\" name=\"rule\" value=\"ストック制\" required>ストック制</label>\n\
                <label><input v-model=\"rule\" type=\"radio\" name=\"rule\" value=\"タイム制\">タイム制</label>\n\
                <label><input v-model=\"rule\" type=\"radio\" name=\"rule\" value=\"体力制\">体力制</label>\n\
            </td>\n\
        </tr>\n\
        <tr v-if=\"rule == 'ストック制'\">\n\
            <td class=\"ftdc\">\n\
                <b>*ストック</b>\n\
            </td>\n\
            <td>\n\
                <input v-model=\"stock\" type=\"number\" name=\"stock\" min=\"1\" max=\"7\" required>\n\
            </td>\n\
        </tr>\n\
        <tr>\n\
            <td class=\"ftdc\">\n\
                <b>*制限時間</b>\n\
            </td>\n\
            <td>\n\
                <select v-model=\"time\" name=\"time\" required>\n\
                    <option disabled value=\"\">制限時間を選択</option>\n\
                    <option value=\"1分\">1分</option>\n\
                    <option value=\"1.5分\">1.5分</option>\n\
                    <option value=\"2分\">2分</option>\n\
                    <option value=\"2.5分\">2.5分</option>\n\
                    <option value=\"3分\">3分</option>\n\
                    <option value=\"4分\">4分</option>\n\
                    <option value=\"5分\">5分</option>\n\
                    <option value=\"6分\">6分</option>\n\
                    <option value=\"7分\">7分</option>\n\
                    <option value=\"8分\">8分</option>\n\
                    <option value=\"9分\">9分</option>\n\
                    <option value=\"10分\">10分</option>\n\
                </select>\n\
            </td>\n\
        </tr>\n\
        <tr>\n\
            <td class=\"ftdc\">\n\
                <b>*ステージ</b>\n\
            </td>\n\
            <td>\n\
                <select v-model=\"stage\" name=\"stage\" required>\n\
                    <option disabled value=\"\">ステージを選択</option>\n\
                    <option value=\"選ぶ\">あらかじめ選ぶ</option>\n\
                    <option value=\"終点化\">終点化</option>\n\
                    <option value=\"戦場化\">戦場化</option>\n\
                    <option value=\"ランダム\">ギミックなしランダム</option>\n\
                    <option value=\"ギミック\">ギミックありランダム</option>\n\
                </select>\n\
            </td>\n\
        </tr>\n\
        <tr>\n\
            <td class=\"ftdc\">\n\
                <b>*アイテム/</b><br>\n\
                <b>チャージ切り札</b>\n\
            </td>\n\
            <td>\n\
                <select v-model=\"ic\" name=\"ic\" required>\n\
                    <option disabled value=\"\">有無を選択</option>\n\
                    <option value=\"無/無\">無/無</option>\n\
                    <option value=\"有/無\">有/無</option>\n\
                    <option value=\"無/有\">無/有</option>\n\
                    <option value=\"有/有\">有/有</option>\n\
                </select>\n\
            </td>\n\
        </tr>\n\
        <tr>\n\
            <td class=\"ftdc\">\n\
                <b>*入れ替え</b>\n\
            </td>\n\
            <td>\n\
                <select v-model=\"change\" name=\"change\" required>\n\
                    <option disabled value=\"\">入れ替えルールを選択</option>\n\
                    <option value=\"負け抜け1人\">負け抜け1人</option>\n\
                    <option value=\"負け抜け2人\">負け抜け2人</option>\n\
                    <option value=\"勝ち抜け1人\">勝ち抜け1人</option>\n\
                    <option value=\"勝ち抜け2人\">勝ち抜け2人</option>\n\
                </select>\n\
            </td>\n\
        </tr>\n\
        <tr>\n\
            <td class=\"ftdc\">\n\
                <b>*部屋人数</b>\n\
            </td>\n\
            <td>\n\
                <input v-model=\"capacity\" type=\"number\" name=\"capacity\" max=\"8\" min=\"2\" required>\n\
            </td>\n\
        </tr>\n\
        <tr>\n\
            <td class=\"ftdc\">\n\
                <b>終了予定時刻</b>\n\
            </td>\n\
            <td>\n\
                <input v-model=\"deadline\" type=\"time\" name=\"deadline\">\n\
            </td>\n\
        </tr>\n\
        <tr>\n\
            <td class=\"ftdc\">\n\
                <b>コメント</b>\n\
            </td>\n\
            <td>\n\
                <textarea v-model=\"overview\" id=\"ftxa\" name=\"overview\"></textarea>\n\
            </td>\n\
        </tr>\n\
        <tr>\n\
            <td class=\"ftdc\">\n\
                <b>アイコン</b>\n\
            </td>\n\
            <td>\n\
                <img @click=\"icon = $event.target.src\" class=\"iconlist\" v-for=\"img in images\" :src=\"img\" width=\"30px\">\n\
            </td>\n\
        </tr>\n\
        <tr>\n\
            <td class=\"ftdc\">\n\
                <b>配信</b>\n\
            </td>\n\
            <td>\n\
                <label><input v-model=\"cast\" type=\"radio\" name=\"cast\" value=\"true\">OK</label>\n\
                <label><input v-model=\"cast\" type=\"radio\" name=\"cast\" value=\"false\">NG</label>\n\
            </td>\n\
        </tr>\n\
        <tr>\n\
            <td class=\"ftdc\">\n\
                <b>配信URL</b>\n\
            </td>\n\
            <td>\n\
                <input v-model=\"cast_url\" type=\"url\">\n\
            </td>\n\
        </td>\n\
        <tr>\n\
            <td class=\"ftdc\">\n\
                <b>*編集用パス</b>\n\
            </td>\n\
            <td>\n\
                <input id=\"inp_editpass\" v-model=\"editpass\" type=\"password\" v-bind:value.prop=\"editpass\" size=\"8\" required>\n\
                英数8文字以内\n\
            </td>\n\
        </tr>\n\
    </tbody>\n\
    </table>\n\
\n\
    <p style=\"text-align:center; margin-bottom: 0\">投稿サンプル</p><br>\n\
    <div class=\"room-list\" v-bind:class=\"{ full : member == capacity }\">\n\
        <div class=\"icon\">\n\
            <img :src=\"icon\">\n\
        </div>\n\
        <div class=\"power\">{{ power }}<span v-if=\"power != ''\">万</span></div>\n\
        <div class=\"id\">\n\
            <span>{{ id }}</span>\n\
        </div>\n\
        <div class=\"pass\">{{ pass }}</div>\n\
        <div class=\"style\">\n\
            <span v-if=\"checkDevice() == 'pc'\">{{ style }}</span>\n\
                <span v-else>\n\
                <span v-if=\"style.length > 4\">{{ style[0] + style[1] + style[2] }}</span>\n\
                <span v-else>{{ style }}</span>\n\
            </span>\n\
        </div>\n\
        <div class=\"rule\">\n\
            <i v-if=\"rule == 'ストック制'\" class=\"fas fa-user\"></i>\n\
            <i v-if=\"rule == 'タイム制'\" class=\"far fa-clock\"></i>\n\
            <i v-if=\"rule == '体力制'\" class=\"fas fa-heart\"></i>\n\
            <span v-show=\"checkDevice() == 'pc'\">{{ rule }}</span>\n\
            <span v-if=\"rule == 'ストック制'\">({{ stock }})</span>\n\
        </div>\n\
        <div class=\"time\">{{ time }}</div>\n\
        <div class=\"ic\">{{ ic }}</div>\n\
        <div class=\"overview\">\n\
        <i v-show=\"!url_edit\" v-if=\"cast == 'true'\" class=\"fas fa-video fa-fw cast-allow\"></i>\n\
        <i v-show=\"cast_url == ''\" v-if=\"cast == 'false'\" class=\"fas fa-video-slash fa-fw cast-allow\"></i>\n\
        <a v-if=\"cast_url != ''\" v-bind:href = \"cast_url\" target=\"_blank\" rel=\"noopener noreferrer\"><i class=\"fas fa-video fa-fw cast-allow\" style=\"text-decoration: underline\"></i></a>\n\
        <div class=\"content\">{{ overview }}</div>\n\
        </div>\n\
        <div class=\"stage\">\n\
            <span v-if=\"checkDevice() == 'pc'\">{{ stage }}</span>\n\
            <span v-else>\n\
                {{ stage[0] }}\n\
            </span>\n\
        </div>\n\
        <div class=\"space\"><br>/{{ capacity }}</div>\n\
        <div class=\"change\">\n\
            <span v-if=\"change != ''\">\n\
                <span v-if=\"checkDevice() == 'pc'\">{{ change }}</span>\n\
                <span v-else>\n\
                    {{ change[0] + change[4] }}\n\
                </span>\n\
            </span>\n\
        </div>\n\
        <div class=\"start\">{{ start }}</div>\n\
        <div class=\"b\">～</div>\n\
        <div class=\"deadline\">{{ deadline }}</div>\n\
    </div>\n\
    <div style=\"text-align:center\">\n\
        <button type=\"button\" id=\"copy\" @click=\"makeTempString\" :data-clipboard-text=\"temp_string\">テンプレ文字列をコピー</button>\n\
        <span v-show=\"success\" style=\"color: red;\">コピーしました</span>\n\
        <br>\n\
        <input type=\"submit\" :value=\"!roomFlag ? '部屋をリストに追加' : '部屋の情報を修正'\">\n\
        </div>\n\
        </form>"
})

var app = new Vue({
    el: "#app",
    data: {
        roomList: []
    }
})


var clipboard = new Clipboard('#copy');
clipboard.on('success', function (e) {
    sample.success = true;
    e.clearSelection();
});

function syncRoomData() {
    for (const i in app.roomList) {
        const room = app.roomList[i]
        if (room.room_uuid === room_uuid) {
            for (const key in sample) {
                if (typeof room[key] !== "undefined" && key !== "editpass") {
                    sample[key] = room[key];
                }
            }
            return;
        }
    }
}

var roomListController = {
    create: function (data) {
        data.detail["key"] = app.roomList.length;
        app.roomList.unshift(data.detail);
    },
    loadList: function (rooms) {
        sample.roomFlag = false;
        for (var i = 0; i < rooms.detail.length; i++) {
            if (rooms.detail[i].room_uuid === room_uuid) {
                sample.roomFlag = true;
            }
            room = rooms.detail[i];
            room["key"] = app.roomList.length;
            app.roomList.unshift(room);
        }
        if (sample.roomFlag === false) {
            room_uuid = null;
            localStorage.removeItem("room_uuid");
        }
        syncRoomData();
    },
    updateList: function (rooms) {
        app.roomList = [];
        let roomInList = false;
        for (var i = 0; i < rooms.detail.length; i++) {
            room = rooms.detail[i];
            room["key"] = app.roomList.length;
            if (room["room_uuid"] === room_uuid) {
                roomInList = true;
            }
            app.roomList.unshift(room);
        }

        if (!roomInList) {
            sample.roomFlag = false;
            room_uuid = null;
            localStorage.removeItem("room_uuid");
        } else {
            syncRoomData();
        }
    }
}

roomListController.loadList({ detail: currentRooms });

socketEvent.addEventListener("created", roomListController.create);
socketEvent.addEventListener("updated", roomListController.updateList);

socketEvent.addEventListener("alert_message", function (data) {
    window.alert(data.detail);
});

socketEvent.addEventListener("accepted", function (data) {
    if ("room_uuid" in data.detail) {
        room_uuid = data.detail["room_uuid"]
        localStorage.setItem("room_uuid", room_uuid);

        syncRoomData();
    }

    if ("room_removed" in data.detail) {
        room_uuid = null;
        localStorage.removeItem("room_uuid");
    }
});

socketEvent.ready();
