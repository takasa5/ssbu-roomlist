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

var c = Vue.component('room-list', {
    props: ['room'],
    template: `
        <div class="room-list">
            <div class="icon">
                <img :src="room.icon">
            </div>
            <div class="power">{{ room.power }}<span v-if="room.power != ''">万</span></div>
            <div class="id">{{ room.id }}</div>
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
                <span v-show="checkDevice() == 'pc'">{{ room.rule }}</span></div>
            <div class="time">{{ room.time }}分</div>
            <div class="ic">{{ room.ic }}</div>
            <div class="overview">{{ room.overview }}</div>
            <div class="stage">
                <span v-if="checkDevice() == 'pc'">{{ room.stage }}</span>
                <span v-else>
                    {{ room.stage[0] }}
                </span>
            </div>
            <div class="space">{{ room.member }}<button @click="addMember">+</button><button @click="subMember">-</button><br>/{{ room.capacity }}</div>
            <div class="change">
                <span v-if="checkDevice() == 'pc'">{{ room.change }}</span>
                <span v-else>
                    {{ room.change[0] + room.change[4] }}
                </span>
            </div>
        </div>`,
    methods: {
        checkDevice: function () {
            var ua = window.navigator.userAgent.toLowerCase();
            if (ua.indexOf("phone") != -1 || ua.indexOf("android") != -1 || ua.indexOf("ipod") != -1)
                return "phone";
            else
                return "pc";
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
        }
    }
})
var images = [];
for (var i = 1; i < 94; i++) {
    images.push("/static/img/" + i + ".jpg");
}
var sample = new Vue({
    el: "#display",
    data: {
        icon: "",
        power: "",
        id: "",
        pass: "",
        style: "",
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
        uuid: ""
    },
    methods: {
        submit: function (event) {
            socket.emit("create", {
                icon: this.icon,
                power: this.power,
                id: this.id,
                pass: this.pass,
                style: this.style,
                rule: this.rule,
                time: this.time,
                ic: this.ic,
                stage: this.stage,
                overview: this.overview,
                change: this.change,
                member: 1,
                capacity: this.capacity,
                editpass: this.editpass
            });
            document.cookie = 'editpass=' + encodeURIComponent(this.editpass);
            location.reload();
        }
    },
    template: `
    <form id="inputArea" method="POST" onsubmit="return false;">
    <table class="ftbl" id="ftbl" style="position: static; left: 50%; margin-left: auto; margin-right: auto; top: 16711px; visibility: visible;">
    <tbody>
        <tr>
            <td class="ftdc">
                <b>*部屋ID</b>
            </td>
            <td>
                <input v-model="id" type="text" name="id" size="5" maxlength="5" required>
            </td>
        </tr>
        <tr>
            <td class="ftdc">
                <b>パス</b>
            </td>
            <td>
                <input id="pass" v-model="pass" type="number" name="pass" maxlength="99999999">
            </td>
        </tr>
        <tr>
            <td class="ftdc">
                <b>参考戦闘力(万)</b>
            </td>
            <td>
                <input v-model="power" type="number" name="power" size="3" min="1">
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
            </td>
        </tr>
        <tr>
            <td class="ftdc">
                <b>*制限時間</b>
            </td>
            <td>
                <input v-model="time" type="number" name="time" max="10" min="1" required>
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
                <input id="inp_editpass" v-model="editpass" type="password" size="8" required>
                英数8文字以内
            </td>
        </tr>
    </tbody>
    </table>

    <p style="text-align:center; margin-bottom: 0">投稿サンプル</p><br>
    <div class="room-list">
        <div class="icon">
            <img :src="icon">
        </div>
        <div class="power">{{ power }}</div>
        <div class="id">{{ id }}</div>
        <div class="pass">{{ pass }}</div>
        <div class="style">{{ style }}</div>
        <div class="rule">{{ rule }}</div>
        <div class="time">{{ time }}</div>
        <div class="ic">{{ ic }}</div>
        <div class="overview">{{ overview }}</div>
        <div class="stage">{{ stage }}</div>
        <div class="space">1/{{ capacity }}</div>
        <div class="change">{{ change }}</div>
    </div>
    <div style="text-align:center">
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
        roomList: [
            // {
            //     key: 0,
            //     icon: "/static/sample.jpg",
            //     power: 300,
            //     id: "AAAAA",
            //     pass: "0000",
            //     style: "1on1",
            //     rule: "s",
            //     time: "5",
            //     ic: "0",
            //     stage: "終点",
            //     overview: "3連戦で抜けてください",
            //     change: "l1",
            //     member: 1,
            //     capacity: 4
            // }
        ]
    }
})  

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