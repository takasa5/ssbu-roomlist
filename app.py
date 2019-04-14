import os
import uuid
import json
import requests
import hashlib
import datetime
from html import escape
from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.secret_key = os.urandom(24)
socketio = SocketIO(app)
ROOM_LIST = []
JST = datetime.timezone(datetime.timedelta(hours=+9), 'JST')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/history')
def history():
    return render_template('history.html')


@socketio.on("open")
def return_list():
    emit("return_list", ROOM_LIST)


@socketio.on("create")
def add_room(data):
    # notification to discord
    sanitized_data = {}
    for key in data:
        if type(data[key]) == str:
            sanitized_data[key] = escape(data[key])

    url = os.getenv("DISCORD_WEBHOOK")
    headers = {
        'Content-Type': 'application/json',
    }
    fields = [
        {
            "name": "乱闘形式",
            "value": sanitized_data["style"],
            "inline": True
        },
        {
            "name": "ルール",
            "value": sanitized_data["rule"],
            "inline": True
        },
        {
            "name": "制限時間",
            "value": sanitized_data["time"],
            "inline": True
        },
        {
            "name": "アイテム",
            "value": sanitized_data["ic"][0],
            "inline": True
        },
        {
            "name": "チャージ切り札",
            "value": sanitized_data["ic"][2],
            "inline": True
        },
        {
            "name": "ステージ",
            "value": sanitized_data["stage"],
            "inline": True
        },
        {
            "name": "入れ換え",
            "value": sanitized_data["change"],
            "inline": True
        }
    ]
    if sanitized_data["stock"]:
        fields.insert(2, {
            "name": "ストック",
            "value": sanitized_data["stock"],
            "inline": True
        })
    content = {
        "username": "とし部屋通知",
        # "avatar_url": url_for("static", filename="img/icon.jpg"),
        "content": "【ID】" + sanitized_data["id"] + "\r【パス】" + sanitized_data["pass"],
        "embeds": [
            {
                "description": sanitized_data["overview"],
                "color": int("800000", 16),
                "thumbnail": {
                    "url": sanitized_data["icon"]
                },
                "fields": fields
            }
        ]
    }
    res = requests.post(
        url,
        json.dumps(content),
        headers=headers
    )
    print(res)

    sanitized_data["editpass"] = hashlib.sha256(
        sanitized_data["editpass"].encode()).hexdigest()
    sanitized_data["uuid"] = str(uuid.uuid4())
    sanitized_data["start"] = datetime.datetime.now(JST).strftime('%H:%M')
    ROOM_LIST.append(sanitized_data)
    emit("created", sanitized_data, broadcast=True)


@socketio.on("update")
def update_room(password, uid, key, data):
    global ROOM_LIST
    room = [r for r in ROOM_LIST if r["uuid"] == uid][0]
    password = hashlib.sha256(password.encode()).hexdigest()
    if room["editpass"] != password:
        return
    room[key] = escape(data)
    emit("updated", ROOM_LIST, broadcast=True)


@socketio.on("delete")
def delete_room(password, uid):
    global ROOM_LIST
    room = [r for r in ROOM_LIST if r["uuid"] == uid][0]
    password = hashlib.sha256(password.encode()).hexdigest()
    if room["editpass"] != password:
        return

    url = os.getenv("DISCORD_WEBHOOK")
    headers = {
        'Content-Type': 'application/json',
    }
    content = {
        "username": "とし部屋通知",
        "content": "ID:" + room["id"] + "は解散しました",
        "embeds": [
            {
                "color": int("800000", 16),
                "thumbnail": {
                    "url": room["icon"]
                }
            }
        ]
    }
    res = requests.post(
        url,
        json.dumps(content),
        headers=headers
    )
    print(res)

    rooms = [r for r in ROOM_LIST if r["uuid"] != uid]
    del ROOM_LIST
    ROOM_LIST = rooms
    emit("updated", ROOM_LIST, broadcast=True)


if __name__ == '__main__':
    socketio.run(app, debug=True)
