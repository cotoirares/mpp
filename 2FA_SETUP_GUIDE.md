# Two-Factor Authentication (2FA) Setup Guide

## Overview

This tennis player management application now includes Two-Factor Authentication (2FA) using Time-based One-Time Passwords (TOTP). This adds an extra layer of security to user accounts by requiring a second form of authentication beyond just the username and password.

## Features

- **TOTP-based 2FA**: Compatible with popular authenticator apps like Google Authenticator, Authy, Microsoft Authenticator, etc.
- **QR Code Setup**: Easy setup by scanning a QR code with your authenticator app
- **Backup Codes**: 10 backup codes generated during setup for account recovery
- **Flexible Login**: Supports both regular login and 2FA-enabled login flows
- **Account Management**: Enable/disable 2FA from the settings page

## How to Set Up 2FA

### Step 1: Register and Login
1. Create an account or login to your existing account
2. Navigate to the **Settings** page using the link in the navigation bar

### Step 2: Enable 2FA
1. In the Settings page, find the "Two-Factor Authentication" section
2. Click the **"Enable 2FA"** button
3. A QR code will be displayed along with backup codes

### Step 3: Configure Your Authenticator App
1. Open your authenticator app (Google Authenticator, Authy, etc.)
2. Scan the QR code displayed on the screen
3. Your app will now generate 6-digit codes for this account

### Step 4: Verify Setup
1. Enter the 6-digit code from your authenticator app
2. Click **"Enable 2FA"** to complete the setup
3. **Important**: Save the backup codes in a secure location

## How to Login with 2FA

### Regular Login Process
1. Enter your email and password as usual
2. Click **"Login"**

### If 2FA is Enabled
1. After entering email/password, you'll see a 2FA verification screen
2. Open your authenticator app and get the current 6-digit code
3. Enter the code and click **"Verify Code"**
4. You'll be logged in successfully

### Using Backup Codes
If you don't have access to your authenticator app:
1. On the 2FA verification screen, enter one of your backup codes instead of the 6-digit code
2. Click **"Verify Code"**
3. **Note**: Each backup code can only be used once

## Managing 2FA Settings

### Disabling 2FA
1. Go to **Settings** page
2. In the 2FA section, click **"Disable 2FA"**
3. Enter a 6-digit code from your authenticator app or use a backup code
4. Click **"Disable 2FA"** to confirm

### Re-enabling 2FA
If you previously disabled 2FA, you can re-enable it by following the setup process again. This will generate new QR codes and backup codes.

## Security Best Practices

1. **Save Backup Codes**: Store your backup codes in a secure location (password manager, safe, etc.)
2. **Don't Share Codes**: Never share your 6-digit codes or backup codes with anyone
3. **Secure Your Phone**: Keep your phone locked and secure since it contains your authenticator app
4. **Regular Updates**: Keep your authenticator app updated
5. **Multiple Devices**: Consider setting up the same account on multiple devices for redundancy

## Supported Authenticator Apps

- Google Authenticator (iOS/Android)
- Authy (iOS/Android/Desktop)
- Microsoft Authenticator (iOS/Android)
- 1Password (with TOTP support)
- Bitwarden (with TOTP support)
- Any TOTP-compatible authenticator app

## Troubleshooting

### "Invalid 2FA token" Error
- Ensure your device's time is synchronized (TOTP is time-based)
- Try the next code if the current one doesn't work
- Use a backup code if authenticator codes aren't working

### Lost Access to Authenticator App
- Use one of your backup codes to login
- Disable 2FA from settings and set it up again with a new device

### QR Code Not Scanning
- Ensure good lighting and steady hands
- Try manually entering the secret key if your app supports it
- Refresh the page to generate a new QR code

## Technical Implementation

### Backend Features
- TOTP secret generation using `speakeasy` library
- QR code generation for easy setup
- Backup code generation and management
- Secure token verification with time window tolerance
- Database storage of 2FA settings per user

### Frontend Features
- Responsive 2FA setup interface
- QR code display for authenticator app setup
- Two-step login process for 2FA-enabled accounts
- Settings page for 2FA management
- Real-time feedback and error handling

### Security Measures
- Secrets stored securely in the database
- Time-based token verification with drift tolerance
- One-time use backup codes
- Secure API endpoints with authentication required
- Client-side validation and error handling

## API Endpoints

- `POST /api/auth/2fa/setup` - Initialize 2FA setup
- `POST /api/auth/2fa/enable` - Enable 2FA after verification
- `POST /api/auth/2fa/disable` - Disable 2FA
- `POST /api/auth/login` - Login with optional 2FA token
- `GET /api/auth/profile` - Get user profile with 2FA status

## Deployment Notes

The 2FA functionality has been implemented in both the main backend server and the fallback server to ensure compatibility in all deployment scenarios:

### Main Backend Server
- Uses TypeScript with proper type definitions
- Implements the AuthService class with full 2FA functionality
- Includes proper error handling and validation

### Fallback Server
- JavaScript implementation for compatibility
- Includes all 2FA endpoints with the same functionality
- Automatically handles fallback scenarios when the main server is unavailable

Both implementations use the same database schema and provide identical API responses, ensuring seamless operation regardless of which server is active.

This implementation follows industry best practices for 2FA and provides a secure, user-friendly experience for managing account security. 