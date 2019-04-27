import Vue from "vue";
import clientData from "clientData";
import roomListContainer from "roomListContainer.vue";
import roomListEntry from "roomListEntry.vue";
import roomSample from "roomSample.vue";

// 一時的な値をリセット
clientData.onetimeRoomUuid = null;

Vue.component("room-list", roomListEntry);

window.app = new Vue(roomListContainer);

window.sample = new Vue(roomSample);

const clipboard = new Clipboard("#copy");
clipboard.on("success", e => {
    window.sample.success = true;
    e.clearSelection();
});

const roomListController = {
    create(data) {
        const room = data.detail;
        room.key = window.app.roomList.length;
        window.app.roomList.unshift(room);
    },
    loadList(rooms) {
        window.sample.roomFlag = false;

        rooms.detail.forEach(entry => {
            const room = entry;
            if (room.room_uuid === clientData.roomUuid) {
                window.sample.roomFlag = true;
            }
            room.key = window.app.roomList.length;
            window.app.roomList.unshift(room);
        });

        if (window.sample.roomFlag === false) {
            clientData.roomUuid = null;
        }

        clientData.syncRoomData();
    },
    updateList(rooms) {
        window.app.roomList = [];
        let roomInList = false;
        rooms.detail.forEach(entry => {
            const room = entry;
            room.key = window.app.roomList.length;
            if (room.room_uuid === clientData.roomUuid) {
                roomInList = true;
            }
            window.app.roomList.unshift(room);
        });

        if (!roomInList) {
            window.sample.roomFlag = false;
            clientData.roomUuid = null;
        } else {
            clientData.syncRoomData();
        }
    }
};

roomListController.loadList({ detail: currentRooms });

window.socketEvent.addEventListener("reconnect", () => {
    window.socket.emit("request_update");
});

window.socketEvent.addEventListener("created", roomListController.create);
window.socketEvent.addEventListener("updated", roomListController.updateList);

window.socketEvent.addEventListener("alert_message", data => {
    // eslint-disable-next-line no-alert
    window.alert(data.detail);
});

window.socketEvent.addEventListener("accepted", data => {
    if ("room_uuid" in data.detail) {
        clientData.roomUuid = data.detail.room_uuid;
        clientData.syncRoomData();
    }

    if ("room_removed" in data.detail) {
        clientData.roomUuid = null;
    }
});

window.socketEvent.ready();
