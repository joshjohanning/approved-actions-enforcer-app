# approved-actions-enforcer-app

A GitHub App built with [Probot](https://github.com/probot/probot) that A Probot app designed to review Actions workflows to ensure it is running approved actions, and if not, terminate the workflow

An Actions Allow List helps, but this doesn't prevent someone from cloning in an unapproved action repository into an organization in the enterprise or using a local action. This app will review the actions in a workflow and if it finds an action that is not on the allow list, it will cancel the workflow.

## Example

An allow list of actions is defined in a `yml` file [here](https://github.com/joshjohanning-org/actions-allow-list-as-code/blob/main/github-actions-allow-list.yml).

The app expects your `yml` file to be in a similar format, with a map of actions under the `actions: ` key. Wildcards are accepted. Example:

```yml
actions:
  - lindluni/actions-variable-groups@v2
  - joshjohanning/*
  - zgosalvez/github-actions-ensure-sha-pinned-actions@f32435541e24cd6a4700a7f52bb2ec59e80603b1
```

App logs will show the actions that were found in the workflow and if they were approved or not.

```text
INFO (probot): Actions: actions/checkout@v4,./local-action,stefanbuck/github-issue-parser@v3,ruby/setup-ruby@v1,joshjohanning-org/composite-action-sample-python@main
INFO (probot): Processing action: actions/checkout@v4
INFO (probot): Action exists: true
INFO (probot): Processing action: ./local-action
INFO (probot): Action exists: false
```

In this case, since the `./local-action` is not on the allow list, the workflow will be canceled.

![Canceled workflow](https://github.com/user-attachments/assets/a432a0c9-95fa-48dc-b284-992bedc6e978)

## Configuration

Modify/copy the `.env.example` --> `.env` file and add your GitHub App ID, Private Key, among other required values.

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t approved-actions-enforcer-app .

# 2. Start container
docker run \
  -e APP_ID=<app-id> \
  -e PRIVATE_KEY=<pem-value> \
  -e approvedActionsOrg=abc \
  -e approvedActionsRepo=def \
  -e approvedActionsFilePath=file.yml \
  approved-actions-enforcer-app
```

## Installing / Configuring the App

If you want to use the App Manifest flow (pre-configured settings), you can:

1. Modify the `GH_ORG` var in `.env` for your org (recommended to install the app in an org and not a user account)
2. Run the app: `npm start`
3. Navigate to `http://localhost:3000` and follow the prompts to install the app to your org
4. Smee.io should be configured by default, change to your own webhook endpoint if desired

If you don't want to use the App Manifest flow and want to create your own app, the app needs:

- Permissions:
  - Repository:
    - Actions: write
    - Contents: read
    - Metadata: read
- Events:
  - Workflow run

## Contributing

If you have suggestions for how approved-actions-enforcer-app could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2024 Josh Johanning
