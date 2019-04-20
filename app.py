import os
from uuid import uuid4
import json
import requests
import hashlib
import datetime
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from html import escape
from urllib.parse import urlparse


class CustomFlask(Flask):
    jinja_options = Flask.jinja_options.copy()
    jinja_options.update(dict(
        variable_start_string='[(',
        variable_end_string=')]'
    ))


app = CustomFlask(__name__)
app.secret_key = os.urandom(24)
socketio = SocketIO(app)
ROOM_LIST = []
ROOM_AUTHORS = {}
JST = datetime.timezone(datetime.timedelta(hours=+9), 'JST')
HTTP_PREFIXES = (
    "http",
    "https"
)
ALLOWED_CASTS = (
    "youtube.com",
    "youtu.be",
    "cavelis.net",
    "twitch.tv",
)


def check_cast_url(url):
    parsed_url = urlparse(url)
    if (parsed_url.scheme.lower().startswith(HTTP_PREFIXES)
            and parsed_url.netloc.lower().endswith(ALLOWED_CASTS)):
        return True
    else:
        return False


def is_filled_str(string):
    if type(string) == str and string.strip():
        return True
    else:
        return False


@app.route('/')
def index():
    return render_template(
        'index.html',
        currentRooms=ROOM_LIST,
        lastUpdate=datetime.datetime.now(JST).strftime('%X')
    )


@app.route('/history')
def history():
    return render_template('history.html')


@app.route('/howto')
def howto():
    return render_template('howto.html')


@socketio.on("create")
def add_room(client_uid, data):
    if ("cast_url" in data and is_filled_str(data["cast_url"])
            and not check_cast_url(data["cast_url"])):
        # Failed the check
        data["cast_url"] = ""
        emit("alert_message", "許可されていないURLが含まれています")

    sanitized_data = {}
    for key in data:
        if type(data[key]) == str:
            sanitized_data[key] = escape(data[key])
        else:
            sanitized_data[key] = data[key]

    # notification to discord
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
        "content": "【ID】" + data["id"]
        + "\r【パス】" + data["pass"],
        "embeds": [
            {
                "description": data["overview"],
                "color": int("800000", 16),
                "thumbnail": {
                    "url": data["icon"]
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
    sanitized_data["room_uuid"] = str(uuid4())
    sanitized_data["start"] = datetime.datetime.now(JST).strftime('%H:%M')
    ROOM_LIST.append(sanitized_data)
    ROOM_AUTHORS.update({sanitized_data["room_uuid"]: client_uid})
    emit("accepted", {"room_uuid": sanitized_data["room_uuid"]})
    emit("created", sanitized_data, broadcast=True)


@socketio.on("update")
def update_room(password, client_uid, room_uid, data):
    global ROOM_LIST
    room = [r for r in ROOM_LIST if r["room_uuid"] == room_uid][0]
    for key in data:
        if key in room:
            password = hashlib.sha256(password.encode()).hexdigest()
            if (room["editpass"] == password
                    or ROOM_AUTHORS[room_uid] == client_uid):
                room[key] = data[key]
                emit("updated", ROOM_LIST, broadcast=True)
            else:
                emit("alert_message", "パスワードが違います")


@socketio.on("update_cast")
def update_room_cast(client_uid, room_uid, key, data):
    global ROOM_LIST
    if key == 'cast_url' and is_filled_str(data) and check_cast_url(data):
        # Passed the check
        room = [r for r in ROOM_LIST if r["room_uuid"] == room_uid][0]
        room["cast_url"] = data
        emit("updated", ROOM_LIST, broadcast=True)
    elif is_filled_str(data):
        emit("alert_message", "許可されていないURLです")
    else:
        pass


@socketio.on("delete")
def delete_room(password, client_uid, room_uid):
    global ROOM_LIST
    room = [r for r in ROOM_LIST if r["room_uuid"] == room_uid][0]
    password = hashlib.sha256(password.encode()).hexdigest()
    if (room["editpass"] == password
            or ROOM_AUTHORS[room_uid] == client_uid):
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

        rooms = [r for r in ROOM_LIST if r["room_uuid"] != room_uid]
        del ROOM_LIST
        ROOM_LIST = rooms
        emit("accepted", {"room_removed": True})
        emit("updated", ROOM_LIST, broadcast=True)
    else:
        emit("alert_message", "パスワードが違います")


if __name__ == '__main__':
    socketio.run(app, debug=True)
