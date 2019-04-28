import os
from uuid import uuid4
import json
import requests
import datetime
import re
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
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
ROOM_SECRETS = {}
ALLOWED_KEYS = [
    "icon", "power", "id", "pass", "style", "stock", "rule",
    "time", "ic", "stage", "custom", "overview", "change",
    "member", "capacity", "deadline", "editpass", "id_edit", "room_uuid",
    "new_id", "cast", "cast_url", "url_edit", "new_url", "cast_title"
]
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


def get_cast_title(url):
    headers_json = {
        "content-type": "application/json",
    }
    parsed_url = urlparse(url)
    devkey = os.getenv('CAVELIS_DEVKEY')

    class GetCastError(Exception):
        pass

    def get_cavelis_id(path):
        match = re.search(r'([0-9A-Z]{32})', path)
        if match is not None:
            return match.group(1)
        else:
            try:
                match = re.search(r'/live/(.+)', path)
                if match is None:
                    raise GetCastError
                else:
                    user_name = match.group(1)
                    api_url = 'https://www.cavelis.net/api/live_url/' \
                              + user_name
                    res = requests.get(
                            api_url,
                            headers=headers_json,
                            timeout=6.5
                            )
                    print(res)
                    if res.status_code == 200:
                        json_dic = res.json()
                        stream_name = json_dic.get("stream_name")
                        if stream_name is None:
                            raise GetCastError
                        else:
                            return stream_name
                    elif res.status_code == 404:
                        return None
                    else:
                        raise GetCastError
            except (GetCastError, requests.Timeout):
                return None

    if (parsed_url.netloc.lower().endswith("cavelis.net")):
        # CaveTube の配信
        try:
            stream_name = get_cavelis_id(parsed_url.path)
            if not is_filled_str(stream_name):
                raise GetCastError
            api_url = 'https://www.cavelis.net/api/summary' \
                f'?devkey={devkey}&stream_name={stream_name}'
            res = requests.get(api_url, headers=headers_json, timeout=6.5)
            print(res)
            if res.status_code == 200:
                json_dic = res.json()
                stream_title = json_dic.get("title")
                if stream_title is None or not is_filled_str(stream_title):
                    raise GetCastError
                else:
                    return stream_title
            elif res.status_code == 404:
                return None
            else:
                raise GetCastError
        except (GetCastError, requests.Timeout):
            return url
    else:
        # タイトル取得未対応の配信
        return url


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
    global ROOM_LIST
    global ROOM_SECRETS
    global ALLOWED_KEYS

    sanitized_data = {}

    if "cast_url" in data and is_filled_str(data["cast_url"]):
        if check_cast_url(data["cast_url"]):
            # Passed the check
            sanitized_data["cast_title"] = get_cast_title(data["cast_url"])
        else:
            # Failed the check
            sanitized_data["cast_url"] = ""
            emit("alert_message", "許可されていないURLが含まれています")

    for key in data:
        if key in ALLOWED_KEYS:
            sanitized_data[key] = data[key]
        else:
            print("Key is not allowed:", key)

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
        headers=headers,
        timeout=6.5
    )
    print(res)

    sanitized_data["room_uuid"] = str(uuid4())
    sanitized_data["start"] = datetime.datetime.now(JST).strftime('%H:%M')
    ROOM_LIST.append(sanitized_data)
    ROOM_SECRETS[sanitized_data["room_uuid"]] = {}
    ROOM_SECRETS[sanitized_data["room_uuid"]]["author"] = client_uid
    ROOM_SECRETS[sanitized_data["room_uuid"]]["editpass"] = \
        sanitized_data["editpass"]
    if sanitized_data["cast_url"]:
        ROOM_SECRETS[sanitized_data["room_uuid"]]["cast_author"] = client_uid
    emit("accepted", {"room_uuid": sanitized_data["room_uuid"]})
    emit("created", sanitized_data, broadcast=True)


@socketio.on("update")
def update_room(password, client_uid, room_uid, data):
    global ROOM_LIST
    global ROOM_SECRETS
    try:
        room = [r for r in ROOM_LIST if r["room_uuid"] == room_uid][0]
        if (ROOM_SECRETS[room_uid]["editpass"] == password
                or ROOM_SECRETS[room_uid]["author"] == client_uid):
            for key in data:
                if key == "cast_url":
                    if (is_filled_str(data["cast_url"])
                            and data["cast_url"] != room.get("cast_url")
                            and check_cast_url(data["cast_url"])):
                        room["cast_url"] = data["cast_url"]
                        room["cast_title"] = get_cast_title(data["cast_url"])
                    else:
                        room["cast_url"] = ""
                        room["cast_title"] = ""
                elif key in ALLOWED_KEYS:
                    room[key] = data[key]
                else:
                    pass
            emit("updated", ROOM_LIST, broadcast=True)
        else:
            emit("alert_message", "パスワードが違います")
    except IndexError:
        pass


@socketio.on("update_cast")
def update_room_cast(password, client_uid, room_uid, key, data):
    # グローバル変数を宣言
    global ROOM_LIST
    global ROOM_SECRETS
    try:
        if key == 'cast_url' and is_filled_str(data) and check_cast_url(data):
            # チェックを通過
            room = [r for r in ROOM_LIST if r["room_uuid"] == room_uid][0]

            # 操作の内容を確認し問題があれば警告、問題がなければ実行する。
            if (
                # 部屋の登録者がURLを追加しており
                ROOM_SECRETS[room_uid].get("cast_author")
                == ROOM_SECRETS[room_uid]["author"]
                # 変更希望者は部屋の登録者ではなく
                    and client_uid != ROOM_SECRETS[room_uid]["author"]
                # パスワードも異なる場合
                    and password != ROOM_SECRETS[room_uid]["editpass"]
            ):
                # 警告をクライアントに表示する。
                if not is_filled_str(password):
                    # パスワードが空白の場合の警告
                    emit("alert_message", "部屋の登録者が追加したURLは上書きできません"
                         "あなたが部屋の登録者である場合は、部屋立てフォームにパスワードを入力後再度お試しください。")
                else:
                    # パスワードが空白ではない場合の警告
                    emit("alert_message", "部屋の登録者が追加したURLは上書きできません")

            else:
                # チェックを通過した場合、変更を行う。
                room["cast_url"] = data
                room["cast_title"] = get_cast_title(data)
                # アップデートされた一覧をブロードキャストする。
                emit("updated", ROOM_LIST, broadcast=True)

        elif is_filled_str(data):
            # チェックを通過しなかったけど何か書いてある場合
            emit("alert_message", "許可されていないURLです")  # 警告をクライアントに表示する。
        else:
            # チェックは通過しなかったし、何か書いてあるわけでもない場合
            pass  # なにもしない。
    except IndexError:
        pass


@socketio.on("delete")
def delete_room(password, client_uid, room_uid):
    global ROOM_LIST
    global ROOM_SECRETS
    room = [r for r in ROOM_LIST if r["room_uuid"] == room_uid]
    if room:
        if (ROOM_SECRETS[room_uid]["editpass"] == password
                or ROOM_SECRETS[room_uid]["author"] == client_uid):
            url = os.getenv("DISCORD_WEBHOOK")
            headers = {
                'Content-Type': 'application/json',
            }
            content = {
                "username": "とし部屋通知",
                "content": "ID:" + room[0]["id"] + "は解散しました",
                "embeds": [
                    {
                        "color": int("800000", 16),
                        "thumbnail": {
                            "url": room[0]["icon"]
                        }
                    }
                ]
            }
            res = requests.post(
                url,
                json.dumps(content),
                headers=headers,
                timeout=6.5
            )
            print(res)

            rooms = [r for r in ROOM_LIST if r["room_uuid"] != room_uid]
            del ROOM_LIST
            ROOM_LIST = rooms
            ROOM_SECRETS.pop(room_uid, None)
            emit("accepted", {"room_removed": True})
            emit("updated", ROOM_LIST, broadcast=True)
        else:
            emit("alert_message", "パスワードが違います")
    else:
        pass


@socketio.on("request_update")
def response_update():
    emit("updated", ROOM_LIST)


if __name__ == '__main__':
    socketio.run(app, debug=True)
