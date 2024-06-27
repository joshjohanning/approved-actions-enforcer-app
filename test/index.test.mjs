import nock from "nock";
// Requiring our app implementation
import myProbotApp from "../index.mjs";
import { Probot, ProbotOctokit } from "probot";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { describe, beforeEach, afterEach, test } from "node:test";
import assert from "node:assert";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8",
);

const payload = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "fixtures/workflow.requested.json"),
    "utf-8",
  ),
);

process.env.approvedActionsOrg = "joshjohanning-org";
process.env.approvedActionsRepo = "actions-allow-list-as-code";
process.env.approvedActionsFilePath = "github-actions-allow-list.yml";
process.env.allowGitHubActionsOrgs = "true";

describe("My Probot app", () => {
  let probot;

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({
      appId: 123,
      privateKey,
      // disable request throttling and retries for testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    // Load our app into probot
    probot.load(myProbotApp);
  });

  test("successfully finds approved actions and doesn't cancel workflow - normal", async () => {
    // Mock GitHub API authentication
    const mock = nock("https://api.github.com")
      .post("/app/installations/52238995/access_tokens")
      .reply(200, { token: "test", permissions: { contents: "read" } });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(
        `/repos/joshjohanning-org/actions-allow-list-as-code/contents/${encodeURIComponent("github-actions-allow-list.yml")}`,
      )
      .reply(200, {
        content: Buffer.from(
          fs.readFileSync(
            path.join(
              __dirname,
              "fixtures/actions-allow-lists/actions-allow-list-normal.yml",
            ),
            "utf-8",
          ),
        ).toString("base64"),
      });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(
        `/repos/joshjohanning-org/actions-throwaway/contents/${encodeURIComponent(".github/workflows/workflow.yml")}`,
      )
      .reply(200, {
        content: Buffer.from(
          fs.readFileSync(
            path.join(
              __dirname,
              "fixtures/workflows/workflow-approved-actions-wildcards.yml",
            ),
            "utf-8",
          ),
        ).toString("base64"),
      });

    // Receive a webhook event
    await probot.receive({ name: "workflow_run.requested", payload });

    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

  test("successfully finds approved actions and doesn't cancel workflow - including wildcard pattern", async () => {
    // Mock GitHub API authentication
    const mock = nock("https://api.github.com")
      .post("/app/installations/52238995/access_tokens")
      .reply(200, { token: "test", permissions: { contents: "read" } });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(
        `/repos/joshjohanning-org/actions-allow-list-as-code/contents/${encodeURIComponent("github-actions-allow-list.yml")}`,
      )
      .reply(200, {
        content: Buffer.from(
          fs.readFileSync(
            path.join(
              __dirname,
              "fixtures/actions-allow-lists/actions-allow-list-normal.yml",
            ),
            "utf-8",
          ),
        ).toString("base64"),
      });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(
        `/repos/joshjohanning-org/actions-throwaway/contents/${encodeURIComponent(".github/workflows/workflow.yml")}`,
      )
      .reply(200, {
        content: Buffer.from(
          fs.readFileSync(
            path.join(
              __dirname,
              "fixtures/workflows/workflow-approved-actions-wildcards.yml",
            ),
            "utf-8",
          ),
        ).toString("base64"),
      });

    // Receive a webhook event
    await probot.receive({ name: "workflow_run.requested", payload });

    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

  test("successfully finds approved actions and doesn't cancel workflow - ignores commented out unapproved action", async () => {
    // Mock GitHub API authentication
    const mock = nock("https://api.github.com")
      .post("/app/installations/52238995/access_tokens")
      .reply(200, { token: "test", permissions: { contents: "read" } });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(
        `/repos/joshjohanning-org/actions-allow-list-as-code/contents/${encodeURIComponent("github-actions-allow-list.yml")}`,
      )
      .reply(200, {
        content: Buffer.from(
          fs.readFileSync(
            path.join(
              __dirname,
              "fixtures/actions-allow-lists/actions-allow-list-normal.yml",
            ),
            "utf-8",
          ),
        ).toString("base64"),
      });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(
        `/repos/joshjohanning-org/actions-throwaway/contents/${encodeURIComponent(".github/workflows/workflow.yml")}`,
      )
      .reply(200, {
        content: Buffer.from(
          fs.readFileSync(
            path.join(
              __dirname,
              "fixtures/workflows/workflow-unapproved-action-commented-out.yml",
            ),
            "utf-8",
          ),
        ).toString("base64"),
      });

    // Receive a webhook event
    await probot.receive({ name: "workflow_run.requested", payload });

    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

  test("successfully finds approved actions and doesn't cancel workflow - case insensitive", async () => {
    // Mock GitHub API authentication
    const mock = nock("https://api.github.com")
      .post("/app/installations/52238995/access_tokens")
      .reply(200, { token: "test", permissions: { contents: "read" } });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(
        `/repos/joshjohanning-org/actions-allow-list-as-code/contents/${encodeURIComponent("github-actions-allow-list.yml")}`,
      )
      .reply(200, {
        content: Buffer.from(
          fs.readFileSync(
            path.join(
              __dirname,
              "fixtures/actions-allow-lists/actions-allow-list-case-insensitive.yml",
            ),
            "utf-8",
          ),
        ).toString("base64"),
      });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(
        `/repos/joshjohanning-org/actions-throwaway/contents/${encodeURIComponent(".github/workflows/workflow.yml")}`,
      )
      .reply(200, {
        content: Buffer.from(
          fs.readFileSync(
            path.join(
              __dirname,
              "fixtures/workflows/workflow-approved-actions-normal.yml",
            ),
            "utf-8",
          ),
        ).toString("base64"),
      });

    // Receive a webhook event
    await probot.receive({ name: "workflow_run.requested", payload });

    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

  test("successfully finds approved actions and doesn't cancel workflow - github/actions org actions", async () => {
    process.env.allowGitHubActionsOrgs = "true";

    // Mock GitHub API authentication
    const mock = nock("https://api.github.com")
      .post("/app/installations/52238995/access_tokens")
      .reply(200, { token: "test", permissions: { contents: "read" } });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(
        `/repos/joshjohanning-org/actions-allow-list-as-code/contents/${encodeURIComponent("github-actions-allow-list.yml")}`,
      )
      .reply(200, {
        content: Buffer.from(
          fs.readFileSync(
            path.join(
              __dirname,
              "fixtures/actions-allow-lists/actions-allow-list-normal.yml",
            ),
            "utf-8",
          ),
        ).toString("base64"),
      });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(
        `/repos/joshjohanning-org/actions-throwaway/contents/${encodeURIComponent(".github/workflows/workflow.yml")}`,
      )
      .reply(200, {
        content: Buffer.from(
          fs.readFileSync(
            path.join(
              __dirname,
              "fixtures/workflows/workflow-approved-actions-github-orgs.yml",
            ),
            "utf-8",
          ),
        ).toString("base64"),
      });

    // Receive a webhook event
    await probot.receive({ name: "workflow_run.requested", payload });

    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

  test("successfully finds approved actions and cancels workflow - github/actions org actions", async () => {
    process.env.allowGitHubActionsOrgs = "false";

    // Mock GitHub API authentication
    const mock = nock("https://api.github.com")
      .post("/app/installations/52238995/access_tokens")
      .reply(200, { token: "test", permissions: { contents: "read" } });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(
        `/repos/joshjohanning-org/actions-allow-list-as-code/contents/${encodeURIComponent("github-actions-allow-list.yml")}`,
      )
      .reply(200, {
        content: Buffer.from(
          fs.readFileSync(
            path.join(
              __dirname,
              "fixtures/actions-allow-lists/actions-allow-list-normal.yml",
            ),
            "utf-8",
          ),
        ).toString("base64"),
      });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(
        `/repos/joshjohanning-org/actions-throwaway/contents/${encodeURIComponent(".github/workflows/workflow.yml")}`,
      )
      .reply(200, {
        content: Buffer.from(
          fs.readFileSync(
            path.join(
              __dirname,
              "fixtures/workflows/workflow-approved-actions-github-orgs.yml",
            ),
            "utf-8",
          ),
        ).toString("base64"),
      });

    // Mock the API call to cancel a workflow run
    nock("https://api.github.com")
      .post(
        "/repos/joshjohanning-org/actions-throwaway/actions/runs/9688896502/cancel",
      )
      .reply(202); // Assuming 202 Accepted is the response for a successful cancellation

    // Receive a webhook event
    await probot.receive({ name: "workflow_run.requested", payload });

    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

  test("successfully finds unapproved actions and cancels workflow - org actions", async () => {
    // Mock GitHub API authentication
    const mock = nock("https://api.github.com")
      .post("/app/installations/52238995/access_tokens")
      .reply(200, { token: "test", permissions: { contents: "read" } });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(
        `/repos/joshjohanning-org/actions-allow-list-as-code/contents/${encodeURIComponent("github-actions-allow-list.yml")}`,
      )
      .reply(200, {
        content: Buffer.from(
          fs.readFileSync(
            path.join(
              __dirname,
              "fixtures/actions-allow-lists/actions-allow-list-normal.yml",
            ),
            "utf-8",
          ),
        ).toString("base64"),
      });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(
        `/repos/joshjohanning-org/actions-throwaway/contents/${encodeURIComponent(".github/workflows/workflow.yml")}`,
      )
      .reply(200, {
        content: Buffer.from(
          fs.readFileSync(
            path.join(
              __dirname,
              "fixtures/workflows/workflow-unapproved-org-action.yml",
            ),
            "utf-8",
          ),
        ).toString("base64"),
      });

    // Mock the API call to cancel a workflow run
    nock("https://api.github.com")
      .post(
        "/repos/joshjohanning-org/actions-throwaway/actions/runs/9688896502/cancel",
      )
      .reply(202); // Assuming 202 Accepted is the response for a successful cancellation

    // Receive a webhook event
    await probot.receive({ name: "workflow_run.requested", payload });

    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

  test("successfully finds unapproved actions and cancels workflow - local actions", async () => {
    // Mock GitHub API authentication
    const mock = nock("https://api.github.com")
      .post("/app/installations/52238995/access_tokens")
      .reply(200, { token: "test", permissions: { contents: "read" } });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(
        `/repos/joshjohanning-org/actions-allow-list-as-code/contents/${encodeURIComponent("github-actions-allow-list.yml")}`,
      )
      .reply(200, {
        content: Buffer.from(
          fs.readFileSync(
            path.join(
              __dirname,
              "fixtures/actions-allow-lists/actions-allow-list-normal.yml",
            ),
            "utf-8",
          ),
        ).toString("base64"),
      });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(
        `/repos/joshjohanning-org/actions-throwaway/contents/${encodeURIComponent(".github/workflows/workflow.yml")}`,
      )
      .reply(200, {
        content: Buffer.from(
          fs.readFileSync(
            path.join(
              __dirname,
              "fixtures/workflows/workflow-unapproved-local-action.yml",
            ),
            "utf-8",
          ),
        ).toString("base64"),
      });

    // Mock the API call to cancel a workflow run
    nock("https://api.github.com")
      .post(
        "/repos/joshjohanning-org/actions-throwaway/actions/runs/9688896502/cancel",
      )
      .reply(202); // Assuming 202 Accepted is the response for a successful cancellation

    // Receive a webhook event
    await probot.receive({ name: "workflow_run.requested", payload });

    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about testing with Nock see:
// https://github.com/nock/nock
