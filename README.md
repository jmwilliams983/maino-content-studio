# Main'O Content Studio

A private, mobile-friendly dashboard for planning Facebook posts and Reel scripts.

## Features

- PIN-protected dashboard
- Post vault with categories, statuses, copy, and delete
- Reel script library with hooks and durations
- Content schedule and weekly overview
- Starter posts in Main'O's voice
- No paid dependencies

## Run locally

```bash
APP_PIN=2468 npm start
```

Open `http://localhost:3000`. Change the PIN before deployment.

## Deploy on Railway

1. Create a new Railway project and deploy this folder from GitHub.
2. Add an environment variable named `APP_PIN` with a private 4–8 digit PIN.
3. Add a Railway Volume mounted at `/data` so drafts remain saved after redeploys.
4. Add `DATA_DIR=/data` as another environment variable.
5. Generate a public domain in Railway's Networking settings.

Railway automatically uses `npm start` and provides the `PORT` variable.

## Privacy note

The PIN provides lightweight access control for a personal tool. Do not store passwords, financial information, or other highly sensitive information in this app.
