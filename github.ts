import { Octokit } from "@octokit/rest";
import { PullsListResponseData } from "@octokit/types";
import { todayStart, rnd } from ".";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  baseUrl: process.env.GITHUB_BASE,
  log: null,
});

const getDescription = (pr: PullsListResponseData[0]) => {
  const body = pr.body
    .split("### Checklist")[0]
    .replace("### Description", "")
    .replace(/\n/g, "")
    .trim();
  return body.length < 300 ? body : "check-out at";
};

const validLabels = ["stale", "draft", "do not merge", "do not review"];
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
