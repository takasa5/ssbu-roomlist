let { LOG_LEVEL = 1 } = process.env;

if (Number.isNaN(LOG_LEVEL)) {
    LOG_LEVEL = 1;
} else {
    LOG_LEVEL = Math.max(LOG_LEVEL, 0);
}

// ja-JP は0埋めされない
const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Tokyo",
    hour12: false,
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
});

let logBuffer = "";

const prefix = indent => `[${formatter.format(new Date())}] ${" ".repeat(indent)}▶︎ `;

const join = (indent, ...args) =>
    args
        .join(" ")
        .split("\n")
        .join(`\n${" ".repeat(22 + indent)}`);

const loggerConstructor = (minLevel, native) => async (indent = 0, ...args) => {
    if (LOG_LEVEL >= minLevel) {
        const line = prefix(indent).concat(join(indent, args));
        native(line);
        logBuffer = logBuffer.concat(line, "\n");
    }
};

let backyardBot;
const logger = {
    debug: loggerConstructor(2, console.debug),
    log: loggerConstructor(1, console.log),
    info: loggerConstructor(0, console.info),
    warn: loggerConstructor(0, console.warn),
    error: loggerConstructor(0, console.error),
    bindBackyard(bot) {
        if (Object.is(backyardBot, bot)) {
            return;
        }

        backyardBot = bot;

        backyardBot.on("log", (channel, ...args) => {
            if (args[0] === "level") {
                const newLevel = Number.parseInt(args[1], 10);

                if (Number.isNaN(newLevel)) {
                    backyardBot.emit("help", channel);
                    return;
                }

                LOG_LEVEL = newLevel;

                logger.info(0, `--- UPDATED LOG LEVEL: ${LOG_LEVEL} ---`);

                channel.send("Updated log level.");
            } else if (args[0] === "export") {
                channel.send({
                    files: [
                        {
                            attachment: Buffer.from(logBuffer, "utf-8"),
                            name: "log.txt"
                        }
                    ]
                });

                if (args[1] === "flush") {
                    logBuffer = "";
                    logger.info(0, "--- BUFFER CLEARED BY DISCORD BOT. ---");
                }
            } else {
                backyardBot.emit("help", channel);
            }
        });
    }
};

module.exports = logger;
