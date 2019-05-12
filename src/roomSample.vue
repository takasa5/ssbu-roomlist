<template>
    <form id="inputArea" action method="get" @submit.prevent="submit">
        <div style="text-align:center">
            <button type="button" @click="inputOnes">
                1on1入力
            </button>
            <button type="button" @click="inputFours">
                乱闘入力
            </button>
        </div>
        <table id="ftbl" class="ftbl">
            <tbody>
                <tr>
                    <td class="ftdc">
                        <b>*部屋ID</b>
                    </td>
                    <td>
                        <input
                            v-model="id"
                            type="text"
                            name="id"
                            size="8"
                            maxlength="5"
                            pattern="[A-Za-z0-9]{5}"
                            required
                        />
                        英数字5文字
                    </td>
                </tr>
                <tr>
                    <td class="ftdc">
                        <b>パス</b>
                    </td>
                    <td>
                        <input
                            id="pass"
                            v-model="pass"
                            type="text"
                            name="pass"
                            size="10"
                            maxlength="8"
                            pattern="[0-9]*"
                        />
                    </td>
                </tr>
                <tr>
                    <td class="ftdc">
                        <b>参考戦闘力(万)</b>
                    </td>
                    <td>
                        <input
                            v-model="power"
                            type="number"
                            name="power"
                            size="3"
                            min="1"
                            max="999"
                        />
                    </td>
                </tr>
                <tr>
                    <td class="ftdc">
                        <b>*乱闘形式</b>
                    </td>
                    <td>
                        <label>
                            <input
                                v-model="style"
                                name="style"
                                type="radio"
                                value="1on1"
                                required
                            />1on1
                        </label>
                        <label>
                            <input v-model="style" name="style" type="radio" value="乱闘" />乱闘
                        </label>
                        <label>
                            <input
                                v-model="style"
                                name="style"
                                type="radio"
                                value="チーム乱闘"
                            />チーム乱闘
                        </label>
                    </td>
                </tr>
                <tr>
                    <td class="ftdc">
                        <b>*ルール</b>
                    </td>
                    <td>
                        <label>
                            <input
                                v-model="rule"
                                type="radio"
                                name="rule"
                                value="ストック制"
                                required
                            />ストック制
                        </label>
                        <label>
                            <input
                                v-model="rule"
                                type="radio"
                                name="rule"
                                value="タイム制"
                            />タイム制
                        </label>
                        <label>
                            <input v-model="rule" type="radio" name="rule" value="体力制" />体力制
                        </label>
                    </td>
                </tr>
                <tr v-if="rule === 'ストック制'">
                    <td class="ftdc">
                        <b>*ストック</b>
                    </td>
                    <td>
                        <input
                            v-model="stock"
                            type="number"
                            name="stock"
                            min="1"
                            max="7"
                            required
                        />
                    </td>
                </tr>
                <tr>
                    <td class="ftdc">
                        <b>*制限時間</b>
                    </td>
                    <td>
                        <select v-model="time" name="time" required>
                            <option disabled value>
                                制限時間を選択
                            </option>
                            <option value="1分">
                                1分
                            </option>
                            <option value="1.5分">
                                1.5分
                            </option>
                            <option value="2分">
                                2分
                            </option>
                            <option value="2.5分">
                                2.5分
                            </option>
                            <option value="3分">
                                3分
                            </option>
                            <option value="4分">
                                4分
                            </option>
                            <option value="5分">
                                5分
                            </option>
                            <option value="6分">
                                6分
                            </option>
                            <option value="7分">
                                7分
                            </option>
                            <option value="8分">
                                8分
                            </option>
                            <option value="9分">
                                9分
                            </option>
                            <option value="10分">
                                10分
                            </option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td class="ftdc">
                        <b>*ステージ</b>
                    </td>
                    <td>
                        <select v-model="stage" name="stage" required>
                            <option disabled value>
                                ステージを選択
                            </option>
                            <option value="選ぶ">
                                あらかじめ選ぶ
                            </option>
                            <option value="終点化">
                                終点化
                            </option>
                            <option value="戦場化">
                                戦場化
                            </option>
                            <option value="ランダム">
                                ギミックなしランダム
                            </option>
                            <option value="ギミック">
                                ギミックありランダム
                            </option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td class="ftdc">
                        <b>*自作ステージ</b>
                    </td>
                    <td>
                        <select v-model="custom" name="custom" required>
                            <option value="on">自作あり</option>
                            <option value="off">自作なし</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td class="ftdc">
                        <b>*アイテム/</b>
                        <br />
                        <b>チャージ切り札</b>
                    </td>
                    <td>
                        <select v-model="ic" name="ic" required>
                            <option disabled value>
                                有無を選択
                            </option>
                            <option value="無/無">
                                無/無
                            </option>
                            <option value="有/無">
                                有/無
                            </option>
                            <option value="無/有">
                                無/有
                            </option>
                            <option value="有/有">
                                有/有
                            </option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td class="ftdc">
                        <b>*入れ替え</b>
                    </td>
                    <td>
                        <select v-model="change" name="change" required>
                            <option disabled value>
                                入れ替えルールを選択
                            </option>
                            <option value="負け抜け1人">
                                負け抜け1人
                            </option>
                            <option value="負け抜け2人">
                                負け抜け2人
                            </option>
                            <option value="勝ち抜け1人">
                                勝ち抜け1人
                            </option>
                            <option value="勝ち抜け2人">
                                勝ち抜け2人
                            </option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td class="ftdc">
                        <b>*部屋人数</b>
                    </td>
                    <td>
                        <input
                            v-model="capacity"
                            type="number"
                            name="capacity"
                            max="8"
                            min="2"
                            required
                        />
                    </td>
                </tr>
                <tr>
                    <td class="ftdc">
                        <b>終了予定時刻</b>
                    </td>
                    <td>
                        <input v-model="deadline" type="time" name="deadline" />
                    </td>
                </tr>
                <tr>
                    <td class="ftdc">
                        <b>コメント</b>
                    </td>
                    <td>
                        <textarea id="ftxa" v-model="overview" name="overview" />
                    </td>
                </tr>
                <tr>
                    <td class="ftdc">
                        <b>アイコン</b>
                    </td>
                    <td>
                        <img
                            v-for="img in images"
                            :key="img"
                            class="iconlist"
                            :src="img"
                            width="30px"
                            @click="icon = $event.target.src"
                        />
                    </td>
                </tr>
                <tr>
                    <td class="ftdc">
                        <b>配信</b>
                    </td>
                    <td>
                        <label>
                            <input v-model="cast" type="radio" name="cast" value="allow" />OK
                        </label>
                        <label>
                            <input v-model="cast" type="radio" name="cast" value="disallow" />NG
                        </label>
                    </td>
                </tr>
                <tr>
                    <td class="ftdc">
                        <b>配信URL</b>
                    </td>
                    <td>
                        <input v-model="cast_url" type="url" />
                    </td>
                </tr>
                <tr>
                    <td class="ftdc">
                        <b>*編集用パス</b>
                    </td>
                    <td>
                        <input
                            id="inp_editpass"
                            v-model="editpass"
                            type="password"
                            :value.prop="editpass"
                            size="8"
                            autocomplete="new-password"
                            required
                        />
                        英数8文字以内
                    </td>
                </tr>
            </tbody>
        </table>

        <p style="text-align:center; margin-bottom: 0">
            投稿サンプル
        </p>
        <br />
        <div class="room-list" :class="roomClass">
            <div class="icon">
                <img :src="icon" v-if="icon.length > 0" />
            </div>
            <div class="power">
                {{ power !== "" ? `${power} 万` : "" }}
            </div>
            <div class="id">
                <span>{{ id }}</span>
            </div>
            <div class="pass">
                {{ pass }}
            </div>
            <div class="style">
                <span v-if="winWidth > 1024">{{ style }}</span>
                <span v-else>
                    <span v-if="style.length > 4">{{ style.slice(0, 3) }}</span>
                    <span v-else>{{ style }}</span>
                </span>
            </div>
            <div class="rule">
                <i v-if="rule === 'ストック制'" class="fas fa-user" />
                <i v-if="rule === 'タイム制'" class="far fa-clock" />
                <i v-if="rule === '体力制'" class="fas fa-heart" />
                <span v-show="winWidth > 1024">{{ rule }}</span>
                <span v-if="rule === 'ストック制'">({{ stock }})</span>
            </div>
            <div class="time">
                {{ time }}
            </div>
            <div class="ic">
                {{ ic }}
            </div>
            <div class="overview">
                {{ overview }}
            </div>
            <div class="stage">
                <span v-if="winWidth > 812">{{ stage }}</span>
                <span v-else>{{ stage[0] }}</span>
            </div>
            <div v-if="winWidth > 480" class="space">
                <br />
                /{{ capacity }}
            </div>
            <div v-else class="space">/{{ capacity }}</div>
            <div class="change">
                <span v-if="change !== ''">
                    <span v-if="winWidth > 812">{{ change }}</span>
                    <span v-else>{{ change[0] + change[4] }}</span>
                </span>
            </div>
            <div class="custom-stages">
                <i class="fas fa-shapes" v-if="custom === 'on'" />
                {{ custom === "on" ? (winWidth > 812 ? "自作あり" : "作") : "" }}
            </div>
            <div class="start-dead">
                {{ start }}
                ～
                {{ deadline }}
            </div>
            <div class="cast-container">
                <div class="cast-status" :class="castText.class">
                    {{ castText.text }}
                </div>
                <a
                    v-if="cast_url !== ''"
                    :href="cast_url"
                    class="cast-link"
                    target="_blank"
                    rel="noopener"
                    >配信タイトル</a
                >
                <div v-if="cast === 'allow'">
                    <i class="fas fa-edit" />
                </div>
            </div>
            <div class="edit-room">
                <button type="button">編集</button>
            </div>
        </div>
        <div style="text-align:center">
            <button
                id="copy"
                type="button"
                :data-clipboard-text="temp_string"
                @click="makeTempString"
            >
                テンプレ文字列をコピー
            </button>
            <span v-show="success" style="color: red;">コピーしました</span>
            <br />
            <input type="submit" :value="!roomFlag ? '部屋をリストに追加' : '部屋の情報を修正'" />
        </div>
    </form>
</template>

<script>
import clientData from "clientData";
import { castText, roomClass } from "roomProps";
import images from "fighterImages";

const defaultData = () => ({
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
    custom: "off",
    overview: "",
    change: "",
    member: "",
    capacity: "",
    editpass: "",
    images,
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
    new_url: false,
    winWidth: window.innerWidth
});

export default {
    el: "#display",
    data: defaultData,
    created() {
        window.addEventListener("slowResize", this.getWidth);
    },
    beforeDestroy() {
        window.removeEventListener("slowResize", this.getWidth);
    },
    mounted() {
        if (sessionStorage.editpass) {
            this.editpass = sessionStorage.editpass;
        }
    },
    computed: {
        castText() {
            return this |> castText;
        },
        roomClass() {
            return this |> roomClass;
        }
    },
    methods: {
        getWidth() {
            this.winWidth = window.innerWidth;
        },
        makeTempString() {
            let tempString = `【部屋ID】${this.id}\n`;
            tempString += `【パス】${this.pass}\n`;
            tempString += `【乱闘形式】${this.style}\n`;
            tempString += `【ルール】${this.rule}`;
            if (this.rule === "ストック制") {
                tempString += ` ${this.stock}ストック\n`;
            } else this.temp_string += "\n";
            tempString += `【制限時間】${this.time}\n`;
            tempString += "【ステージ】";
            if (this.stage === "ランダム") {
                tempString += "ギミックなしランダム\n";
            } else if (this.stage === "ギミック") {
                tempString += "ギミックありランダム\n";
            } else tempString += `${this.stage}\n`;
            if (this.custom === "on") {
                tempString += "【自作ステージ】あり\n";
            }
            tempString += `【アイテム】${this.ic[0]}\n`;
            tempString += `【チャージ切り札】${this.ic[2]}\n`;
            tempString += `【入れ換え】${this.change}\n`;
            if (this.cast_url.length) {
                tempString += `【配信URL】${this.cast_url}\n`;
            }
            tempString += this.overview;

            this.temp_string = tempString.trim();
        },
        submit() {
            if (window.roomFlag === true) return;

            if (!clientData.roomUuid) {
                window.socket.emit("create", clientData.clientUuid, {
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
                    custom: this.custom,
                    overview: this.overview,
                    change: this.change,
                    member: 1,
                    capacity: parseInt(this.capacity, 10),
                    deadline: this.deadline,
                    editpass: this.editpass,
                    id_edit: false,
                    new_id: "",
                    cast: this.cast,
                    cast_url: this.cast_url,
                    url_edit: this.url_edit,
                    new_url: ""
                });
                sessionStorage.editpass = this.editpass;
                this.roomFlag = true;
            } else {
                window.socket.emit(
                    "update",
                    this.editpass,
                    clientData.clientUuid,
                    clientData.roomUuid,
                    {
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
                        custom: this.custom,
                        overview: this.overview,
                        change: this.change,
                        capacity: parseInt(this.capacity, 10),
                        deadline: this.deadline,
                        cast: this.cast,
                        cast_url: this.cast_url
                    }
                );
            }

            if (clientData.onetimeRoomUuid) {
                clientData.onetimeRoomUuid = null;
                Object.assign(this.$data, defaultData());
                document.getElementById("inputArea").reset();
            }

            window.scrollTo(window.scrollX, 0);
        },
        inputOnes() {
            this.style = "1on1";
            this.rule = "ストック制";
            this.stock = "2";
            this.time = "5分";
            this.stage = "終点化";
            this.ic = "無/無";
            this.change = "負け抜け1人";
            this.capacity = 4;
        },
        inputFours() {
            this.style = "乱闘";
            this.rule = "タイム制";
            this.time = "3分";
            this.stage = "ギミック";
            this.ic = "有/有";
            this.change = "負け抜け2人";
            this.capacity = 6;
        }
    }
};
</script>
