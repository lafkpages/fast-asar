#!/usr/bin/env node

import { help } from "./help";
import { colors } from "../log";

const command = process.argv[2];

if (!command) {
  console.error(
    colors.red("error") + colors.gray(":"),
    "No command specified\n"
  );
  help(2);
}
