#!/usr/bin/env node

import { help } from "./help";
import { colors, error } from "../log";

import extract from "./commands/extract";
import list from "./commands/list";

const command = process.argv[2];

if (!command) {
  error("No command specified\n");
  help(2);
}

const commands = {
  extract,
  pack: console.log, // TODO
  list,
  help: console.log, // TODO
};
type Command = keyof typeof commands;

if (!(command in commands)) {
  error(`Unknown command ${colors.bold(`"${command}"`)}\n`);
  help(2);
}

commands[command as Command](...process.argv.slice(3));
