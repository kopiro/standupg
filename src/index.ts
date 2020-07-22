import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { SDIR, todayStart, tomorrowStart } from "./utils";

dotenv.config({
  path: path.join(SDIR, "config"),
});

import { main as mainGithub } from "./mods/github";
import { main as mainCalendar, next as nextCalendar } from "./mods/calendar";

async function main() {
  const msgToday = (await Promise.all([mainCalendar(), mainGithub()])).join(
    "\n"
  );

  const msgNext = (await Promise.all([nextCalendar()])).join("\n");

  const day = todayStart.format("YYYY-MM-DD");
  const tmr = tomorrowStart.format("YYYY-MM-DD");

  const msg = [`# Today ${day}\n\n`, msgToday, "\n\n\n", `# Next ${tmr}\n\n`, msgNext].join(
    ""
  );
  process.stdout.write("\n\n");
  process.stdout.write(msg);
  process.stdout.write("\n\n");

  const outFile = path.join(SDIR, `${day}.md`);
  fs.writeFileSync(outFile, msg);
}

main();
