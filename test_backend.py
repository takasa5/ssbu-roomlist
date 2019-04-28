import pytest

from flask import Flask, url_for
from flask_socketio import SocketIO, emit

import app

@pytest.fixture
def client():
    """socketioなしのクライアント"""
    app.app.config["TESTING"] = True
    client = app.app.test_client()
    return client

@pytest.fixture
def s_client():
    """socketioありのクライアント"""
    app.app.config["TESTING"] = True
    client = app.socketio.test_client(app.app)
    return client


def test_client(client):
    rv = client.get('/')
    assert 'とし部屋'.encode('utf-8') in rv.data

def create_room(cl,
        icon="/img",
        power=400,
        id="TEST1",
        passwd="4545",
        style="1on1",
        stock=4,
        rule="ストック制",
        time="3分",
        ic="無/無",
        stage="終点化",
        custom="on",
        overview="",
        change="負け抜け1人",
        member=1,
        capacity=4,
        deadline="",
        editpass="passwd",
        id_edit=False,
        new_id="",
        cast="allow",
        cast_url="",
        url_edit=False,
        new_url=""
        ):
    cl.get_received()
    cl.emit("create", "uuid", {
        "icon": icon,
        "power": power,
        "id": id,
        "pass": passwd,
        "style": style,
        "stock": stock,
        "rule": rule,
        "time": time,
        "ic": ic,
        "stage": stage,
        "custom": custom,
        "overview": overview,
        "change": change,
        "member": member,
        "capacity": capacity,
        "deadline": deadline,
        "editpass": editpass,
        "id_edit": id_edit,
        "new_id": new_id,
        "cast": cast,
        "cast_url": cast_url,
        "url_edit": url_edit,
        "new_url": new_url
    })
    received = cl.get_received()
    # emit("create")後に返ってくるemit [accepted, created]が入るはず
    return received

def test_create_room(s_client):
    received = create_room(s_client)
    assert len(received) == 2
    assert received[0]["name"] == "accepted"
    assert received[1]["name"] == "created"

    # 別クライアントから部屋の存在を確認
    # TODO
    
def test_update_room_with_correct_passwd(s_client):
    received = create_room(s_client)
    assert len(received) == 2
    assert received[0]["name"] == "accepted"
    assert received[1]["name"] == "created"
    room_uuid = received[0]["args"][0]["room_uuid"]
    member = int(received[1]["args"][0]["member"]) + 1
    # パスもユーザUUIDも正しい場合
    s_client.get_received()
    s_client.emit("update",
        "passwd",
        "uuid",
        room_uuid,
        {
            "member": member    
        }
    )
    received = s_client.get_received()
    assert len(received) == 1
    assert received[0]["name"] == "updated"
    # 別クライアントだがパスワードは正しい場合
    client2 = app.socketio.test_client(app.app)
    client2.get_received()
    client2.emit("update",
        "passwd",
        "differentuuid",
        room_uuid,
        {
            "member": member
        }
    )
    received = client2.get_received()
    assert len(received) == 1
    assert received[0]["name"] == "updated"

def test_update_room_with_different_passwd(s_client):
    received = create_room(s_client)
    assert len(received) == 2
    assert received[0]["name"] == "accepted"
    assert received[1]["name"] == "created"
    room_uuid = received[0]["args"][0]["room_uuid"]
    member = int(received[1]["args"][0]["member"]) + 1
    # 同一クライアントは同一UUIDを持つ
    s_client.get_received()
    s_client.emit("update",
        "differentpasswd",
        "uuid",
        room_uuid,
        {
            "member": member    
        }
    )
    received = s_client.get_received()
    # ユーザUUIDから判別しアップデートに成功する
    assert len(received) == 1
    assert received[0]["name"] == "updated"

    # 別クライアントはユーザUUIDが異なる
    client2 = app.socketio.test_client(app.app)
    client2.get_received()
    client2.emit("update",
        "differentpasswd",
        "differentuuid",
        room_uuid,
        {
            "member": member
        }
    )
    received = client2.get_received()
    assert len(received) == 1
    assert received[0]["name"] == "alert_message"

def test_update_cast(s_client):
    received = create_room(s_client)
    assert len(received) == 2
    assert received[0]["name"] == "accepted"
    assert received[1]["name"] == "created"
    room_uuid = received[0]["args"][0]["room_uuid"]
    # 立てた人がそのまま編集
    s_client.get_received()
    s_client.emit("update_cast",
        "passwd",
        "uuid",
        room_uuid,
        "cast_url",
        "https://cavelis.net/live/test"    
    )
    received = s_client.get_received()
    assert len(received) == 1
    assert received[0]["name"] == "updated"
    # 立てた人以外が編集
    client2 = app.socketio.test_client(app.app)
    client2.get_received()
    client2.emit("update_cast",
        "",
        "differentuuid",
        room_uuid,
        "cast_url",
        "https://cavelis.net/live/test"
    )
    received = client2.get_received()
    assert len(received) == 1
    assert received[0]["name"] == "updated"
    # 無効なURL
    client2.get_received()
    client2.emit("update_cast",
        "",
        "differentuuid",
        room_uuid,
        "cast_url",
        "https://example.com"
    )
    received = client2.get_received()
    assert len(received) == 1
    assert received[0]["name"] == "alert_message"

def test_update_cast_filled_url(s_client):
    """立てた人が既に配信URLを入れていた場合のテスト"""
    received = create_room(
        s_client,
        cast_url="https://cavelis.net/live/test"
    )
    assert len(received) == 2
    assert received[0]["name"] == "accepted"
    assert received[1]["name"] == "created"
    room_uuid = received[0]["args"][0]["room_uuid"]
    # 立てた人による更新
    s_client.get_received()
    s_client.emit("update_cast",
        "passwd",
        "uuid",
        room_uuid,
        "cast_url",
        "https://cavelis.net/live/updated"    
    )
    received = s_client.get_received()
    assert len(received) == 1
    assert received[0]["name"] == "updated"
    # 別クライアントからパスワード未記入の編集
    client2 = app.socketio.test_client(app.app)
    client2.get_received()
    client2.emit("update_cast",
        "",
        "differentuuid",
        room_uuid,
        "cast_url",
        "https://cavelis.net/live/updated"
    )
    received = client2.get_received()
    assert len(received) == 1
    assert received[0]["name"] == "alert_message"
    assert "あなたが部屋の登録者" in received[0]["args"][0]
    # 別クライアントからパスワード不一致の編集
    client2.get_received()
    client2.emit("update_cast",
        "differentpasswd",
        "differentuuid",
        room_uuid,
        "cast_url",
        "https://cavelis.net/live/updated"
    )
    received = client2.get_received()
    assert len(received) == 1
    assert received[0]["name"] == "alert_message"
    assert "あなたが部屋の登録者" not in received[0]["args"][0]
    # 別クライアントからパスワード一致の更新
    client2.get_received()
    client2.emit("update_cast",
        "passwd",
        "differentuuid",
        room_uuid,
        "cast_url",
        "https://cavelis.net/live/updated"     
    )
    received = client2.get_received()
    assert len(received) == 1
    assert received[0]["name"] == "updated"

def test_delete_room(s_client):
    received = create_room(s_client)
    assert len(received) == 2
    assert received[0]["name"] == "accepted"
    assert received[1]["name"] == "created"
    room_uuid = received[0]["args"][0]["room_uuid"]
    # パスワードの正しい同一クライアント
    s_client.get_received()
    s_client.emit("delete",
        "passwd",
        "uuid",
        room_uuid
    )
    received = s_client.get_received()
    assert len(received) == 2
    assert received[0]["name"] == "accepted"
    assert received[0]["args"][0]["room_removed"] is True
    assert received[1]["name"] == "updated"

    received = create_room(s_client)
    assert len(received) == 2
    assert received[0]["name"] == "accepted"
    assert received[1]["name"] == "created"
    room_uuid = received[0]["args"][0]["room_uuid"]
    # パスワードの正しくない同一クライアント
    s_client.get_received()
    s_client.emit("delete",
        "differentpasswd",
        "uuid",
        room_uuid    
    )
    received = s_client.get_received()
    assert len(received) == 2
    assert received[0]["name"] == "accepted"
    assert received[0]["args"][0]["room_removed"] is True
    assert received[1]["name"] == "updated"

    received = create_room(s_client)
    assert len(received) == 2
    assert received[0]["name"] == "accepted"
    assert received[1]["name"] == "created"
    room_uuid = received[0]["args"][0]["room_uuid"]
    # パスワードの正しい別クライアント
    client2 = app.socketio.test_client(app.app)
    client2.get_received()
    client2.emit("delete",
        "passwd",
        "differentuuid",
        room_uuid
    )
    received = client2.get_received()
    assert len(received) == 2
    assert received[0]["name"] == "accepted"
    assert received[0]["args"][0]["room_removed"] is True
    assert received[1]["name"] == "updated"

    received = create_room(s_client)
    assert len(received) == 2
    assert received[0]["name"] == "accepted"
    assert received[1]["name"] == "created"
    room_uuid = received[0]["args"][0]["room_uuid"]
    # パスワードの正しくない別クライアント
    client2.get_received()
    client2.emit("delete",
        "differentpasswd",
        "differentuuid",
        room_uuid
    )
    received = client2.get_received()
    assert len(received) == 1
    assert received[0]["name"] == "alert_message"