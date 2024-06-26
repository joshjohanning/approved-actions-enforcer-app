# approved-actions-enforcer-app

> A GitHub App built with [Probot](https://github.com/probot/probot) that A Probot app designed to review Actions workflows to ensure it is running approved actions, and if not, terminate the workflow

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
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> approved-actions-enforcer-app
```

## Contributing

If you have suggestions for how approved-actions-enforcer-app could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2024 Josh Johanning
