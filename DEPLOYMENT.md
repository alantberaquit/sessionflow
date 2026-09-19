# Free portfolio deployment

Conferia can run as two Vercel projects—one for the Express API and one for the Vite frontend—with MongoDB Atlas providing persistent data. Deploy the backend first because the frontend build needs its public URL.

## 1. MongoDB Atlas

Confirm that the `sessionflow` database and database user exist. In **Network Access**, permit the hosted backend. Vercel does not provide a fixed outbound IP on the free plan, so use `0.0.0.0/0` for this portfolio demo and protect access with a strong database password. Copy the complete connection string, including `/sessionflow` before the query string.

## 2. Vercel backend

1. At `https://vercel.com/new`, import `alantberaquit/sessionflow`.
2. Name the project `conferia-api`.
3. Set **Root Directory** to `server` and leave framework detection enabled. Vercel recognizes `src/app.js` as an Express entry point; no output directory is needed.
4. Add these environment variables:

   - `NODE_ENV=production`
   - `MONGODB_URI=<complete Atlas connection string>`
   - `CLIENT_URL=https://temporary.example.com`
   - `JWT_SECRET=<long random value>`
   - `JWT_EXPIRES_IN=1d`
   - `BANK_TRANSFER_BANK_NAME=<demo bank name>`
   - `BANK_TRANSFER_ACCOUNT_NAME=<demo account name>`
   - `BANK_TRANSFER_ACCOUNT_NUMBER=<demo account number>`
   - `BANK_TRANSFER_INSTRUCTIONS=<demo instructions>`

5. Deploy and copy the resulting `https://...vercel.app` URL.
6. Open that URL and confirm it returns `Conferia API is running`.

SMTP variables are optional for this portfolio deployment.

## 3. Vercel frontend

1. From the Vercel dashboard, choose **Add New → Project** and import the same repository again.
2. Name the project `conferia`.
3. Set **Root Directory** to `client`.
4. Confirm the Vite build command is `npm run build` and the output directory is `dist`.
5. Add `VITE_API_URL=https://<your-conferia-api-domain>.vercel.app` without a trailing slash.
6. Deploy and copy the frontend production URL.

`client/vercel.json` supplies React Router fallback rewrites, security headers, and immutable caching for generated assets.

## 4. Connect the domains

In the `conferia-api` project, replace the temporary `CLIENT_URL` with the exact frontend production URL and redeploy the backend. Do not include a trailing slash.

## 5. Verify

Open `/events`, create a new portfolio account, complete the profile and registration flow, and refresh `/dashboard` to confirm client-side routes work. Check the browser console for CORS errors.

## Free-tier limitation

MongoDB records persist in Atlas, but uploaded payment receipts are stored in Vercel's temporary filesystem and may disappear between serverless invocations or deployments. The manual-payment upload is suitable only as a UI demonstration until it is connected to persistent object storage such as Vercel Blob or Cloudinary.
