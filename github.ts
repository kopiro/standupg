import { Octokit } from "@octokit/rest";
import { today } from ".";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  baseUrl: process.env.GITHUB_BASE,
  log: null,
});

type PullRequest = {
  state: string;
  body: string;
  html_url: string;
  title: string;
  body_clean: string;
};

const messageGenerators = [
  (pr: PullRequest) => `
- _${pr.state === "closed" ? "Merged" : "Created"} PR: ${pr.title}_
${pr.body_clean}
(${pr.html_url})`,
];

export default async function (): Promise<string> {
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
    .filter((e) => new Date(e.updated_at) > today)
    .reverse();

  const list = myPRs
    .map((pr) => {
      const bodyClean = pr.body
        .split("### Checklist")[0]
        .replace("### Description", "")
        .replace(/\n/g, "")
        .trim();

      const generator =
        messageGenerators[Math.floor(Math.random() * messageGenerators.length)];
      return generator({
        ...pr,
        body_clean: bodyClean,
        title: pr.title.trim(),
      });
    })
    .join("\n");

  return `*PRs*:\n${list}`;
}
