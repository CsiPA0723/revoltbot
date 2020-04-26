const Discord = require("discord.js");
const api = "11720920-63b2-4eee-b141-f3304d747772";

const got = require('got');

/**
 * @param {Discord.Client} bot The bot itself.
 * @param {Discord.Message} message Discord message.
 * @param {Array<string>} args The message.content in an array without the command.
 */

module.exports.run = async (bot, message, args) => {
    let msg = await message.channel.send("Lekérés...");
    var link = `https://api.thedogapi.com/v1/images/search?mime_types=gif`;

    const response = await got(link);
    var data = JSON.parse(response.body);

    let embed = new Discord.MessageEmbed()
        .setAuthor(message.author.tag, message.author.displayAvatarURL())
        .setDescription(`[LINK](${data[0].url})`)
        .setFooter("thedogapi.com")
        .setColor(message.guild.member(bot.user).displayHexColor)
        .setImage(data[0].url);
    
    await message.channel.send({embed: embed});
    msg.delete();
}

module.exports.help = {
    cmd: "dog",
    alias: ["dogy", "kutyi"],
    name: "Kutyi gifek",
    desc: "Véletlenszerű kutyi gifek.",
    usage: ">dog",
    category: "felhasználói"
}