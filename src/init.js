import clientData from "clientData";
import { debounce } from "throttle-debounce";

if (
    clientData.hostname === "localhost" ||
    clientData.hostname === "127.0.0.1" ||
    clientData.hostname === ""
) {
    window.socket = io("http://127.0.0.1:5000");
} else {
    window.socket = io.connect(
        `${window.location.protocol}//${document.domain}:${window.location.port}`
    );
}

window.addEventListener(
    "resize",
    debounce(300, () => new CustomEvent("slowResize") |> window.dispatchEvent)
);

const listFetchDate = {
    date: new Date(),
    update(lastDate) {
        const currentDate = new Date();

        if (lastDate) {
            listFetchDate.date = lastDate;
        }

        let dateString = listFetchDate.date.toLocaleTimeString("en-US", {
            hour12: false
        });

        const secsFromLastUpdate =
            ((currentDate.getTime() - listFetchDate.date.getTime()) / 1000) | 0;

        if (secsFromLastUpdate < 4) {
            dateString = "たった今";
        } else if (secsFromLastUpdate < 14) {
            dateString = "10 秒前…";
        } else if (secsFromLastUpdate < 64) {
            dateString = `${(((secsFromLastUpdate + 4) / 10) | 0) * 10} 秒前…`;
        }

        dateString = `最終更新: ${dateString}`;

        if (document.getElementById("last-update-date").textContent !== dateString) {
            document.getElementById("last-update-date").textContent = dateString;
        }
    }
};

window.setInterval(listFetchDate.update, 1000);

window.socketEvent = new EventTarget();
window.socketEvent.history = [];
window.socketEvent.isReady = false;

window.socketEvent.ready = () => {
    window.socketEvent.isReady = true;
    window.socketEvent.proxy({
        drain: true
    });
};

window.socketEvent.proxy = (
    detail = {
        eventName: "",
        data: {},
        drain: false
    }
) => {
    if (!detail.drain) {
        window.socketEvent.history.push({
            eventName: detail.eventName,
            data: detail.data
        });
    }

    if (window.socketEvent.isReady) {
        // Vue is ready

        window.socketEvent.history.forEach((entry, index, array) => {
            const event = new CustomEvent(entry.eventName, {
                detail: entry.data
            });

            window.socketEvent.dispatchEvent(event);

            if (index === array.length - 1) {
                window.socketEvent.history = [];
            }
        });

        listFetchDate.update(new Date());
    }
};

// Socket ---------------------------------------------------
window.socket.on("created", data => {
    window.socketEvent.proxy({
        eventName: "created",
        data
    });
});

window.socket.on("updated", data => {
    window.socketEvent.proxy({
        eventName: "updated",
        data
    });
});

window.socket.on("accepted", message => {
    window.socketEvent.proxy({
        eventName: "accepted",
        data: message
    });
});

window.socket.on("alert_message", message => {
    window.socketEvent.proxy({
        eventName: "alert_message",
        data: message
    });
});

window.socket.on("pong", ms => {
    window.socketEvent.proxy({
        eventName: "pong",
        data: ms
    });
});
