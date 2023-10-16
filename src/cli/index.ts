#!/usr/bin/env node

import { help as showHelp } from "./help";
import { colors, error } from "../log";

import extract from "./commands/extract";
import pack from "./commands/pack";
import list from "./commands/list";
import help from "./commands/help";

const command = process.argv[2];

if (!command) {
  error("No command specified\n");
  showHelp(2);
}

const commands = {
  extract,
  pack,
  list,
  help,
};
type Command = keyof typeof commands;

if (!(command in commands)) {
  error(`Unknown command ${colors.bold(`"${command}"`)}\n`);
  showHelp(2);
}

commands[command as Command](...process.argv.slice(3));
