const fetch = require("node-fetch");
const humanizeKeys = require("./humanizeKeys");

module.exports = ({ logger }) => {
    const { DISCORD_WEBHOOK } = process.env;

    if (typeof DISCORD_WEBHOOK === "undefined") {
        logger.warn(
            0,
            "Not fatal: DISCORD_WEBHOOK is not defined.\nDiscord notifications are disabled."
        );
    }

    const embedOnCreated = [
        "power",
        "style",
        "rule",
        "time",
        "stock",
        "items",
        "fs_charge",
        "change",
        "stage"
    ];

    const noEmbedOnUpdated = ["icon", "member", "cast_url"];

    const JsonNotification = class {
        constructor(value) {
            this.username = value.username || "とし部屋 通知";
            this.content = value.content || "No content set";
            if (value.embeds) this.embeds = value.embeds;
        }
    };

    const postToDiscord = notification => {
        fetch(DISCORD_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(notification)
        })
            .then(
                /** @param {Response} response */
                async response => {
                    if (response.ok) {
                        logger.log(4, "Data posted to webhook.");
                        logger.debug(5, `Response: ${(await response.text()) || "No body."}`);
                    } else {
                        throw new Error(
                            `response from is not ok: ${response.status} ${
                                response.statusText
                            }\n${await response.text()}`
                        );
                    }
                }
            )
            .catch(reason => {
                logger.error(4, reason);
            });
    };

    const roomCreated = async room => {
        if (typeof DISCORD_WEBHOOK === "undefined") {
            return;
        }

        // ループを回して必要な Key/Value を取り出す
        const fields = [];

        for (const [key, value] of Object.entries(room)) {
            if (embedOnCreated.includes(key)) {
                try {
                    const readable = humanizeKeys.get(key);
                    const property = readable.toPrimitive(value);

                    // falsy ではないなら追加
                    if (property) {
                        fields.push({
                            name: readable.name,
                            value: property,
                            inline: true
                        });
                    }
                } catch (reason) {
                    logger.error(4, reason);
                }
            }
        }

        // Webhook に送る JSON の中身。
        const notification = new JsonNotification({
            content: `:new: 作成\n【ID】${room.id || "不明"}\n【PASS】${room.pass || "なし"}`,
            embeds: [
                {
                    description: room.overview,
                    color: 0x800000,
                    thumbnail: room.icon
                        ? { url: new URL(room.icon, "https://toshibeya-ssbu.herokuapp.com/") }
                        : undefined,
                    fields
                }
            ]
        });

        // リクエストを行う
        postToDiscord(notification);
    };
    const roomUpdated = async (roomId, updates) => {
        if (typeof DISCORD_WEBHOOK === "undefined") {
            return;
        }

        const notifies = [];

        for (const [key, history] of Object.entries(updates)) {
            if (!noEmbedOnUpdated.includes(key) && humanizeKeys.has(key)) {
                const readable = humanizeKeys.get(key);

                // 文字列変数の初期化
                const base = `【${readable.name}】`;
                let description;
                let before;
                let after;

                if (typeof history.before !== "undefined") {
                    // あるなら追加
                    before = readable.toPrimitive(history.before);
                }

                if (typeof history.after !== "undefined") {
                    // あるなら追加
                    after = readable.toPrimitive(history.after);
                }

                // 値が有効 (=falseではない)
                if (before !== false && after !== false) {
                    // 整形して追加
                    description = `${before || "*未設定*"} ▶︎ ${after || "*未設定*"}`;
                    notifies.push(`${base}${description}`);
                }
            }
        }

        // 通知するべきものがない
        if (notifies.length === 0) {
            logger.debug(4, "Nothing to notify.");
            return;
        }

        // ID は変更がなくても表示する
        if (!("id" in updates)) {
            notifies.unshift(`【ID】${roomId}`);
        }

        // 内容を作成
        const notification = new JsonNotification({
            content: `:pencil: 更新\n${notifies.join("\n")}`
        });

        // リクエストを行う
        postToDiscord(notification);
    };

    const roomDeleted = async roomId => {
        if (typeof DISCORD_WEBHOOK === "undefined") {
            return;
        }

        // 内容を作成
        const notification = new JsonNotification({
            content: `:wave: 解散\nID: ${roomId} は解散しました。`
        });

        // リクエストを行う
        postToDiscord(notification);
    };

    return { roomCreated, roomUpdated, roomDeleted };
};
