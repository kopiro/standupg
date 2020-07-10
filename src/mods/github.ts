import { Octokit } from "@octokit/rest";
import { PullsListResponseData } from "@octokit/types";
import { todayStart, rnd } from "../utils";

const getDescription = (pr: PullsListResponseData[0]) => {
  const body = pr.body
    .split("### Checklist")[0] // Get the part before Checklist
    .replace("### Description", "") // Remove description
    .replace(/\n/g, "") // Remove any EOF
    .trim();
  return body.length < 300 ? body : "check-out at";
};

const validLabels = (process.env.GITHUB_VALID_LABELS || "").split(",");
const getLabels = (pr: PullsListResponseData[0]) => {
  return pr.labels
    .filter((lbl) => validLabels.includes(lbl.name.toLowerCase()))
    .map((lbl) => lbl.name.toLowerCase())
    .join(", ");
};

const getState = (pr: PullsListResponseData[0]) => {
  switch (pr.state) {
    case "closed":
      if (
        new Date(pr.created_at) < todayStart.toDate() &&
        new Date(pr.updated_at) > todayStart.toDate()
      ) {
        return (
          rnd(["🍻", "🥳"]) +
          " " +
          rnd(["Finally merged", "In the end, finally able to merge"])
        );
      }
      return rnd(["Merged", "Closed", "Deployed"]);
    case "open":
      if (
        new Date(pr.created_at) < todayStart.toDate() &&
        new Date(pr.updated_at) > todayStart.toDate()
      ) {
        return (
          rnd(["😑", "😩", "🤕"]) +
          " " +
          rnd([
            "Still working on",
            "Having some trouble on",
            "Having hard times with",
            "Headache on",
          ])
        );
      }
      return rnd(["Opened PR", "Created", "Worked on"]);
  }
};

export async function main(): Promise<string> {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    baseUrl: process.env.GITHUB_BASE,
    log: null,
  });

  const { data } = await octokit.pulls.list({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    state: "all",
    sort: "created",
    direction: "desc",
    per_page: 100,
  });
  const myPRs = data
    .filter((e) => e.user.login === process.env.GITHUB_USER)
    .filter(
      (e) =>
        new Date(e.created_at) > todayStart.toDate() ||
        new Date(e.updated_at) > todayStart.toDate()
    )
    .reverse();

  const list = myPRs
    .map((pr) => {
      const desc = getDescription(pr);
      const labels = getLabels(pr);
      const state = getState(pr);
      return `- _${state}: ${pr.title.trim()}${
        labels && ` (${labels})`
      }_\n${desc} (${pr.html_url})`;
    })
    .join("\n");

  return `*PRs*:\n${list}`;
}
