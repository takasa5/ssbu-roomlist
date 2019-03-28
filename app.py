import os
import uuid
import json
import urllib.request
import urllib.error
import hashlib
import datetime
from flask import Flask, render_template, url_for
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
    url = "https://discordapp.com/api/webhooks/560604859666268176/BQGxyKb7zIoa9bFC3zncEhWfKFTnxNWopnLUdhgBzbbx-pwSm_LFEM3DxynVjHLKWFMq"
    headers = {
        'Content-Type': 'application/json',
    }
    fields = [
        {
            "name": "乱闘形式",
            "value": data["style"],
            "inline": True
        },
        {
            "name": "ルール",
            "value": data["rule"],
            "inline": True
        },
        {
            "name": "制限時間",
            "value": data["time"],
            "inline": True
        },
        {
            "name": "アイテム",
            "value": data["ic"][0],
            "inline": True
        },
        {
            "name": "チャージ切り札",
            "value": data["ic"][2],
            "inline": True
        },
        {
            "name": "ステージ",
            "value": data["stage"],
            "inline": True
        },
        {
            "name": "入れ換え",
            "value": data["change"],
            "inline": True
        }
    ]
    if data["stock"]:
        fields.insert(2, {
            "name": "ストック",
            "value": data["stock"],
            "inline": True
        })
    content = {
        "username": "とし部屋通知",
        "avatar_url": url_for("static", filename="img/icon.jpg"),
        "content": "【ID】" + data["id"] + "\r【パス】" + data["pass"],
        "embeds": [
            {
                "color": int("800000", 16),
                "thumbnail": data["icon"],
                "fields": fields
            }
        ]
    }
    req = urllib.request.Request(url, data=json.dumps(content).encode("utf-8"), headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            body = res.read()
    except urllib.error.HTTPError as e:
        print(e)
    data["editpass"] = hashlib.sha256(data["editpass"].encode()).hexdigest()
    data["uuid"] = str(uuid.uuid4())
    data["start"] = datetime.datetime.now(JST).strftime('%H:%M')
    ROOM_LIST.append(data)
    emit("created", data, broadcast=True)

@socketio.on("update")
def update_room(password, uid, key, data):
    global ROOM_LIST
    room = [r for r in ROOM_LIST if r["uuid"] == uid][0]
    password = hashlib.sha256(password.encode()).hexdigest()
    if room["editpass"] != password:
        return
    room[key] = data
    emit("updated", ROOM_LIST, broadcast=True)

@socketio.on("delete")
def delete_room(password, uid):
    global ROOM_LIST
    room = [r for r in ROOM_LIST if r["uuid"] == uid][0]
    password = hashlib.sha256(password.encode()).hexdigest()
    if room["editpass"] != password:
        return
    rooms = [r for r in ROOM_LIST if r["uuid"] != uid]
    del ROOM_LIST
    ROOM_LIST = rooms
    emit("updated", ROOM_LIST, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True)