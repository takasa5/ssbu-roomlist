const uuid4 = require("./uuid4");
const checkTypes = require("./checkTypes");
const bitHash = require("./bitHash");

/*
    Object vs Map、どちらが高速？
    Tested on Node v12.4.0

    get object key x  1,124 ops/sec ±1.68% (99 runs sampled)
    get map key    x 23,910 ops/sec ±0.22% (99 runs sampled)

    set object key x   987 ops/sec ±1.76% (99 runs sampled)
    set map key    x 2,000 ops/sec ±0.15% (101 runs sampled)

    delete object key x 1,237 ops/sec ±1.72% (98 runs sampled)
    delete map key    x 4,666 ops/sec ±1.81% (98 runs sampled)
*/

/**
 * @typedef {Object.<string, any>} Room 部屋オブジェクト。
 */

/**
 * @typedef {String} PassHash "salt$hash"
 */

module.exports = ({ logger }) => {
    /**
     * 部屋を管理するための Map オブジェクト。
     * @type {Map.<string, Room>}
     */
    const rooms = new Map();

    /**
     * 部屋の内部データ。
     * モジュール外から読むことはできない。
     * @type {Map.<string, any>}
     */
    const roomSecrets = new Map();

    /**
     * 推奨されない編集パスワードの配列。
     * @type {String[]}
     */
    const commonPasswords = [
        "4545",
        "0721",
        "123",
        "0123",
        "1234",
        "a",
        "aa",
        "aaa",
        "aaaa",
        "ab",
        "abc"
    ];

    /**
     * 公開が許可されたキーの配列。
     * @type {String[]}
     */
    const allowedKeys = [
        "icon",
        "power",
        "id",
        "pass",
        "style",
        "stock",
        "rule",
        "time",
        "items",
        "fs_charge",
        "stage",
        "custom",
        "overview",
        "change",
        "member",
        "capacity",
        "deadline",
        "room_uuid",
        "cast",
        "cast_url",
        "cast_title",
        "id_edit",
        "url_edit",
        "new_id",
        "new_url"
    ];

    /**
     *  変換が必要なキー
     * @type {Object.<string, function>}
     */
    const formatKeys = {
        id: id => id.toUpperCase(),
        id_edit: () => false,
        url_edit: () => false,
        new_id: () => "",
        new_url: () => ""
    };

    // モジュールからエクスポートするオブジェクト。
    return {
        /**
         * 部屋の一覧を返す Getter。
         * @returns {Array} 部屋の一覧の Array。
         */
        get list() {
            return [...rooms.values()];
        },
        /**
         * ID と一致する最初の部屋を登録された部屋の中から検索する。
         * @param {String} roomId 部屋の ID。
         * @returns {String} 見つかれば部屋の UUID、見つからなければ undefined。
         */
        getRoomById(roomId) {
            for (const [roomUuid, room] of rooms) {
                if (room.id.toUpperCase() === roomId.toUpperCase()) {
                    return roomUuid;
                }
            }

            return undefined;
        },
        /**
         * 部屋を作成する非同期関数。
         * @param {String} clientUuid クライアントの UUID。
         * @param {Room} data 立てる部屋の Object。
         * @returns {Promise} サニタイズされた部屋の Object で満たされる Promise。
         */
        async create(clientUuid, data) {
            checkTypes("string", clientUuid);
            checkTypes("object", data);

            // サニタイズしたデータのコンテナー。
            const sanitizedData = {};

            // パスワードチェック
            if (commonPasswords.includes(data.editpass)) {
                const error = new Error();
                error.name = "PasswordError";
                error.message = `The password "${data.editpass}" is not allowed.`;

                throw error;
            }

            logger.debug(2, `Got data: ${JSON.stringify(data)}`);

            // データのサニタイズ
            for (const [key, value] of Object.entries(data)) {
                if (allowedKeys.includes(key)) {
                    if (key in formatKeys) {
                        // 変換が必要なら変換
                        sanitizedData[key] = formatKeys[key](value);
                    } else {
                        sanitizedData[key] = value;
                    }
                } else {
                    logger.debug(3, `Key ignored: ${key}`);
                }
            }

            logger.log(2, `Creating room, ID:${sanitizedData.id}`);

            // uuid の登録
            let generatedRoomUuid; // 外側のスコープで初期化

            for (;;) {
                // uuid を作成
                generatedRoomUuid = uuid4();

                // 使用済でなければ追加する。
                if (!rooms.has(generatedRoomUuid)) {
                    sanitizedData.room_uuid = generatedRoomUuid;
                    break; // 決まったら抜ける。
                }
            }

            // 現在時間文字列の設定
            sanitizedData.start = new Date().toLocaleTimeString("fullwide", {
                // 日本時間
                timeZone: "Asia/Tokyo",
                // 24時間表記
                hour12: false,
                // 時 → 数字
                hour: "numeric",
                // 分 → 数字
                minute: "numeric"
            });

            // 内部データを作成
            const secrets = {
                author: clientUuid,
                passHash: bitHash.create(data.editpass)
            };

            logger.debug(2, `Password hash generated: ${secrets.passHash}`);

            // 配信があれば所有者として登録する。
            if (sanitizedData.cast_url) {
                secrets.cast_author = clientUuid;
                // 第三者による編集を封印
                sanitizedData.cast_sealed = true;
            }

            // 部屋を記録
            rooms.set(generatedRoomUuid, sanitizedData);

            // 内部データを登録
            roomSecrets.set(generatedRoomUuid, secrets);

            return sanitizedData;
        },
        /**
         * 部屋の情報を更新する非同期関数。
         * @param {String} password クライアントのパスワード。
         * @param {String} clientUuid クライアントの UUID。
         * @param {String} roomUuid 部屋の UUID。
         * @param {Room} data 更新を適用するキーの Object。
         * @returns {Promise} 更新されたキーのリスト。
         */
        async update(password, clientUuid, roomUuid, data) {
            // 型をチェック
            checkTypes("string", password, clientUuid, roomUuid);
            checkTypes("object", data);

            // 部屋を取得
            const room = rooms.get(roomUuid);
            const secrets = roomSecrets.get(roomUuid);

            // 部屋の存在を確認
            if (typeof room === "undefined") {
                throw new ReferenceError(`Can't access to room, UUID: ${roomUuid}`);
            }

            // パスワードチェック
            if (
                // NOT 第三者による配信編集
                !(
                    [...Object.keys(data)].length === 1 &&
                    "cast_url" in data &&
                    secrets.castAuthor !== secrets.author
                ) &&
                // NOT パスワードあるいはクライアントが一致
                !(clientUuid === secrets.author || bitHash.verify(password, secrets.passHash))
            ) {
                const error = new Error();
                error.name = "AuthenticationError";
                error.message = "Wrong password.";
                throw error;
            }

            // 更新されたキーを保存するためのオブジェクト
            const updatedKeys = {};

            logger.debug(2, `Updating room, ID: ${room.id}`);

            // キーをコピー
            for (const [key, value] of Object.entries(data)) {
                // キーをチェックし、更新が必要なら更新する
                if (
                    ((key !== "stock" && allowedKeys.includes(key)) ||
                        (key === "stock" && room.rule === "ストック制")) &&
                    room[key] !== value
                ) {
                    let newValue = value;

                    if (key in formatKeys) {
                        // 変換が必要なら変換
                        newValue = formatKeys[key](value);
                    }

                    // 更新を保存
                    updatedKeys[key] = {
                        before: room[key],
                        after: newValue
                    };

                    // キーを更新
                    room[key] = newValue;

                    // 配信に関するデータ
                    if (key === "cast_url" && value) {
                        // 配信者を登録
                        secrets.castAuthor = clientUuid;

                        // 配信が部屋主のものであるなら第三者による編集を封印
                        if (clientUuid === secrets.author) {
                            room.cast_sealed = true;
                        } else {
                            room.cast_sealed = false;
                        }
                    } else if (key === "cast_url" && !value) {
                        // URL が空なら初期化
                        room.cast_title = "";
                        room.cast_sealed = false;
                    }
                }
            }

            // 更新を返す
            return updatedKeys;
        },
        /**
         * 部屋を削除する非同期関数。
         * @param {String} password クライアントのパスワード。
         * @param {String} clientUuid クライアントの UUID。
         * @param {String} roomUuid 部屋の UUID。
         */
        async delete(password, clientUuid, roomUuid) {
            // 型をチェック
            checkTypes("string", password, clientUuid, roomUuid);

            // 部屋を取得
            const room = rooms.get(roomUuid);
            const secrets = roomSecrets.get(roomUuid);

            // 部屋の存在を確認
            if (typeof room === "undefined") {
                logger.warn(2, "Not fatal: Room seems to have been deleted.");
                throw new ReferenceError(`Can't access to room, UUID: ${roomUuid}`);
            }

            // パスワードのチェック
            if (clientUuid !== secrets.author && !bitHash.verify(password, secrets.passHash)) {
                const error = new Error();
                error.name = "AuthenticationError";
                error.message = "Wrong password.";
                throw error;
            }

            logger.debug(2, `Deleting room, ID: ${room.id}`);

            // 部屋の削除
            rooms.delete(roomUuid);
            roomSecrets.delete(roomUuid);

            // 削除した部屋を返す
            return room;
        },
        /**
         * ***!!使用注意!!***
         *
         * 部屋のプロパティを **チェックなしに** 書き換える。
         * @param {String} roomUuid 部屋の UUID。
         * @param {String} key 書き換えるキー。
         * @param {Any} value 書き換える内容。
         */
        async overwriteProperty(roomUuid, key, value) {
            // 型をチェック
            checkTypes("string", roomUuid, key);

            // 部屋を取得
            const room = rooms.get(roomUuid);

            // 部屋の存在を確認
            if (typeof room === "undefined") {
                throw new ReferenceError(`Can't access to room, UUID: ${roomUuid}`);
            }

            // 書き換える。
            room[key] = value;
        },
        /**
         * ***!!使用注意!!***
         *
         * 部屋を **確認なしに** 削除する。
         * @param {String} roomUuid 部屋の UUID。
         * @returns {Promise.<Room>}
         */
        async kill(roomUuid) {
            // 型をチェック
            checkTypes("string", roomUuid);

            // 部屋を取得
            const room = rooms.get(roomUuid);

            // 部屋の存在を確認
            if (typeof room === "undefined") {
                throw new ReferenceError(`Can't access to room, UUID: ${roomUuid}`);
            }

            logger.debug(2, `Killing room, ID: ${room.id}`);

            // 部屋の削除
            rooms.delete(roomUuid);
            roomSecrets.delete(roomUuid);

            // 削除した部屋を返す
            return room;
        }
    };
};
