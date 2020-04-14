const Discord = require('discord.js');
const bot = new Discord.Client();

const Functions = require('./functions.js');
const database = require('./database.js');
const daily = require('./daily.json');
const secSys = require('./sec-sys/regist');
const reactRoles = require('./reactroles');

const fs = require('fs');
const colors = require('colors/safe');

const dateFormat = require('dateformat');

const CONFIG = require('./config.json');
process.env.mode = CONFIG.mode;

const SETTINGS = require('./settings.json');
const MUTES = require('./mute.json');

const prefix = SETTINGS.Prefix;

bot.devPrefix = '#>';
bot.devId = "333324517730680842";
var devCommands = new Discord.Collection();


var commands = new Discord.Collection();
var aliasCmds = new Discord.Collection();

/** @type {Discord.Guild} */
var mainGuild;
/** @type {Discord.TextChannel} */
var logChannel;
/** @type {Discord.TextChannel} */
var welcomeChannel;
/** @type {Discord.TextChannel} */
var devLogChannel;

loadCmds("cmds");
loadCmds("dev-cmds");

bot.login(CONFIG.TOKEN).catch(console.error);

/** @param {number} timestamp */

bot.logDate = (timestamp) => {
    if(!timestamp) timestamp = Date.now();
    return dateFormat(timestamp, "yyyy-mm-dd | HH:MM:ss 'GMT'o");
}

var statuses = [">help", "Node.Js", "Made By CsiPA0723#0423", "Discord.js", "Better-Sqlite3"]

bot.on('ready', async () => {
    database.Prepare('currency');
    database.Prepare('wumpus');
    database.Prepare('warnedUsers');
    database.Prepare('warnings');
    database.Prepare('invitedMembers')
    database.Prepare('inviters')
    database.Prepare('invites')

    mainGuild = bot.guilds.get('572873520732831754');
    logChannel = mainGuild.channels.get(SETTINGS.modLogChannelId);
    welcomeChannel = mainGuild.channels.get(SETTINGS.welcomeMsgChannelId);
    devLogChannel = bot.guilds.get('427567526935920655').channels.get('647420812722307082');

    bot.mainGuild = mainGuild;
    bot.logChannel = logChannel;
    bot.devLogChannel = devLogChannel;

    console.log(colors.bold(`Revolt Bot READY! (${CONFIG.mode})`));
    logChannel.send(`\`ONLINE\` | \`MODE: ${CONFIG.mode}\``);
    
    bot.setInterval(() => {
        var status = statuses[Math.floor(Math.random() * statuses.length)];
        bot.user.setPresence({game : {name: status}, status: 'online'});
    }, 30000);

    bot.setInterval(() => {
        for(i in MUTES) {
            var mutedMember = MUTES[i];
            if(mutedMember.time < Date.now()) {
                var member = mainGuild.members.get(mutedMember.id);
                member.removeRole(SETTINGS.MuteRoleId);
                target.setMute(false).catch(console.error);
                delete MUTES[`${mutedMember.id}`];
                fs.writeFile("./mute.json", JSON.stringify(MUTES, null, 4), err => {
                    if(err) throw err;
                    console.log(`Unmuted ${member.displayName}`);
                    logChannel.send(`Unmuted ${member.displayName}`)
                });
            } else {
                member.addRole(SETTINGS.MuteRoleId);
                target.setMute(true).catch(console.error);
            }
        }
    }, 1000)
});

bot.on('presenceUpdate', async (oldMember, newMember) => CheckWumpus(newMember));

bot.on('messageReactionAdd', (messageReaction, user) => {
    secSys.CheckReaction(messageReaction, user);
    reactRoles.CheckNSFW(messageReaction, user);
});

bot.on('message', async message => {
    if(message.author.bot) return;
    if(message.channel.type === 'dm') return;

    secSys.CheckMsg(message);

    if(message.content.startsWith(`${prefix}:`)) return;

    if(message.content.startsWith(bot.devPrefix) && message.author.id === bot.devId) {
        const { command, args } = makeArgs(message, bot.devPrefix);
        if(command == "sh") {
            ShutdownCmds(message, command, args);
            return;
        }
        /**
         * @typedef {(bot: Discord.Client, message: Discord.Message, args: Array<string>)} run
         * 
         * @typedef {Object} help
         * @property {string} cmd
         * 
         * @typedef {Object} cmd
         * @property {run} run
         * @property {help} help
         */

        /** @type {cmd} */
        var cmd = devCommands.get(command);
        if(cmd) cmd.run(bot, message, args);

    } else if(message.content.startsWith(prefix)) {
        const { command, args } = makeArgs(message, prefix);

        var logMsg = `${message.member.displayName} used the ${command} in ${message.channel.name}.`;

        bot.commands = commands;
        bot.aliasCmds = aliasCmds;

        /**
         * @typedef {(bot: Discord.Client, message: Discord.Message, args: Array<string>)} run
         * 
         * @typedef {Object} help
         * @property {string} cmd
         * @property {Array<string>} alias
         * @property {string} name
         * @property {string} desc
         * @property {string} usage
         * @property {string} category
         * 
         * @typedef {Object} cmd
         * @property {run} run
         * @property {help} help
         */

        /** @type {cmd} */
        var cmd = commands.get(command) || commands.get(aliasCmds.get(command)) || commands.get("help");
        if(cmd) cmd.run(bot, message, args);

        console.log(colors.cyan(logMsg));
    }
});

/**
 * @param {Discord.Message} message 
 * @param {string} prefix
 * @returns {{command:string, args: Array<string>}}
 */

function makeArgs(message, prefix) {
    var messageArray = message.content.split(/ +/g);
    var args = [];
    var command = messageArray[0].toLowerCase().slice(prefix.length);
    if(!command && messageArray[1]) {
        command = messageArray[1].toLowerCase();
        args = messageArray.slice(2);
    } else args = messageArray.slice(1);

    return { command: command, args: args };
}

bot.on("guildMemberAdd", async member => {
    if(member.guild == mainGuild) {
        if(member.user.bot) member.addRole(SETTINGS.AutoBotRoleId);
    
        var logMsg = `${member.user.bot ? "\`BOT\`" : "\`User\`"}: ${member.displayName} (${member.id}) joined the server at \`${bot.logDate(member.joinedTimestamp)}\``;
    
        logChannel.send(logMsg);
    } else devLogChannel.send(logMsg);
    
    console.log(colors.green(logMsg.replace(/\`/g, "")));
});

bot.on("guildMemberRemove", async member => {
    var banEntry = await member.guild.fetchAuditLogs({type: 'MEMBER_BAN_ADD'}).then(audit => audit.entries.first());
    var kickEntry = await member.guild.fetchAuditLogs({type: 'MEMBER_KICK'}).then(audit => audit.entries.first());
    var pruneEntry = await member.guild.fetchAuditLogs({type: 'MEMBER_PRUNE'}).then(audit => audit.entries.first());

    var invData = database.GetData("invitedMembers", member.id);

    var text, reason = "N/A";
    if(banEntry && banEntry.target.id === member.id) {
        text = "was banned by " + member.guild.members.get(banEntry.executor.id).displayName;
        if(banEntry.reason) reason = banEntry.reason;
        invData.banned = 1;
    } else if(kickEntry && kickEntry.target.id === member.id) {
        text = "was kicked by " + member.guild.members.get(kickEntry.executor.id).displayName;
        if(kickEntry.reason) reason = kickEntry.reason;
        invData.kicked = 1;
    } else if (pruneEntry && pruneEntry.target.id === member.id) {
        text = "was pruned by" +  member.guild.members.get(pruneEntry.executor.id).displayName;
        if(pruneEntry.reason) reason = pruneEntry.reason;
        invData.pruned = 1;
    } else {
        text = "leaved the server";
        invData.left = 1;
    }

    database.SetData("invitedMembers", invData);

    var logMsg = `${member.user.bot ? "\`BOT\`" : "\`User\`"}: ${member.displayName} (Id:  \`${member.id}\`) ${text} at \`${bot.logDate()}\` | Reason: ${reason}`;

    if(member.guild == mainGuild) logChannel.send(logMsg);
    else devLogChannel.send(logMsg);
    console.log(colors.red(logMsg.replace(/\`/g, "")));
});

process.on('uncaughtException', err => { errorHandling(err, "Uncaught Exception") });

process.on('unhandledRejection', err => { errorHandling(err, "Unhandled Rejection") });

/**
 * @param {Error} err
 * @param {string} msg
 */

function errorHandling(err, msg) {
    if(logChannel) logChannel.send(`\`ERROR: ${msg}\`\n\`\`\`xl\n${clean(err)}\n\`\`\`\n\`SHUTTING DOWN\` | \`${bot.logDate()}\``).catch(console.error);
    console.error(err);
    bot.setTimeout(() => { bot.destroy() }, 2000);
}

function loadCmds(dir) {
    fs.readdir(`./${dir}/`, (err, files) => {
        if(err) console.error(`ERROR: ${err}`);

        var jsfiles = files.filter(f => f.split(".").pop() === "js");
        if(jsfiles.length <= 0) {
            console.log(colors.red("ERROR: No commands to load!"));
            return;
        }

        console.log(colors.cyan(`Loading ${jsfiles.length} bot commands! (${dir})`));

        jsfiles.forEach((f, i) => {
            delete require.cache[require.resolve(`./${dir}/${f}`)];
            var props = require(`./${dir}/${f}`);
            console.log(colors.white(`${i + 1}: ${f} loaded!`));
            if(dir == "dev-cmds") {
                devCommands.set(props.help.cmd, props);
            } else {
                commands.set(props.help.cmd, props);
                props.help.alias.forEach((name) => {
                    aliasCmds.set(name, props.help.cmd);
                });
            }
        });

        if(dir != "dev-cmds") {
            bot.commands = commands;
            bot.aliasCmds = aliasCmds;
        }

        console.log(colors.cyan(`Successfully loaded ${jsfiles.length} commands!`));
    });
}

/** @param {string} text */

function clean(text) {
    if (typeof(text) === "string") return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else return text;
}

/** @param {Discord.GuildMember} member Discord guild member */

function CheckWumpus(member) {
    var wumpusData = database.GetData('wumpus', member.id);
    if(!wumpusData.hasRole) {
        database.DeleteData('wumpus', member.id);
        delete wumpusData;
        return;
    }

    var currencyData = database.GetData('currency', member.id);
    
    if(member.roles.has(database.config.WumpusRoleId) && !wumpusData.perma) {
        var now = new Date(Date.now());
        var year = now.getFullYear();
        var month = now.getMonth();

        var MonthDateRange = Functions.GetMonthDateRange(year, month);
        if(parseInt(daily.EndOfTheMonthInMilliSeconds) < MonthDateRange.end) {
            daily.EndOfTheMonthInMilliSeconds = MonthDateRange.end;
            fs.writeFile("./daily.json", JSON.stringify(daily, null, 4), err => { if(err) throw err; });
        }
        if(wumpusData.roleTime < MonthDateRange.start + (database.config.DayInMilliSeconds * 2)) {
            if(currencyData.bits >= database.config.WumpusRoleCost) {
                currencyData.bits -= database.config.WumpusRoleCost;
                database.SetData('currency', currencyData);
                wumpusData.roleTime = MonthDateRange.end + database.config.DayInMilliSeconds;
                database.SetData('wumpus', wumpusData);
                if(!member.roles.has(database.config.WumpusRoleId)) member.addRole(database.config.WumpusRoleId);
            } else {
                database.DeleteData('wumpus', member.id);
                delete wumpusData;
                member.removeRole(database.config.WumpusRoleId, "Did not have enough bits.");
            }
        } else if(!member.roles.has(database.config.WumpusRoleId)) member.addRole(database.config.WumpusRoleId);
    } else if(!member.roles.has(database.config.WumpusRoleId)) member.addRole(database.config.WumpusRoleId);
}

/** 
 * @param {Discord.Message} message
 * @param {string} command 
 * @param {Array<string>} args 
 */

async function ShutdownCmds(message, args) {
    var reloads = ["reloadcmds", "reload", "r"];
    var shutdowns = ["shutdown", "shut", "s"];
    var updates = ["update", "upd", "up"];
    var restarts = ["restart", "res", "rs"];
    var switchmodes = ["switchmode", "switch", "sw"];

    var command = args[0];
    if(!command) return;
    var dir = args[1];

    if(reloads.includes(command)) {
        logChannel.send("\`Reloading commands\`");
        console.log("Reloading commands");
        var dirs = ["cmds", "dev-cmds"];
        if(dir && dirs.includes(dir)) {
            loadCmds(dir);
        } else {
            loadCmds("cmds");
            loadCmds("dev-cmds");
        }

        message.channel.send("Commands successfully reloaded!");
    } 
    else if(shutdowns.includes(command)) await shutdown(message, "Shutting down");
    else if(updates.includes(command)) await shutdown(message, "Updating");
    else if(restarts.includes(command)) await shutdown(message, "Restarting");
    else if(switchmodes.includes(command)) await shutdown(message, "Switching to mode: " + (CONFIG.mode == "development" ? "production." : "development."));
    else if(["twitch", "tw"].includes(command)) {
        if(CONFIG.mode === "production") return;
        //console.log("Reloading twitch webhook");
        delete require.cache[require.resolve('./twitch.js')];
        const twitch = require('./twitch.js');
        twitch.CheckSub();
    }
}

/** 
 * @param {Discord.Message} message
 * @param {string} text 
 */

async function shutdown(message, text) {
    await logChannel.send(`\`${text}\``);
    await message.channel.send(`\`${text}\``);
    console.log(text);
    await bot.destroy().catch(console.error);
    process.exit(0);
}