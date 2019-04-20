var hostname = document.location.hostname;
if (hostname == "localhost" || hostname == "127.0.0.1" || hostname == "") {
    socket = io('http://127.0.0.1:5000');
} else {
    socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
}

function uuid4(a, b) { for (b = a = ''; a++ < 36; b += a * 51 & 52 ? (a ^ 15 ? 8 ^ Math.random() * (a ^ 20 ? 16 : 4) : 4).toString(16) : '-'); return b }

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

var client_uuid = localStorage.getItem("client_uuid") || uuid4();
try {
    localStorage.setItem("client_uuid", client_uuid);
} catch (e) {
    void(0);
}

var room_uuid = localStorage.getItem("room_uuid") || null;

var listFetchDate = {
    date: new Date(),
    update: function (lastDate) {
        let currntDate = new Date();

        if (lastDate) {
            listFetchDate.date = lastDate;
        }

        let dateString = listFetchDate.date.toLocaleTimeString("en-US", { hour12: false });
        let secsFromLastUpdate = ((currntDate.getTime() - listFetchDate.date.getTime()) / 1000) | 0;

        if (secsFromLastUpdate < 4) {
            dateString = "たった今";
        } else if (secsFromLastUpdate < 14) {
            dateString = "10 秒前…";
        } else if (secsFromLastUpdate < 64) {
            dateString = ((secsFromLastUpdate + 4) / 10 | 0) * 10 + " 秒前…";
        }

        document.getElementById("last-update-date").textContent = "最終更新: " + dateString;
    }
}

window.setInterval(listFetchDate.update, 1000);

var socketEvent = new EventTarget();
socketEvent.history = [];
socketEvent.isReady = false;

socketEvent.ready = function () {
    socketEvent.isReady = true;
    socketEvent.proxy({
        drain: true
    });
}

socketEvent.proxy = function (detail = {
    eventName: '',
    data: {},
    drain: false
}) {
    if (!detail.drain) {
        socketEvent.history.push({
            eventName: detail.eventName,
            data: detail.data
        })
    }

    if (socketEvent.isReady) {
        // Vue is ready
        for (let i = socketEvent.history.length; i--;) {
            const entry = socketEvent.history.shift()

            const event = new CustomEvent(entry.eventName, {
                detail: entry.data
            });

            socketEvent.dispatchEvent(event);
        }
        listFetchDate.update(new Date());
    }
}

// Socket ---------------------------------------------------
socket.on("created", function (data) {
    socketEvent.proxy({
        eventName: "created",
        data: data
    });
});

socket.on("updated", function (data) {
    socketEvent.proxy({
        eventName: "updated",
        data: data
    });
});

socket.on("accepted", function (message) {
    socketEvent.proxy({
        eventName: "accepted",
        data: message
    })
});

socket.on("alert_message", function (message) {
    socketEvent.proxy({
        eventName: "alert_message",
        data: message
    })
});

socket.on("pong", function (ms) {
    socketEvent.proxy({
        eventName: "pong",
        data: ms
    })
});
