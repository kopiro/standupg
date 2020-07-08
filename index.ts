require("dotenv").config();
import fs from "fs";
import path from "path";
import moment from "moment";

import { main as mainGithub } from "./github";
import { main as mainCalendar, next as nextCalendar } from "./calendar";

export const now = moment();

export const todayStart = now.clone().startOf("day");
export const todayEnd = now.clone().endOf("day");
export const tomorrowStart = now.clone().add(1, "day").startOf("day");
export const tomorrowEnd = now.clone().add(1, "day").endOf("day");

console.log(todayStart.toISOString());

export const rnd = (els: Array<any>) =>
  els[Math.floor(Math.random() * els.length)];

async function main() {
  const msgToday = (await Promise.all([mainCalendar(), mainGithub()])).join(
    "\n"
  );

  const msgNext = (await Promise.all([nextCalendar()])).join("\n");

  const msg = ["# Today\n\n", msgToday, "\n\n\n", "# Next\n\n", msgNext].join(
    ""
  );
  process.stdout.write("\n\n");
  process.stdout.write(msg);
  process.stdout.write("\n\n");

  const outFile = path.join("out", `${now.format("YYYY-MM-DD")}.md`);
  fs.writeFileSync(outFile, msg);
}

main();
