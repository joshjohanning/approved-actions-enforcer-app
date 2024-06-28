import yaml from "js-yaml";

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
export default (app) => {
  try {
    if (!process.env.approvedActionsOrg)
      throw new Error(
        "Environment variable `approvedActionsOrg` is not set or is empty.",
      );
    if (!process.env.approvedActionsRepo)
      throw new Error(
        "Environment variable `approvedActionsRepo` is not set or is empty.",
      );
    if (!process.env.approvedActionsFilePath)
      throw new Error(
        "Environment variable `approvedActionsFilePath` is not set or is empty.",
      );
    if (!process.env.allowGitHubActionsOrgs)
      throw new Error(
        "Environment variable `allowGitHubActionsOrgs` is not set or is empty.",
      );

    app.log.info("Yay, the app was loaded!");

    app.on("workflow_run.requested", async (context) => {
      app.log.info(
        `Workflow run ${context.payload.workflow_run.id} requested in ${context.payload.repository.full_name}`,
      );
      // Log the entire payload for debugging
      app.log.debug(context.payload.workflow_run);
      app.log.debug(`owner: ${context.payload.repository.owner.login}`);
      app.log.debug(`repo: ${context.payload.repository.name}`);
      app.log.debug(`workflow_run_id: ${context.payload.workflow_run.id}`);
      app.log.debug(`path: ${context.payload.workflow_run.path}`);

      const approvedActions = await getFileContent(
        context,
        process.env.approvedActionsOrg,
        process.env.approvedActionsRepo,
        process.env.approvedActionsFilePath,
      );
      app.log.debug(approvedActions);

      const actionsSet = parseActionsYml(approvedActions);

      const workflowYml = await getFileContent(
        context,
        context.payload.repository.owner.login,
        context.payload.repository.name,
        context.payload.workflow_run.path,
      );

      const actions = workflowYml.match(/(?<=^(?!\s*#).*uses: ).*/gm);
      app.log.info(`Actions: ${actions}`);

      for (const action of actions) {
        app.log.info(`Processing action: ${action}`);
        const doesActionExit = actionExists(action, actionsSet);
        app.log.info(`Action exists in allowed list: ${doesActionExit}`);
        if (!doesActionExit) {
          await cancelWorkflowRun(app, context);
          break;
        }
      }
    });
  } catch (error) {
    app.log.error(`An error occurred: ${error.message}`);
    process.exit(1);
    // Handle the error appropriately
    // For example, you might want to exit the process or send a notification
  }
};

// Function to parse YML content and return a Set of actions
function parseActionsYml(ymlContent) {
  try {
    const doc = yaml.load(ymlContent);
    let actions = new Set();
    actions = new Set([...doc.actions]);
    if (process.env.allowGitHubActionsOrgs === "true") {
      actions.add("github/*");
      actions.add("actions/*");
    }
    return actions;
  } catch (e) {
    console.error("Failed to parse YML:", e);
    return null;
  }
}

function actionExists(action, actionsSet) {
  // Convert each action in actionsSet to a regex, treating '*' as a wildcard
  const regexSet = Array.from(actionsSet).map(actionToRegex);

  // Check if the input action matches any regex in the set
  return regexSet.some((regex) => regex.test(action));
}

function actionToRegex(action) {
  // Escape special characters and replace '*' with '.*' for wildcard matching
  const escapedAction = action
    .replace(/[-\/\\^$+?.()|[\]{}]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${escapedAction}$`, "i");
}

async function getFileContent(context, owner, repo, path) {
  try {
    const fileContentResponse = await context.octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    // Decode the Base64 content
    return Buffer.from(fileContentResponse.data.content, "base64").toString(
      "utf-8",
    );
  } catch (error) {
    console.error("Failed to fetch file:", error);
    throw error; // Rethrow to handle it in the calling context
  }
}

async function cancelWorkflowRun(app, context) {
  try {
    await context.octokit.actions.cancelWorkflowRun({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      run_id: context.payload.workflow_run.id,
    });
    app.log.info(
      `Workflow run ${context.payload.workflow_run.id} canceled successfully.`,
    );
  } catch (error) {
    app.log.error(`Error canceling workflow run: ${error}`);
    throw error; // Rethrow to handle it in the calling context
  }
}
