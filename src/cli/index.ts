#!/usr/bin/env node

import { help } from "./help";
import { error } from "../log";

const command = process.argv[2];

if (!command) {
  error("No command specified\n");
  help(2);
}
