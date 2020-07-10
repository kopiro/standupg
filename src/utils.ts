import path from "path";
import moment from "moment";
import os from "os";

export const SDIR = path.join(os.homedir(), ".standupg");

export const now = moment();

export const todayStart = now.clone().startOf("day");
export const todayEnd = now.clone().endOf("day");
export const tomorrowStart = now.clone().add(1, "day").startOf("day");
export const tomorrowEnd = now.clone().add(1, "day").endOf("day");

export const rnd = (els: Array<any>) =>
  els[Math.floor(Math.random() * els.length)];
