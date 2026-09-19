# Free portfolio deployment

Conferia uses Vercel for the frontend, Koyeb for the API, and MongoDB Atlas for persistent data. Deploy the backend first because the frontend build requires its URL.

## 1. MongoDB Atlas

Confirm the `sessionflow` database and database user exist. In **Network Access**, permit the hosted backend. A free service has no fixed outbound IP, so use `0.0.0.0/0` for this portfolio demo and protect access with a strong database password. Copy the complete connection string, including `/sessionflow` before the query string.

## 2. Koyeb backend

1. Sign in at `https://app.koyeb.com/`.
2. Choose **Create Web Service → GitHub**.
3. Select `alantberaquit/sessionflow` and `main`.
4. Use these settings:

   - Builder: Buildpack
   - Work directory: `server`
   - Build command: `npm ci`
   - Run command: `npm start`
   - Instance: Free
   - Port: platform-provided `PORT`

5. Add environment variables:

   - `NODE_ENV=production`
   - `MONGODB_URI=<complete Atlas connection string>`
   - `CLIENT_URL=https://temporary.example.com`
   - `JWT_SECRET=<long random value>`
   - `JWT_EXPIRES_IN=1d`
   - `BANK_TRANSFER_BANK_NAME=<demo bank name>`
   - `BANK_TRANSFER_ACCOUNT_NAME=<demo account name>`
   - `BANK_TRANSFER_ACCOUNT_NUMBER=<demo account number>`
   - `BANK_TRANSFER_INSTRUCTIONS=<demo instructions>`

6. Deploy and copy the resulting `https://...koyeb.app` URL.
7. Open the URL and confirm the API returns its running message.

SMTP variables are optional for this portfolio deployment.

## 3. Vercel frontend

1. At `https://vercel.com/new`, import `alantberaquit/sessionflow`.
2. Set **Root Directory** to `client`.
3. Confirm build command `npm run build` and output directory `dist`.
4. Add `VITE_API_URL=https://<your-koyeb-domain>.koyeb.app`.
5. Deploy and copy the production `https://...vercel.app` URL.

`client/vercel.json` supplies React Router fallback rewrites, security headers, and immutable caching for generated assets.

## 4. Connect the domains

In Koyeb, replace the temporary `CLIENT_URL` with the exact Vercel production URL and redeploy the backend. Do not include a trailing slash.

## 5. Verify

Open `/events`, create a new portfolio account, complete the profile and registration flow, and refresh `/dashboard` to confirm client-side routes work. Check the browser console for CORS errors.

## Free-tier limitations

Koyeb's free instance scales to zero after inactivity. Uploaded receipts use temporary local storage and can disappear after a restart or redeploy. MongoDB records remain persistent in Atlas. This setup is appropriate for a portfolio demo, not a production payment system.
