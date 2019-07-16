// Socket.io の公式ライブラリ
const socketio = require("socket.io");

module.exports = ({ logger }) => {
    // 部屋のコントローラー
    const rooms = require("./roomController")({ logger });
    // 配信の情報を取得するモジュール
    const fetchStream = require("./fetchStream")({ logger });
    // Discord に通知するためのモジュール
    const notify = require("./notify")({ logger });

    /*
    emit について
    io での呼び出し → 全員に通信する。
    socket での呼び出し → 通信を要求したソケットに1対1で通信する。

    broadcast について
    socket.broadcast.emit() で呼び出す。
    通信 socket "以外" の全てのソケットに通信する。
    */

    /**
     * Socket.IO アプリケーションを作成する。
     * @param {Server} server Socket.IO を作成する HTTP サーバー。
     */
    const start = ({ server, backyardBot }) => {
        // Socket.IO のインスタンスを作成。
        const io = socketio(server);

        logger.debug(0, "Socket.IO is ready.");

        /**
         * 配信のタイトルを取得し、反映する。
         * @param {String} castUrl 配信の URL。
         * @param {String} roomUuid 部屋の UUID。
         */
        const getTitle = async (castUrl, roomUuid) => {
            logger.debug(3, "Fetching stream...");

            // タイトルを取得
            fetchStream
                .getTitle(castUrl)
                .then(title => {
                    // 取得できたら取得したタイトルで上書き
                    rooms.overwriteProperty(roomUuid, "cast_title", title);
                    io.emit("updated", rooms.list);

                    logger.log(4, `Resolved stream title: ${title}`);
                })
                .catch(reason => {
                    // 取得できなかったらタイトル不明で上書き
                    rooms.overwriteProperty(roomUuid, "cast_title", "タイトル不明");
                    io.emit("updated", rooms.list);

                    logger.error(2, reason);
                    logger.error(0, "Failed to resolve stream title.");
                });
        };

        /**
         * クライアント上部にメッセージを表示する機能に関するオブジェクト。
         */
        const pinned = {
            value: "",
            /**
             * ピンされた文章をクライアントに送信する。
             * `line` が空でなければ内容を更新する。
             * @param {String} [line] 削除する場合は `""` を指定する。
             */
            update(line) {
                if (typeof line !== "undefined") {
                    this.value = line;
                }

                logger.debug(0, `Emitting "pin", message: ${this.value || "N/A"}`);
                io.emit("pin", this.value);
            }
        };

        // 以下イベントの処理
        io.on("connection", socket => {
            logger.debug(
                0,
                `New socket connected on ${socket.secure ? "https" : "http"}, ID: ${
                    socket.id
                }\n${socket.handshake.address.replace(/(?<=[0-9A-Za-z]+)[^.:]/g, "*")}, UA: ${
                    socket.handshake.headers["user-agent"]
                }`
            );

            // 部屋のリストを返答
            try {
                socket.emit("updated", rooms.list);
                logger.debug(1, "Room update sent.");
            } catch (reason) {
                logger.error(1, reason);
                logger.error(0, "Failed to send update.");
            }

            // ピンされたクライアンクライアントへのを返答
            try {
                pinned.update();
                logger.debug(1, "Pin status sent.");
            } catch (reason) {
                logger.error(1, reason);
                logger.error(0, "Failed to send pinned message.");
            }

            socket.on("disconnect", reason => {
                logger.debug(0, `Socket disconnected by ${reason}, ID: ${socket.id}`);
            });

            // 作成の要求
            socket.on("create", (clientUuid, data) => {
                logger.debug(1, 'Called event "create"');

                // 非同期で部屋を作成
                rooms
                    .create(clientUuid, data)
                    .then(async room => {
                        // 全体
                        io.emit("created", room);

                        // 呼び出し元に作成が通ったことを通知
                        socket.emit("accepted", {
                            room_uuid: room.room_uuid
                        });

                        logger.log(2, `Room created, ID: ${room.id}, UUID: ${room.room_uuid}`);

                        // 配信 URL が登録されている場合
                        if (room.cast_url) {
                            getTitle(room.cast_url, room.room_uuid);
                        }

                        // 通知を飛ばして終了。
                        notify.roomCreated(room);
                    })
                    .catch(reason => {
                        // パスワードでエラーが発生した場合、クライアントに通知する。
                        if (reason.name === "PasswordError") {
                            socket.emit(
                                "alert_message",
                                "そのパスワードは使用できません\n単純なパスワードは許可されていません。"
                            );
                        }

                        logger.error(2, reason);
                        logger.error(0, "Failed to create room.");
                    });
            });

            // 更新の要求
            socket.on("update", (password, clientUuid, roomUuid, data) => {
                logger.debug(1, 'Called event "update"');

                if (data.member >= 1 || !("member" in data)) {
                    // メンバーが 1 以上 あるいは変更なしなら更新
                    rooms
                        .update(password, clientUuid, roomUuid, data)
                        .then(updates => {
                            logger.debug(2, `Updated keys: ${JSON.stringify(updates)}`);

                            if ("cast_url" in updates) {
                                if (updates.cast_url) {
                                    // 配信 URL が更新されたらタイトルを取得
                                    getTitle(data.cast_url, roomUuid);
                                } else {
                                    // URL が falsy ならタイトルを空にする
                                    rooms.overwriteProperty(roomUuid, "cast_title", "");
                                }
                            } else {
                                // 更新されてないならただ返す
                                io.emit("updated", rooms.list);
                            }

                            // 呼び出し元に編集が通ったことを通知
                            socket.emit("accepted", {
                                room_uuid: roomUuid
                            });

                            // 通知を飛ばして終了。
                            notify.roomUpdated(data.id, updates);
                        })
                        .catch(reason => {
                            // 認証エラーならクライアントに通知する。
                            if (reason.name === "AuthenticationError") {
                                socket.emit("alert_message", "パスワードが違います。");
                            }

                            logger.error(2, reason);
                            logger.error(0, "Failed to update room.");
                        });
                } else if (data.member <= 0) {
                    // メンバーが 0 以下なら削除
                    rooms
                        .delete(password, clientUuid, roomUuid)
                        .then(room => {
                            // 全体
                            io.emit("updated", rooms.list);

                            // 呼び出し元に削除が通ったことを通知
                            socket.emit("accepted", {
                                room_removed: true
                            });

                            logger.log(2, `Room deleted, ID: ${room.id}`);

                            // 通知を飛ばして終了。
                            notify.roomDeleted(room.id);
                        })
                        .catch(reason => {
                            // 認証エラーならクライアントに通知する。
                            if (reason.name === "AuthenticationError") {
                                socket.emit("alert_message", "パスワードが違います。");
                            }

                            logger.error(2, reason);
                            logger.error(0, "Failed to delete room.");
                        });
                }
            });
        });

        // 以下 Discord bot のイベント
        // 部屋を消す
        backyardBot.on("kill", (channel, ...roomIds) => {
            if (typeof roomIds === "undefined") {
                backyardBot.emit("help", channel);
                return;
            }

            let killed = false;

            for (const roomId of roomIds) {
                const roomUuid = rooms.getRoomById(roomId);

                if (typeof roomUuid === "undefined") {
                    logger.error(0, `Emitted "kill" on unavailable room, ID: ${roomId}`);
                    channel.send(`No such room: ${roomId}`);
                } else {
                    killed = true;

                    logger.debug(1, `Killing room, UUID: ${roomUuid}...`);

                    rooms
                        .kill(roomUuid)
                        .then(room => {
                            logger.log(2, `Room killed, ID: ${room.id}`);
                            notify.roomDeleted(room.id);
                        })
                        .catch(reason => {
                            logger.error(2, reason);
                            logger.error(0, "Failed to kill room.");
                        });
                }
            }

            if (killed) {
                io.emit("updated", rooms.list);

                channel.send("Killed.");
            }
        });

        // 部屋を書き換える
        backyardBot.on("edit", (channel, roomId, ...properties) => {
            if (typeof properties === "undefined") {
                backyardBot.emit("help", channel);
                return;
            }

            const roomUuid = rooms.getRoomById(roomId);

            if (typeof roomUuid === "undefined") {
                logger.error(0, `Emitted "edit" on unavailable room, ID: ${roomId}`);
                return;
            }

            for (const property of properties) {
                const [key, value] = property.split(/(?<!\\)=/);

                if (typeof key === "undefined" || typeof value === "undefined") {
                    logger.log(0, `Failed to get property, property: ${property}`);
                } else {
                    logger.debug(0, `Updating property, ${key}: ${value}`);
                    rooms.overwriteProperty(roomUuid, key, value);
                }
            }

            io.emit("updated", rooms.list);

            channel.send("Updated.");
        });

        // メッセージを貼る
        backyardBot.on("pin", (channel, ...lines) => {
            console.log(lines);
            const message = lines.join("").trim();

            if (!message) {
                backyardBot.emit("help", channel);
                return;
            }

            pinned.update(message);

            logger.debug(0, `Pinned message: ${message}`);
            channel.send("Pinned.");
        });

        // メッセージを剥がす
        backyardBot.on("unpin", channel => {
            pinned.update("");

            logger.debug(0, "Unpinned message.");
            channel.send("Unpinned.");
        });
    };

    return { start };
};
