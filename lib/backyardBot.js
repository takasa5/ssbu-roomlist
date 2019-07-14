const EventEmitter = require("events");
const Discord = require("discord.js");

module.exports = ({ logger }) => {
    const { BACKYARD_BOT_TOKEN } = process.env;

    if (typeof BACKYARD_BOT_TOKEN === "undefined") {
        logger.warn(0, "Not fatal: BACKYARD_BOT_TOKEN is not defined.\nDiscord bot is disabled.");
    }

    const bot = new Discord.Client();
    const moduleEvents = new EventEmitter();

    const commands = ["help", "kill", "edit", "pin", "unpin", "log"];

    const showHelp = channel => {
        channel.send(`Usage:
    <@${bot.user.id}> help -- print this help
    <@${bot.user.id}> log level *NEW_LEVEL* -- change log level
    <@${bot.user.id}> log export -- export log to txt
    <@${bot.user.id}> log export flush -- export log to txt then clear log buffer
    <@${bot.user.id}> pin *MESSAGE* -- pin admin message
    <@${bot.user.id}> unpin -- remove pinned message
    <@${bot.user.id}> kill *ROOM_ID* -- kill room *ROOM_ID*
    <@${bot.user.id}> edit *ROOM_ID* *KEY*=*VALUE*... -- edit room property **BE CAREFUL!**`);
    };

    moduleEvents.on("help", showHelp);

    bot.on("ready", () => {
        logger.log(0, "Discord bot connected to discord.");
    });

    bot.on("message", message => {
        if (!message.isMemberMentioned(bot.user) || message.author.bot) {
            return;
        }

        const subject = message.content.replace(/(?<!\\)<[^>]+>/, "").trim();

        logger.debug(0, `Got message: ${subject}`);

        for (const command of commands) {
            if (subject.startsWith(command)) {
                const options = subject
                    .slice(command.length)
                    .split(/\s/)
                    .filter(Boolean);

                logger.debug(0, `Got ${command} with options: ${options.join(", ")}`);

                moduleEvents.emit(command, message.channel, ...options);

                return;
            }
        }

        showHelp(message.channel);
    });

    if (typeof BACKYARD_BOT_TOKEN !== "undefined") {
        bot.login(BACKYARD_BOT_TOKEN);
    }

    logger.log(0, "Discord bot is ready.");

    return moduleEvents;
};
