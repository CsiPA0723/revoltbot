import { Collection, Message } from "discord.js";
import { Prefix } from "./settings";
import colors from "colors";

export default class CommandHandler {
  public static commands = new Collection<string, Command>();
  public static categories = new Collection<string, string[]>();

  public static get(message: Message): { command: Command; args: string[]; } {
    const { commandName, args } = this.makeArgs(message, Prefix);
    const command = this.commands.get(commandName) || this.commands.find(c => c.aliases && c.aliases.includes(commandName));
    return { command, args };
  }

  private static makeArgs(message: Message, prefix: string): { commandName: string; args: string[]; } {
    const [commandName, ...args] = message.content.trim().slice(prefix.length).split(/\s+/g);
    return { commandName: commandName.toLowerCase(), args: args };
  }
}

export abstract class Command {
  public abstract name: string;
  public abstract aliases: string[];
  public abstract category: string;
  public abstract hasArgs: boolean;
  public abstract isDev: boolean;
  public abstract run(message: Message, args: string[]): Promise<void>;

  protected init(): void {
    CommandHandler.commands.set(this.name.toLowerCase(), this);
    const prev = CommandHandler.categories.get(this.category);
    CommandHandler.categories.set(this.category, prev && Array.isArray(prev) ? [...prev, this.name] : [this.name]);
    console.log(colors.cyan(`${this.name} command init finished!`));
  }
}