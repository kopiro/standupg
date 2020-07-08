require("dotenv").config();
import github from "./github";
import calendar from "./calendar";
import fs from "fs";
import path from "path";

export const now = new Date();
export const today = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate(),
  6,
  0,
  0
);
export const todayEnd = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate(),
  22,
  0,
  0
);

async function main() {
  const msg = await (await Promise.all([calendar(), github()])).join("\n\n");
  process.stdout.write(msg);

  const outFile = path.join(
    "out",
    `${now.getFullYear()}-${(1 + now.getMonth())
      .toString()
      .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}.txt`
  );

  fs.writeFileSync(outFile, msg);
}

main();
