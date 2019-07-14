// node 向け fetch の実装
const fetch = require("node-fetch");

module.exports = ({ logger }) => {
    // 開発キーの読み込み
    const { CAVELIS_DEVKEY } = process.env;

    if (typeof CAVELIS_DEVKEY === "undefined") {
        logger.warn(
            0,
            "Not fatal: CAVELIS_DEVKEY is not defined.\nStream title fetching is disabled."
        );
    }

    // API の URL
    const apis = {
        cavelis: {
            live_url: "https://www.cavelis.net/api/live_url/",
            summary: "https://www.cavelis.net/api/summary"
        }
    };

    /**
     * URL から配信 ID を取得する。
     * @param {URL} url 配信の URL。
     * @returns {Promise.<string>} ID で満たされる Promise。
     */
    const getCavelisStreamId = async url => {
        // URL 中の ID
        const idInUrl = url.pathname.match(/^\/view\/([0-9A-Za-z]{32})/);

        // あれば返す。
        if (idInUrl) {
            return idInUrl[1];
        }

        // ないなら配信者名を探す
        const streamer = url.pathname.match(/^\/live\/(.+)/);

        // あれば
        if (streamer) {
            // ID を問い合わせる
            const api = apis.cavelis.live_url.concat(streamer[1]);
            const response = await fetch(api);

            // OK なら返す。
            if (response.ok) {
                const streamId = (await response.json()).stream_name;
                return streamId;
            }

            // OK じゃないならエラーを投げる。
            throw new Error(
                `Response is not OK, ${response.url}: ${response.status} ${response.statusText}`
            );
        }

        // 全部すり抜けた場合はエラーを投げる。
        throw new Error("Can't get stream ID");
    };

    /**
     * URL から配信タイトルを取得する。
     * @param {URL} url 配信の URL。
     * @returns {Promise.<string>} タイトルで満たされる Promise。
     */
    const getCavelisTitle = async url => {
        const id = await getCavelisStreamId(url);
        const api = apis.cavelis.summary.concat(`?devkey=${CAVELIS_DEVKEY}`, `&stream_name=${id}`);

        const response = await fetch(api);

        if (response.ok) {
            const streamTitle = (await response.json()).title;
            return streamTitle;
        }

        const maskedUrl = response.url; // .replace(/devkey=[0-9A-Za-z]/, "devkey=*");
        throw new Error(
            `Response is not OK, ${maskedUrl}: ${response.status} ${response.statusText}`
        );
    };

    /**
     * 配信 URL から配信タイトルを取得する。
     * @param {String} bareUrl 対象の URL。
     * @returns {Promise.<string>} タイトルで満たされる Promise。
     */
    const getTitle = async bareUrl => {
        if (typeof CAVELIS_DEVKEY === "undefined") {
            throw new Error("Stream title fetching is disabled.");
        }

        const url = new URL(bareUrl);

        if (url.hostname.endsWith("cavelis.net")) {
            const title = await getCavelisTitle(url);
            return title;
        }

        throw new Error("Unknown streaming service");
    };

    return { getTitle };
};
