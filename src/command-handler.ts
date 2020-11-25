import { Collection } from "discord.js";

import fs from "fs";
import colors from "colors";
import BaseCommand from "./structures/base-command";

const PathToCmds = `${module.path}/cmds`; // Relative to client.ts

const commands = new Collection<string, BaseCommand>();
const categories = new Collection<string, string[]>();

class CommandHandler {
    public isCommandsLoaded: boolean;

    constructor() {
        this.isCommandsLoaded = false;
        this.loadCmds();
    }

    public async loadCmds() {
        let counter = 0;
        for(const category of fs.readdirSync(PathToCmds)) {
            console.log(colors.cyan(`Loading ${category} commands!`));
            const files = fs.readdirSync(`${PathToCmds}/${category}/`).filter(f => f.split(".").pop() == "js");
            counter += files.length;

            const cmdNames: string[] = [];

            files.forEach((v, i, a) => a[i] = v.split(".").shift());
            
            for(const file of files) {
                const cmd = loadCmd(`${PathToCmds}/${category}/${file}`);
                cmdNames.push(cmd.name);
            }
            categories.set(category, cmdNames);
            console.log(colors.cyan(`Successfully loaded ${category} commands!\n`));
        }
        console.log(colors.green.bold(`Successfully loaded all the ${counter} commands!\n`));
        this.isCommandsLoaded = true;
    }

    public reloadCmd(cmdName: string): Promise<string> {
        const promise = new Promise<string>((resolve, reject) => {
            if(!this.isCommandsLoaded) reject("Commands must be loaded to be able to use this function!");
            if(commands.has(cmdName)) {
                loadCmd(commands.get(cmdName).pathToCmd);
            }
            resolve("Done!");
        });
        return promise;
    }

    public get categories(): Promise<typeof categories> {
        const promise = new Promise<typeof categories>((resolve, reject) => {
            if(!this.isCommandsLoaded) reject("Commands must be loaded to be able to use this function!");
            resolve(categories);
        });
        return promise;
    }

    public get commands(): Promise<typeof commands> {
        const promise = new Promise<typeof commands>((resolve, reject) => {
            if(!this.isCommandsLoaded) reject("Commands must be loaded to be able to use this function!");
            resolve(commands);
        });
        return promise;
    }
}

export default CommandHandler;

function loadCmd(path: string): BaseCommand {
    delete require.cache[require.resolve(path)];

    //        [0]/ [1]/[2]/[3]
    // example ./cmds/dev/eval.ts
    const file = path.split("/").pop();

    const cmd: BaseCommand = require(path).default;
    cmd.pathToCmd = path;

    console.log(colors.white(`${file} loaded!`));

    commands.set(cmd.name, cmd);
    return cmd;
}