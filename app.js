// Node の標準サーバーライブラリ
const http = require("http");
// Polka サーバーのライブラリ
const polka = require("polka");
// 静的ファイルをキャッシュするためのミドルウェア
const serveStatic = require("serve-static");

// カスタムロガー
const logger = require("./lib/logger");
// とし部屋の Socket.IO アプリケーション
const ioApp = require("./lib/ioApp")({ logger });
// Discord から操作するための Bot
const backyardBot = require("./lib/backyardBot")({ logger });

// 拾ってないエラーのハンドリング
process.on("uncaughtException", (err, origin) => {
    logger.error(0, `Uncaught exception: ${err}\nOrigin: ${origin}`);
});

process.on("unhandledRejection", (reason, promise) => {
    logger.error(0, `Unhandled exception at: ${promise}\nReason: ${reason}`);
});

// backyardBot を紐付け
logger.bindBackyard(backyardBot);

logger.debug(0, "Modules loaded.");

// 環境変数の読み込み。const (定数) なので変更はできない。
const { PORT = 5000 } = process.env;

// Node サーバーを作成する。
const server = http.createServer();

logger.debug(0, "HTTP server created.");

// static フォルダから静的ファイルを読み込む。
const statics = serveStatic("static");

logger.debug(0, "Sirv instance created.");

// Polka のインスタンスを作成する。
polka({ server })
    // ミドルウェアをバインドする。
    .use(statics)
    // 指定ポートで listen 開始。err がある場合 err が投げられる。
    .listen(PORT, err => {
        if (err) logger.error(0, err);
        logger.log(0, `Running on *:${PORT}`);
    });

logger.debug(0, "Polka is ready.");

// アプリケーションを開始させる。
ioApp.start({ server, backyardBot });

logger.log(0, "Toshibeya successfully initialized.");
