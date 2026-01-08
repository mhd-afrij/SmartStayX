# Vercel Deployment Setup Guide

This guide explains how to configure your SmartStayX application on Vercel.

## Prerequisites

- A Vercel account ([sign up here](https://vercel.com/signup))
- All required API keys and credentials (see Environment Variables section)

## Step 1: Deploy to Vercel

### Option A: Deploy via Vercel CLI

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Navigate to the Server directory:
   ```bash
   cd Server
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts to link your project or create a new one.

### Option B: Deploy via GitHub Integration

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure the project:
   - **Root Directory:** `Server`
   - **Framework Preset:** Other
   - **Build Command:** (leave empty)
   - **Output Directory:** (leave empty)
   - **Install Command:** `npm install`

## Step 2: Configure Environment Variables

### Accessing Environment Variables in Vercel

1. Go to your project in the [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable listed below

### Required Environment Variables

Add the following environment variables in Vercel:

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net` |
| `CLERK_SECRET_KEY` | Clerk authentication secret key | Get from [Clerk Dashboard](https://dashboard.clerk.com) |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook secret for webhooks | Get from Clerk webhook settings |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Get from [Cloudinary Dashboard](https://cloudinary.com/console) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Get from Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Get from Cloudinary Dashboard |
| `SMTP_USER` | SMTP server username | Your email service username |
| `SMTP_PASS` | SMTP server password | Your email service password |
| `SENDER_EMAIL` | Email address for sending emails | `noreply@yourdomain.com` |

### Optional Environment Variables

| Variable Name | Description | Default |
|--------------|-------------|---------|
| `PORT` | Server port (not used on Vercel) | `3000` |
| `NODE_ENV` | Environment mode | `production` |
| `CURRENCY` | Currency symbol for bookings | `$` |

### Setting Environment Variables

For each variable:

1. Click **Add New**
2. Enter the **Name** (exactly as shown above)
3. Enter the **Value**
4. Select **Environments:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development (if testing locally)
5. Click **Save**

### Bulk Import (Alternative Method)

You can also import environment variables from your `.env` file:

1. In **Environment Variables** section, click **"..."** (three dots)
2. Select **"Import .env.local"** or **"Import from .env"**
3. Upload your `.env` file
4. Review and confirm each variable

**⚠️ Important:** Never commit your `.env` file to Git. Always use `.env.example` as a template.

## Step 3: Verify Configuration

After adding all environment variables:

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"Redeploy"** to trigger a new build with the environment variables
4. Wait for deployment to complete
5. Check the deployment logs for any errors

## Step 4: Test Your Deployment

1. Visit your Vercel deployment URL (e.g., `https://your-project.vercel.app`)
2. Test key functionality:
   - User authentication
   - Room browsing
   - Booking creation
   - Email notifications

## Troubleshooting

### Issue: `Cannot find package 'nodemailer'`

**Error Message:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'nodemailer' imported from /var/task/Server/configs/nodemailer.js
```

**Solution:**

1. **Verify `package.json` includes `nodemailer`:**
   ```json
   {
     "dependencies": {
       "nodemailer": "^7.0.12"
     }
   }
   ```

2. **Ensure `package-lock.json` is committed to Git:**
   - Check that `Server/package-lock.json` exists and is committed
   - If missing, run `npm install` locally and commit the file

3. **Verify Vercel Project Settings:**
   - Go to **Settings** → **General**
   - Ensure **Root Directory** is set to `Server`
   - If deploying via GitHub, check the root directory in project settings

4. **Check Install Command:**
   - Go to **Settings** → **General**
   - **Install Command** should be `npm install` (default)
   - **Build Command** can be left empty

5. **Redeploy the application:**
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment
   - This will reinstall all dependencies

6. **If issue persists:**
   - Delete and recreate the deployment
   - Check deployment logs for installation errors
   - Verify Node.js version compatibility (nodemailer 7.x requires Node.js 18+)

### Issue: Environment variables not working

**Solution:**
1. Verify all variables are added in Vercel Dashboard
2. Ensure variable names match exactly (case-sensitive)
3. Redeploy after adding new environment variables
4. Check deployment logs for specific errors

### Issue: Database connection fails

**Solution:**
1. Verify `MONGODB_URI` is correct
2. Ensure MongoDB Atlas allows connections from Vercel IPs (or allow all IPs: `0.0.0.0/0`)
3. Check network access in MongoDB Atlas dashboard

### Issue: Cloudinary upload fails

**Solution:**
1. Verify all three Cloudinary variables are set:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
2. Check Cloudinary dashboard for correct values

### Issue: Email sending fails

**Solution:**
1. Verify `SMTP_USER` and `SMTP_PASS` are correct
2. Test SMTP credentials with your email provider (Brevo, SendGrid, etc.)
3. Check if your email service requires IP whitelisting

## Environment Variable Security Best Practices

1. **Never commit `.env` files** - Always use `.env.example`
2. **Use different values for different environments** - Production, Preview, Development
3. **Rotate secrets regularly** - Update API keys periodically
4. **Use Vercel's Environment Variables UI** - Don't expose secrets in code
5. **Limit access** - Only give team members access who need it

## Local Development Setup

For local development:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values in `.env`

3. Ensure `.env` is in `.gitignore`:
   ```
   .env
   .env.local
   .env.*.local
   ```

## Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Clerk Documentation](https://clerk.com/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)

## Support

If you encounter issues:
1. Check deployment logs in Vercel Dashboard
2. Review error messages in browser console
3. Verify all environment variables are correctly set
4. Ensure all dependencies are listed in `package.json`

