import nock from "nock";
// Requiring our app implementation
import myProbotApp from "../index.mjs";
import { Probot, ProbotOctokit } from "probot";
// Requiring our fixtures
//import payload from "./fixtures/issues.opened.json" with { type: "json" };
const issueCreatedBody = { body: "Thanks for opening this issue!" };
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';

import { describe, beforeEach, afterEach, test } from "node:test";
import assert from "node:assert";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8",
);

const payload = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fixtures/workflow.requested.json"), "utf-8"),
);

// console.log(payload);

// At the top of your index.test.js or before you need to use the environment variables
dotenv.config();

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

  // test("creates a comment when an issue is opened", async () => {
  //   const mock = nock("https://api.github.com")
  //     // Test that we correctly return a test token
  //     .post("/app/installations/2/access_tokens")
  //     .reply(200, {
  //       token: "test",
  //       permissions: {
  //         issues: "write",
  //       },
  //     })

  //     // Test that a comment is posted
  //     .post("/repos/hiimbex/testing-things/issues/1/comments", (body) => {
  //       assert.deepEqual(body, issueCreatedBody);
  //       return true;
  //     })
  //     .reply(200);

  //   // Receive a webhook event
  //   await probot.receive({ name: "issues", payload });

  //   assert.deepStrictEqual(mock.pendingMocks(), []);
  // });

  test("successfully finds and cancels workflow", async () => {
    // Step 1: Read the actions-allow-list.yml mock file
    // const actionsAllowList = fs.readFileSync(
    //   path.join(__dirname, "fixtures/actions-allow-list.yml"),
    //   "utf-8",
    // );
  
    // Mock GitHub API authentication
    const mock = nock("https://api.github.com")
      .post("/app/installations/52238995/access_tokens")
      .reply(200, { token: "test", permissions: { contents: "read" } });
  
      // Mock retrieving the workflow.yml content
      nock("https://api.github.com")
      .get(`/repos/joshjohanning-org/actions-allow-list-as-code/contents/${encodeURIComponent('github-actions-allow-list.yml')}`)
      .reply(200, { content: Buffer.from(fs.readFileSync(path.join(__dirname, "fixtures/actions-allow-list.yml"), "utf-8")).toString('base64') });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(`/repos/joshjohanning-org/actions-throwaway/contents/${encodeURIComponent('.github/workflows/workflow.yml')}`)
      .reply(200, { content: Buffer.from(fs.readFileSync(path.join(__dirname, "fixtures/workflow-unapproved-actions.yml"), "utf-8")).toString('base64') });
  
    // Mock the API call to cancel a workflow run
    nock("https://api.github.com")
      .post("/repos/joshjohanning-org/actions-throwaway/actions/runs/9688896502/cancel")
      .reply(202); // Assuming 202 Accepted is the response for a successful cancellation

    // Receive a webhook event
    await probot.receive({ name: "workflow_run.requested", payload });

    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

test("successfully finds and cancels workflow", async () => {
    // Step 1: Read the actions-allow-list.yml mock file
    // const actionsAllowList = fs.readFileSync(
    //   path.join(__dirname, "fixtures/actions-allow-list.yml"),
    //   "utf-8",
    // );
  
    // Mock GitHub API authentication
    const mock = nock("https://api.github.com")
      .post("/app/installations/52238995/access_tokens")
      .reply(200, { token: "test", permissions: { contents: "read" } });
  
      // Mock retrieving the workflow.yml content
      nock("https://api.github.com")
      .get(`/repos/joshjohanning-org/actions-allow-list-as-code/contents/${encodeURIComponent('github-actions-allow-list.yml')}`)
      .reply(200, { content: Buffer.from(fs.readFileSync(path.join(__dirname, "fixtures/actions-allow-list.yml"), "utf-8")).toString('base64') });

    // Mock retrieving the workflow.yml content
    nock("https://api.github.com")
      .get(`/repos/joshjohanning-org/actions-throwaway/contents/${encodeURIComponent('.github/workflows/workflow.yml')}`)
      .reply(200, { content: Buffer.from(fs.readFileSync(path.join(__dirname, "fixtures/workflow-approved-actions.yml"), "utf-8")).toString('base64') });
  
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

// TODO: Create separate test for case insensitivity - ie: a different case in workflow yml as in allowed list
// TODO: Create separate test for finding and blocking a local action
// TODO: Create separate test for finding and blocking a remote action
// TODO: Create separate test for regex wildcard patterns (ie: @v*, @*, etc.)
// TODO: Create separate test for commented out actions
