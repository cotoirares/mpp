# Tennis App Deployment Guide

This guide explains how to deploy the Tennis App to Vercel and set up MongoDB Atlas for the database.

## 1. MongoDB Atlas Setup

1. **Create a MongoDB Atlas account**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up for a free account

2. **Create a new cluster**
   - Choose the free tier (M0)
   - Select a cloud provider (AWS/Google Cloud/Azure) and region closest to your users
   - Leave default settings and click "Create Cluster"

3. **Set up database access**
   - Go to Database Access → Add New Database User
   - Create a username and password (save these securely)
   - Set privileges to "Read and Write to Any Database"

4. **Set up network access**
   - Go to Network Access → Add IP Address
   - Select "Allow Access from Anywhere" (for Vercel deployment)
   - Confirm by clicking "Confirm"

5. **Get your connection string**
   - Go to "Clusters" → "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user's password

## 2. Vercel Deployment

1. **Create a Vercel account**
   - Go to https://vercel.com/signup
   - Sign up with GitHub, GitLab, or email

2. **Install Vercel CLI (optional)**
   ```bash
   npm install -g vercel
   ```

3. **Set up environment variables in Vercel**
   - Go to your Vercel dashboard
   - Select your project (after importing from GitHub)
   - Go to Settings → Environment Variables
   - Add the following environment variables:
     - `MONGODB_URI` - Your MongoDB Atlas connection string
     - `JWT_SECRET` - A secure random string for JWT token signing

4. **Deploy using Vercel CLI (optional)**
   ```bash
   vercel login
   vercel
   ```

5. **Deploy using Vercel Dashboard**
   - Connect your GitHub repository to Vercel
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure project settings:
     - Build Command: `npm run build`
     - Output Directory: `.next`
     - Install Command: `npm install`
   - Click "Deploy"

## 3. Post-Deployment

1. **Test the deployment**
   - Visit your deployment URL
   - Test login/registration
   - Test main app features

2. **Monitor the application**
   - Check Vercel logs for any errors
   - Monitor MongoDB Atlas metrics

3. **Setup a custom domain (optional)**
   - Go to Vercel project settings → Domains
   - Add your custom domain
   - Follow the DNS configuration instructions

## Troubleshooting

- **Database Connection Issues**
  - Verify MongoDB Atlas connection string
  - Check network access settings in MongoDB Atlas
  - Verify environment variables are set correctly in Vercel

- **Build Errors**
  - Check Vercel build logs
  - Test build locally with `npm run build`
  - Verify dependencies are correctly specified

- **Runtime Errors**
  - Check browser console for errors
  - Check Vercel function logs
  - Verify API endpoints are working correctly 