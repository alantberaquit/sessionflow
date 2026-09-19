# Free portfolio deployment on Render

This repository includes a Render Blueprint in `render.yaml`. It creates:

- `conferia-alanberaquit`: a free static site for the Vite frontend
- `conferia-alanberaquit-api`: a free Node.js web service for the Express API
- MongoDB remains hosted by MongoDB Atlas

## Before deploying

1. Commit and push the repository to the `main` branch on GitHub.
2. In MongoDB Atlas, create or confirm a database user with a strong password.
3. In Atlas **Network Access**, allow connections from Render. For a portfolio demo using Render's free service, the practical option is `0.0.0.0/0`. Keep the database credentials strong and never commit them.
4. Copy the complete Atlas connection string, including the `sessionflow` database name.

## Create both Render services

1. Sign in to Render and connect the GitHub account that owns this repository.
2. Choose **New → Blueprint**.
3. Select the `sessionflow` repository and the `main` branch.
4. Render will detect the root `render.yaml` file.
5. Enter the requested environment values:

   - `MONGODB_URI`: the complete MongoDB Atlas connection string
   - `BANK_TRANSFER_BANK_NAME`: demo bank name
   - `BANK_TRANSFER_ACCOUNT_NAME`: demo account name
   - `BANK_TRANSFER_ACCOUNT_NUMBER`: demo account number
   - `BANK_TRANSFER_INSTRUCTIONS`: short demo payment instructions

6. Deploy the Blueprint.

The configured production URLs are:

- Frontend: `https://conferia-alanberaquit.onrender.com`
- API: `https://conferia-alanberaquit-api.onrender.com`

If Render changes either service name because it is unavailable, update both of these environment variables and redeploy:

- Backend `CLIENT_URL` must equal the frontend URL, with no trailing slash.
- Frontend `VITE_API_URL` must equal the backend URL, with no trailing slash.

## Verify the deployment

1. Open the API URL. It should return a JSON message confirming that the API is running.
2. Open the frontend `/events` route.
3. Register a new portfolio test account.
4. Complete the profile and event registration flow.
5. Confirm that refreshing a nested route such as `/dashboard` still loads the application.

## Free-tier limitations

- The backend sleeps after a period of inactivity, so its first request can take about a minute.
- Uploaded payment receipts use the backend filesystem and can disappear whenever the free service restarts, sleeps, or redeploys.
- MongoDB records remain persistent in Atlas.
- Email is not configured by the Blueprint. Add SMTP environment variables in Render later if confirmation emails are needed.

These limitations are acceptable for a portfolio demonstration but not for a production payment workflow.
