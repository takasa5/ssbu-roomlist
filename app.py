import os
import uuid
import hashlib
import datetime
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