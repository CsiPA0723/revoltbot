import { Message, MessageEmbed } from "discord.js";
import got from "got";
import BaseCommand from "../../structures/base-command";
import { Prefix } from "../../settings.json";

class Cat implements BaseCommand {
    pathToCmd: string;

    mustHaveArgs = false;
    isDev = false;

    name = "cat";
    aliases = ["cica", "kitty"];
    desc = "Véletlenszerű cica gifek.";
    usage = `${Prefix}cat`;

    public async execute(message: Message) {
        try {
            const msg = await message.channel.send("Lekérés...");
            const link = "https://api.thecatapi.com/v1/images/search?mime_types=gif";
    
            const response = await got(link);
            const data = JSON.parse(response.body);
    
            const embed = new MessageEmbed()
                .setAuthor(message.author.tag, message.author.displayAvatarURL())
                .setDescription(`[LINK](${data[0].url})`)
                .setFooter("thecatapi.com")
                .setColor(message.guild.member(message.client.user).displayHexColor)
                .setImage(data[0].url);
    
            return message.channel.send({ embed: embed }).then(() => msg.delete());
        } catch (error) {
            return Promise.reject(error);
        }
    }
    
}

export default new Cat();