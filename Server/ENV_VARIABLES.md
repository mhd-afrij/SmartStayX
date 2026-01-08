# Environment Variables Reference

This document lists all environment variables required for the SmartStayX application.

## Quick Setup for Vercel

### Step 1: Access Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Click **Add New** for each variable below

### Step 2: Add All Required Variables

Copy and paste each variable name and value into Vercel:

#### Database Configuration

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
```

#### Authentication (Clerk)

```
CLERK_SECRET_KEY=your_clerk_secret_key_here
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret_here
```

#### Cloudinary (Image Upload)

```
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

#### Email Configuration (SMTP)

```
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SENDER_EMAIL=noreply@yourdomain.com
```

#### Optional Variables

```
PORT=3000
NODE_ENV=production
CURRENCY=$
```

**Note:** `VERCEL` is automatically set by Vercel - do not add manually.

### Step 3: Apply to All Environments

When adding each variable, select all environments:
- ✅ Production
- ✅ Preview  
- ✅ Development

### Step 4: Redeploy

After adding all variables:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Wait for deployment to complete

---

## Complete Environment Variables List

### Required Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net` | ✅ Yes |
| `CLERK_SECRET_KEY` | Clerk authentication secret | Get from [Clerk Dashboard](https://dashboard.clerk.com) | ✅ Yes |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook secret | Get from Clerk webhook settings | ✅ Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Get from [Cloudinary Console](https://cloudinary.com/console) | ✅ Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Get from Cloudinary Console | ✅ Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Get from Cloudinary Console | ✅ Yes |
| `SMTP_USER` | SMTP server username | Your email service username | ✅ Yes |
| `SMTP_PASS` | SMTP server password | Your email service password | ✅ Yes |
| `SENDER_EMAIL` | Email address for sending emails | `noreply@yourdomain.com` | ✅ Yes |

### Optional Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port (not used on Vercel) | `3000` | ❌ No |
| `NODE_ENV` | Environment mode | `production` | ❌ No |
| `CURRENCY` | Currency symbol for bookings | `$` | ❌ No |

---

## Where to Get API Keys

### MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (or use existing)
3. Go to **Database Access** → Create database user
4. Go to **Network Access** → Add IP `0.0.0.0/0` (or Vercel IPs)
5. Go to **Database** → Click **Connect** → Copy connection string
6. Format: `mongodb+srv://username:password@cluster.mongodb.net`

### Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys** → Copy **Secret Key** → This is `CLERK_SECRET_KEY`
4. Go to **Webhooks** → Create webhook → Copy **Signing Secret** → This is `CLERK_WEBHOOK_SECRET`

### Cloudinary

1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Sign up or log in
3. Copy values from **Dashboard:**
   - **Cloud name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

### SMTP (Email)

Popular providers:

#### Brevo (formerly Sendinblue)
1. Go to [Brevo](https://www.brevo.com/)
2. Sign up and verify your account
3. Go to **SMTP & API** → **SMTP**
4. Copy:
   - **Server:** `smtp-relay.brevo.com`
   - **Port:** `587`
   - **Login:** Your SMTP username → `SMTP_USER`
   - **Password:** Your SMTP password → `SMTP_PASS`

#### SendGrid
1. Go to [SendGrid](https://sendgrid.com/)
2. Create account and verify
3. Go to **Settings** → **API Keys** → Create API Key
4. Use your SendGrid email → `SMTP_USER`
5. Use API key → `SMTP_PASS`
6. Server: `smtp.sendgrid.net`, Port: `587`

---

## Local Development Setup

1. Create `.env` file in `Server` directory:
   ```bash
   cd Server
   cp .env.example .env  # If .env.example exists
   ```

2. Add all variables to `.env`:
   ```env
   MONGODB_URI=mongodb+srv://...
   CLERK_SECRET_KEY=...
   CLERK_WEBHOOK_SECRET=...
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   SMTP_USER=...
   SMTP_PASS=...
   SENDER_EMAIL=...
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the server:
   ```bash
   npm run server
   ```

---

## Troubleshooting

### Environment variables not working on Vercel

1. ✅ Verify all variables are added in Vercel Dashboard
2. ✅ Check variable names match exactly (case-sensitive)
3. ✅ Ensure all environments are selected (Production, Preview, Development)
4. ✅ Redeploy after adding new variables
5. ✅ Check deployment logs for errors

### Dependencies not installing (nodemailer error)

If you see: `Cannot find package 'nodemailer'`

1. ✅ Verify `package.json` includes `nodemailer` in dependencies
2. ✅ Ensure `package-lock.json` is committed to Git
3. ✅ Check Vercel project settings:
   - **Root Directory:** `Server`
   - **Build Command:** (leave empty or `npm install`)
   - **Install Command:** `npm install`
4. ✅ Redeploy the application

### Database connection fails

1. ✅ Verify `MONGODB_URI` is correct
2. ✅ Check MongoDB Atlas network access allows `0.0.0.0/0` or Vercel IPs
3. ✅ Verify database user credentials are correct

### Email sending fails

1. ✅ Verify `SMTP_USER` and `SMTP_PASS` are correct
2. ✅ Test SMTP credentials with your email provider
3. ✅ Check email service allows sending from Vercel IPs
4. ✅ Verify `SENDER_EMAIL` is a valid email address

---

## Security Best Practices

1. **Never commit `.env` files** to Git
2. **Use different values** for Production, Preview, and Development
3. **Rotate secrets regularly** (update API keys periodically)
4. **Limit access** - Only give team members access who need it
5. **Use Vercel's Environment Variables UI** - Don't expose secrets in code
6. **Review access logs** - Monitor who accesses sensitive data

---

## Quick Reference

### Minimal Setup (Required Only)

```env
MONGODB_URI=mongodb+srv://...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_USER=...
SMTP_PASS=...
SENDER_EMAIL=...
```

### Full Setup (All Variables)

```env
MONGODB_URI=mongodb+srv://...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_USER=...
SMTP_PASS=...
SENDER_EMAIL=...
PORT=3000
NODE_ENV=production
CURRENCY=$
```

