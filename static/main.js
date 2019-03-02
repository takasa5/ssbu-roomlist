var hostname = document.location.hostname;
if (hostname == "localhost" || hostname == "127.0.0.1" || hostname == "") {
    socket = io('http://127.0.0.1:5000');
} else {
    socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
}
socket.emit("open");
var arr = {};
if (document.cookie != '') {
    var tmp = document.cookie.split('; ');
    for (var i = 0; i < tmp.length; i++) {
        var data = tmp[i].split('=');
        arr[data[0]] = decodeURIComponent(data[1]);
    }
}
var roomListTemp = `
<div class="room-list" v-bind:class="{ full : room.member == room.capacity }">
    <div class="icon">
        <img :src="room.icon">
    </div>
    <div class="power">{{ room.power }}<span v-if="room.power != ''">万</span></div>
    <div class="id">
        <span v-show="!room.id_edit">{{ room.id }}</span>
        <input autofocus v-model="room.new_id" v-show="room.id_edit" type="text" name="id_edit" size="5" maxlength="5" pattern="[A-Za-z0-9]{5}">
        <i v-show="!room.id_edit" @click="room.id_edit = true;" class="fas fa-edit"></i>
        <i v-show="room.id_edit" @click="changeID" class="fas fa-undo"></i>
    </div>
    <div class="pass">{{ room.pass }}</div>
    <div class="style">
        <span v-if="checkDevice() == 'pc'">{{ room.style }}</span>
            <span v-else>
            <span v-if="room.style.length > 4">{{ room.style[0] + room.style[1] + room.style[2] }}</span>
            <span v-else>{{ room.style }}</span>
        </span>
    </div>
    <div class="rule">
        <i v-if="room.rule == 'ストック制'" class="fas fa-user"></i>
        <i v-if="room.rule == 'タイム制'" class="far fa-clock"></i>
        <i v-if="room.rule == '体力制'" class="fas fa-heart"></i>
        <span v-show="checkDevice() == 'pc'">{{ room.rule }}</span>
        <span v-if="room.rule == 'ストック制'">({{ room.stock }})</span>
    </div>
    <div class="time">{{ room.time }}</div>
    <div class="ic">{{ room.ic }}</div>
    <div class="overview" v-html="room.overview"></div>
    <div class="stage">
        <span v-if="checkDevice() == 'pc'">{{ room.stage }}</span>
        <span v-else>
            {{ room.stage[0] }}
        </span>
    </div>
    <div class="space">{{ room.member }}<button @click="addMember">+</button><button @click="subMember">-</button><br>/{{ room.capacity }}</div>
    <div class="change">
        <span v-if="room.change != ''">
            <span v-if="checkDevice() == 'pc'">{{ room.change }}</span>
            <span v-else>
                {{ room.change[0] + room.change[4] }}
            </span>
        </span>
    </div>
    <div class="start">{{ room.start }}</div>
    <div class="b">～</div>
    <div class="deadline">{{ room.deadline }}</div>
</div>
`;

function checkDevice() {
    var ua = window.navigator.userAgent.toLowerCase();
    if (ua.indexOf("phone") != -1 || ua.indexOf("android") != -1 || ua.indexOf("ipod") != -1 || ua.indexOf("ipad") != -1 || ua.indexOf("tab") != -1)
        return "phone";
    else
        return "pc";
}

function sliceMaxLength(elem, maxLength) {  
    elem.value = elem.value.slice(0, maxLength);  
}  

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
                socket.emit("update", sample.editpass, this.room.uuid, "member", this.room.member + 1);
        },
        subMember: function () {
            if (this.room.member == 1)
                socket.emit("delete", sample.editpass, this.room.uuid);
            else
                socket.emit("update", sample.editpass, this.room.uuid, "member", this.room.member - 1);
        },
        changeID: function () {
            if (this.room.new_id != "" && this.room.new_id.length == 5)
                socket.emit("update", sample.editpass, this.room.uuid, "id", this.room.new_id);
            this.room.id_edit = false;
        }
    }
})
var images = [];
for (var i = 0; i < 104; i++) {
    images.push("/static/img/" + i + ".jpg?0219");
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
        editpass: arr['editpass'] == undefined ? "": arr['editpass'],
        images: images,
        change: "",
        start: "",
        deadline: "",
        uuid: "",
        id_edit: false,
        new_id: "",
        temp_string: "",
        success: false,
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
                this.temp_string += " "  + this.stock + "ストック\n";
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
            var reg = new RegExp("((https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+))");
            socket.emit("create", {
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
                overview: this.overview
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(reg, "<a href='$1' target='_blank'>$1</a>"),
                change: this.change,
                member: 1,
                capacity: this.capacity,
                deadline: this.deadline,
                editpass: this.editpass,
                id_edit: false,
                new_id: ""
            });
            document.cookie = 'editpass=' + encodeURIComponent(this.editpass);
            location.reload();
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
        }
    },
    template: `
    <form id="inputArea" method="POST" onsubmit="return false;">
    <div style="text-align:center">
        <button @click="inputOnes">1on1入力</button>
        <button @click="inputFours">乱闘入力</button>
    </div>
    <table class="ftbl" id="ftbl" style="position: static; left: 50%; margin-left: auto; margin-right: auto; top: 16711px; visibility: visible;">
    <tbody>
        <tr>
            <td class="ftdc">
                <b>*部屋ID</b>
            </td>
            <td>
                <input v-model="id" type="text" name="id" size="5" maxlength="5" pattern="[A-Za-z0-9]{5}" required> 英数字5文字
            </td>
        </tr>
        <tr>
            <td class="ftdc">
                <b>パス</b>
            </td>
            <td>
                <input id="pass" v-model="pass" type="number" name="pass" size="8" oninput="sliceMaxLength(this, 8)">
            </td>
        </tr>
        <tr>
            <td class="ftdc">
                <b>参考戦闘力(万)</b>
            </td>
            <td>
                <input v-model="power" type="number" name="power" size="3" min="1" max="999">
            </td>
        </tr>
        <tr>
            <td class="ftdc">
                <b>*乱闘形式</b>
            </td>
            <td>
                <input v-model="style" name="style" type="radio" value="1on1" required>1on1
                <input v-model="style" name="style" type="radio" value="乱闘">乱闘
                <input v-model="style" name="style" type="radio" value="チーム乱闘">チーム乱闘
            </td>
        </tr>
        <tr>
            <td class="ftdc">
                <b>*ルール</b>
            </td>
            <td>
                <input v-model="rule" type="radio" name="rule" value="ストック制" required>ストック制
                <input v-model="rule" type="radio" name="rule" value="タイム制">タイム制
                <input v-model="rule" type="radio" name="rule" value="体力制">体力制
            </td>
        </tr>
        <tr v-if="rule == 'ストック制'">
            <td class="ftdc">
                <b>*ストック</b>
            </td>
            <td>
                <input v-model="stock" type="number" name="stock" min="1" max="7" required>
            </td>
        </tr>
        <tr>
            <td class="ftdc">
                <b>*制限時間</b>
            </td>
            <td>
                <select v-model="time" name="time" required>
                    <option disabled value="">制限時間を選択</option>
                    <option value="1分">1分</option>
                    <option value="1.5分">1.5分</option>
                    <option value="2分">2分</option>
                    <option value="2.5分">2.5分</option>
                    <option value="3分">3分</option>
                    <option value="4分">4分</option>
                    <option value="5分">5分</option>
                    <option value="6分">6分</option>
                    <option value="7分">7分</option>
                    <option value="8分">8分</option>
                    <option value="9分">9分</option>
                    <option value="10分">10分</option>
                </select>
            </td>
        </tr>
        <tr>
            <td class="ftdc">
                <b>*ステージ</b>
            </td>
            <td>
                <select v-model="stage" name="stage" required>
                    <option disabled value="">ステージを選択</option>
                    <option value="終点化">終点化</option>
                    <option value="戦場化">戦場化</option>
                    <option value="ランダム">ギミックなしランダム</option>
                    <option value="ギミック">ギミックありランダム</option>
                </select>
            </td>
        </tr>
        <tr>
            <td class="ftdc">
                <b>*アイテム/</b><br>
                <b>チャージ切り札</b>
            </td>
            <td>
                <select v-model="ic" name="ic" required>
                    <option disabled value="">有無を選択</option>
                    <option value="無/無">無/無</option>
                    <option value="有/無">有/無</option>
                    <option value="無/有">無/有</option>
                    <option value="有/有">有/有</option>
                </select>
            </td>
        </tr>
        <tr>
            <td class="ftdc">
                <b>*入れ替え</b>
            </td>
            <td>
                <select v-model="change" name="change" required>
                    <option disabled value="">入れ替えルールを選択</option>
                    <option value="負け抜け1人">負け抜け1人</option>
                    <option value="負け抜け2人">負け抜け2人</option>
                    <option value="勝ち抜け1人">勝ち抜け1人</option>
                    <option value="勝ち抜け2人">勝ち抜け2人</option>
                </select>
            </td>
        </tr>
        <tr>
            <td class="ftdc">
                <b>*部屋人数</b>
            </td>
            <td>
                <input v-model="capacity" type="number" name="capacity" max="8" min="2" required>
            </td>
        </tr>
        <tr>
            <td class="ftdc">
                <b>終了予定時刻</b>
            </td>
            <td>
                <input v-model="deadline" type="time" name="deadline">
            </td>
        </tr>
        <tr>
            <td class="ftdc">
                <b>コメント</b>
            </td>
            <td>
                <textarea v-model="overview" id="ftxa" name="overview"></textarea>
            </td>
        </tr>
        <tr>
            <td class="ftdc">
                <b>アイコン</b>
            </td>
            <td>
                <img @click="icon = $event.target.src" class="iconlist" v-for="img in images" :src="img" width="30px">
            </td>
        </tr>
        <tr>
            <td class="ftdc">
                <b>*編集用パス</b>
            </td>
            <td>
                <input id="inp_editpass" v-model="editpass" type="password" v-bind:value.prop="editpass" size="8" required>
                英数8文字以内
            </td>
        </tr>
    </tbody>
    </table>

    <p style="text-align:center; margin-bottom: 0">投稿サンプル</p><br>
    `
        + roomListTemp.replace(/room\./g, "")
            .replace('<div class=\"overview\" v-html=\"overview\"></div>', '<div class=\"overview\">{{ overview }}</div>')
            .replace('<button @click=\"addMember\">+</button><button @click=\"subMember\">-</button>', "")
            .replace('<i v-show=\"!id_edit\" @click=\"id_edit = true;\" class=\"fas fa-edit\"></i>', "")
            .replace('<i v-show=\"id_edit\" @click=\"changeID\" class=\"fas fa-undo\"></i>', "")
        + `
    <div style="text-align:center">
        <button id="copy" @click="makeTempString" :data-clipboard-text="temp_string">テンプレ文字列をコピー</button>
        <span v-show="success" style="color: red;">コピーしました</span>
        <br>
        <input v-show="id == '' || style == '' || rule == '' || time == '' || ic == '' || stage == '' || capacity == '' || change == '' || editpass == ''"
            type="submit" value="部屋をリストに追加">
        <input v-show="id != '' && style != '' && rule != '' && time != '' && ic != '' && stage != '' && capacity != '' && change != '' && editpass != ''"
            type="submit" value="部屋をリストに追加" @click="submit">
    </div>
    </form>`
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

socket.on("created", function (data) {
    data["key"] = app.roomList.length;
    app.roomList.unshift(data);
});

socket.on("return_list", function (rooms) {
    for (var i = 0; i < rooms.length; i++) {
        room = rooms[i];
        room["key"] = app.roomList.length;
        app.roomList.unshift(room);
    }
});

socket.on("updated", function (rooms) {
    app.roomList = [];
    for (var i = 0; i < rooms.length; i++) {
        room = rooms[i];
        room["key"] = app.roomList.length;
        app.roomList.unshift(room);
    }
})