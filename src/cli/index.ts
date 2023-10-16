#!/usr/bin/env node

import { help } from "./help";
import { colors, error } from "../log";

const command = process.argv[2];

if (!command) {
  error("No command specified\n");
  help(2);
}

const commands = ["extract", "pack", "list", "help"];

if (!commands.includes(command)) {
  error(`Unknown command ${colors.bold(`"${command}"`)}\n`);
  help(2);
}
