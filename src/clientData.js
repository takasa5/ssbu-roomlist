import uuid4 from "uuid4";

const clientData = {
    hostname: document.location,
    get clientUuid() {
        let uuid = localStorage.getItem("client_uuid");
        if (uuid) {
            return uuid;
        }
        uuid = uuid4();
        clientData.clientUuid = uuid;
        return uuid;
    },
    set clientUuid(uuid) {
        try {
            localStorage.setItem("client_uuid", uuid);
        } catch (e) {
            window.console.error(e);
        }
        return uuid;
    },
    get roomUuid() {
        const onetimeRoomUuid = localStorage.getItem("onetime_room_uuid");
        if (onetimeRoomUuid) {
            return onetimeRoomUuid;
        }
        return localStorage.getItem("room_uuid") || null;
    },
    set roomUuid(uuid) {
        if (!uuid) {
            localStorage.removeItem("room_uuid");
            localStorage.removeItem("onetime_room_uuid");
        } else {
            try {
                localStorage.setItem("room_uuid", uuid);
            } catch (e) {
                window.console.error(e);
            }
        }
        return uuid;
    },
    get onetimeRoomUuid() {
        return localStorage.getItem("onetime_room_uuid");
    },
    set onetimeRoomUuid(uuid) {
        if (!uuid) {
            localStorage.removeItem("onetime_room_uuid");
        } else {
            try {
                localStorage.setItem("onetime_room_uuid", uuid);
            } catch (e) {
                window.console.error(e);
            }
        }
        return uuid;
    },
    /**
     * 部屋立てエリアの情報を一覧と同期する。
     */
    syncRoomData() {
        window.app.roomList.forEach(room => {
            if (room.room_uuid === clientData.roomUuid) {
                Object.keys(window.sample).forEach(key => {
                    if (typeof room[key] !== "undefined" && key !== "editpass") {
                        window.console.info(key, window.sample[key], room[key]);
                        window.sample[key] = room[key];
                    }
                });
            }
        });
    }
};
window.hostname = document.location;

window.clientUuid = localStorage.getItem("client_uuid") || uuid4();
try {
    localStorage.setItem("client_uuid", window.clientUuid);
} catch (e) {
    window.console.error(e);
}

window.roomUuid = localStorage.getItem("room_uuid") || null;

export default clientData;
