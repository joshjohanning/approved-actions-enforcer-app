import yaml from 'js-yaml';

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
export default (app) => {
  // Your code here
  app.log.info("Yay, the app was loaded!");

  app.on("workflow_run.requested", async (context) => {
    app.log.info("Workflow run requested");
    // app.log.info(context.payload);
    app.log.info(context.payload.workflow_run);
    // const workflowRun = context.workflow({
    //   body: "Thanks for running this workflow!",
    // });
    // return context.octokit.issues.createComment(issueComment);

    // TODO: these should probably be debug level logs
    app.log.info(`owner: ${context.payload.repository.owner.login}`);
    app.log.info(`repo: ${context.payload.repository.name}`);
    app.log.info(`workflow_run_id: ${context.payload.workflow_run.id}`);
    app.log.info(`path: ${context.payload.workflow_run.path}`);

    // TODO: set the org/repo/yml file as input/env variables
    const approvedActions = await getFileContent(context, context.payload.repository.owner.login, 'actions-allow-list-as-code', 'github-actions-allow-list.yml');
    // Log the content or do something with it

    // TODO: debug logging
    app.log.debug(approvedActions);

    // Set to actions
    const actionsSet = parseActionsYml(approvedActions);
    app.log.info(`Actions: ${actionsSet}`);
    const firstActionIterator = actionsSet.values();
    const firstAction = firstActionIterator.next().value;
    app.log.info(`First Action: ${firstAction}`);

    // get the running workflow's yml
    const workflowYml = await getFileContent(context, context.payload.repository.owner.login, context.payload.repository.name, context.payload.workflow_run.path);
    app.log.info(`Workflow YML: ${workflowYml}`);
    // get each action from the yml - we will likely have to use regex to find the action names after `uses:`
    // TODO: ignore lines starting with '#'
    const actions = workflowYml.match(/(?<=^(?!\s*#).*uses: ).*/gm);

    // Log the entire array for debugging
    app.log.info(`Actions: ${actions}`);

    // Loop through each action in the array
    for (const action of actions) {
        // Log or perform operations with each action
        app.log.info(`Processing action: ${action}`);
        const doesActionExit = actionExists(action, actionsSet);
        app.log.info(`Action exists: ${doesActionExit}`);
        // Add any additional logic needed for each action here
        if (!doesActionExit) {
          // Cancel the workflow run if the action is not in the allow list
          await cancelWorkflowRun(app, context);
          break;
        }
    }

  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};

// Function to parse YML content and return a Set of actions
function parseActionsYml(ymlContent) {
  try {
    const doc = yaml.load(ymlContent);

    // const actions = new Set(doc.actions);
    // TODO: variable to allow/disallow github orgs
    const actions = new Set([...doc.actions, 'github/*', 'actions/*']);
    return actions;
  } catch (e) {
    console.error('Failed to parse YML:', e);
    return null;
  }
}

function actionExists(action, actionsSet) {
  // Convert each action in actionsSet to a regex, treating '*' as a wildcard
  const regexSet = Array.from(actionsSet).map(actionToRegex);

  // Check if the input action matches any regex in the set
  return regexSet.some(regex => regex.test(action));
}

function actionToRegex(action) {
  // Escape special characters and replace '*' with '.*' for wildcard matching
  const escapedAction = action.replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escapedAction}$`);
}

async function getFileContent(context, owner, repo, path) {
  try {
    const fileContentResponse = await context.octokit.repos.getContent({
      owner,
      repo,
      path
    });

    // Decode the Base64 content
    return Buffer.from(fileContentResponse.data.content, 'base64').toString('utf-8');
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
    app.log.info(`Workflow run ${context.payload.workflow_run.id} canceled successfully.`);
  } catch (error) {
    app.log.error(`Error canceling workflow run: ${error}`);
    throw error; // Rethrow to handle it in the calling context
  }
}
