<template>
    <div class="room-list" :class="roomClass">
        <div class="icon">
            <img :src="room.icon" />
        </div>
        <div class="power">
            {{ room.power !== "" ? `${room.power}万` : "" }}
        </div>
        <div class="id">
            <span v-show="!room.id_edit">{{ room.id }}</span>
            <input
                v-show="room.id_edit"
                v-model="room.new_id"
                autofocus
                type="text"
                name="id_edit"
                size="5"
                maxlength="5"
                pattern="[A-Za-z0-9]{5}"
            />
            <i v-show="!room.id_edit" class="fas fa-edit" @click="room.id_edit = true" />
            <i v-show="room.id_edit" class="fas fa-undo" @click="changeID" />
        </div>
        <div class="pass">
            {{ room.pass }}
        </div>
        <div class="style">
            <span v-if="winWidth > 1024">{{ room.style }}</span>
            <span v-else>
                <span v-if="room.style.length > 4">
                    {{ room.style.slice(0, 3) }}
                </span>
                <span v-else>
                    {{ room.style }}
                </span>
            </span>
        </div>
        <div class="rule">
            <i v-if="room.rule === 'ストック制'" class="fas fa-user" />
            <i v-if="room.rule === 'タイム制'" class="far fa-clock" />
            <i v-if="room.rule === '体力制'" class="fas fa-heart" />
            <span v-show="winWidth > 1024">{{ room.rule }}</span>
            <span v-if="room.rule === 'ストック制'">({{ room.stock }})</span>
        </div>
        <div class="time">
            {{ room.time }}
        </div>
        <div class="ic">
            {{ room.ic }}
        </div>
        <div class="overview">
            {{ room.overview }}
        </div>
        <div class="stage">
            <span v-if="winWidth > 812">{{ room.stage }}</span>
            <span v-else>{{ room.stage[0] }}</span>
        </div>
        <div v-if="winWidth > 480" class="space">
            {{ room.member }}<button type="button" @click="addMember">+</button
            ><button type="button" @click="subMember">-</button>
            <br />
            /{{ room.capacity }}
        </div>
        <div v-else class="space">
            {{ room.member }}/{{ room.capacity }} <button type="button" @click="addMember">+</button
            ><button type="button" @click="subMember">-</button>
        </div>
        <div class="change">
            <span v-if="room.change !== ''">
                <span v-if="winWidth > 812">{{ room.change }}</span>
                <span v-else>{{ room.change[0] + room.change[4] }}</span>
            </span>
        </div>
        <div class="custom-stages">
            <i class="fas fa-shapes" v-if="room.custom === 'on'" />
            {{ room.custom === "on" ? (winWidth > 812 ? "自作あり" : "作") : "" }}
        </div>
        <div class="start-dead">
            {{ room.start }}
            ～
            {{ room.deadline }}
        </div>
        <div class="cast-container">
            <div class="cast-status" :class="castText.class">
                {{ castText.text }}
            </div>
            <a
                v-if="room.cast_url !== ''"
                v-show="!room.url_edit"
                :href="room.cast_url"
                class="cast-link"
                target="_blank"
                rel="noopener"
                >{{ room.cast_title }}</a
            >
            <div v-if="room.cast === 'allow'">
                <input v-show="room.url_edit" v-model="room.new_url" autofocus type="url" />
                <i v-show="!room.url_edit" class="fas fa-edit" @click="room.url_edit = true" />
                <i v-show="room.url_edit" class="fas fa-undo" @click="changeURL" />
            </div>
        </div>
        <div class="edit-room">
            <button type="button" @click="editRoom">編集</button>
        </div>
    </div>
</template>

<script>
import clientData from "clientData";
import { castText, roomClass } from "roomProps";

export default {
    props: ["room"],
    data: () => ({ winWidth: window.innerWidth }),
    created() {
        window.addEventListener("slowResize", this.getWidth);
    },
    beforeDestroy() {
        window.removeEventListener("slowResize", this.getWidth);
    },
    computed: {
        castText() {
            return this.room |> castText;
        },
        roomClass() {
            return this.room |> roomClass;
        }
    },
    methods: {
        getWidth() {
            this.winWidth = window.innerWidth;
        },
        /**
         * メンバーを加算する。
         */
        addMember() {
            if (parseInt(this.room.member, 10) >= parseInt(this.room.capacity, 10)) return;
            window.socket.emit(
                "update",
                window.sample.editpass,
                clientData.clientUuid,
                this.room.room_uuid,
                {
                    member: parseInt(this.room.member, 10) + 1
                }
            );
        },
        /**
         * メンバーを減算し、メンバーが0になった場合は削除する。
         */
        subMember() {
            if (parseInt(this.room.member, 10) === 1) {
                window.socket.emit(
                    "delete",
                    window.sample.editpass,
                    clientData.clientUuid,
                    this.room.room_uuid
                );
                window.sample.roomFlag = false;
            } else {
                window.socket.emit(
                    "update",
                    window.sample.editpass,
                    clientData.clientUuid,
                    this.room.room_uuid,
                    {
                        member: parseInt(this.room.member, 10) - 1
                    }
                );
            }
        },
        changeID() {
            if (this.room.new_id !== "" && this.room.new_id.length === 5) {
                window.socket.emit(
                    "update",
                    window.sample.editpass,
                    clientData.clientUuid,
                    this.room.room_uuid,
                    {
                        id: this.room.new_id
                    }
                );
            }
            this.room.id_edit = false;
        },
        changeURL() {
            window.socket.emit(
                "update_cast",
                window.sample.editpass,
                clientData.clientUuid,
                this.room.room_uuid,
                "cast_url",
                this.room.new_url
            );
            this.room.url_edit = false;
        },
        editRoom() {
            if (clientData.roomUuid !== this.room.room_uuid) {
                clientData.onetimeRoomUuid = this.room.room_uuid;
                clientData.syncRoomData();
            }
            window.sample.roomFlag = true;

            // eslint-disable-next-line no-unused-expressions
            document.getElementById("room-edit").getBoundingClientRect().top
                |> (_ => window.scrollBy(0, _));

            if (clientData.onetimeRoomUuid) {
                document.getElementById("inp_editpass").focus();
            }
        }
    }
};
</script>
