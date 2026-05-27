# Google Calendar API Setup Guide

To enable the Google Calendar sync feature for appointments, follow these steps:

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Create Project** (or select an existing one)
3. Give it a name like "ClinicFlow" and click **Create**

## Step 2: Enable the Google Calendar API

1. In your project, go to **APIs & Services > Library**
2. Search for "Google Calendar API"
3. Click on it and then click **Enable**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. If prompted, configure the **OAuth consent screen**:
   - User Type: **External** (or Internal if you have Google Workspace)
   - App name: "ClinicFlow"
   - User support email: your email
   - Developer contact info: your email
   - Scopes: Add `.../auth/calendar.events` scope (or skip for now, add later)
   - Test users: Add your email address
4. After consent screen config, go back to **Credentials**
5. Click **Create Credentials > OAuth client ID**
6. Application type: **Desktop app**
7. Name: "ClinicFlow Desktop Client"
8. Click **Create**
9. Click **Download JSON** to save the credentials file

## Step 4: Configure the Backend

1. Move the downloaded `credentials.json` to a secure location on your server
2. Open `Clinic/src/main/resources/application.properties`
3. Uncomment and set the path to your credentials file:
   ```properties
   google.calendar.credentials.file.path=C:/path/to/your/credentials.json
   ```

## Step 5: Run and Authenticate

1. Start the Spring Boot application
2. The first time an appointment is created, a browser window will open
3. Sign in with your Google account
4. Grant the requested permissions
5. The app will store the OAuth tokens locally in a `tokens/` directory

## How It Works

- When a new appointment is **created**, a Google Calendar event is automatically created in the connected Google account
- When an appointment status is changed to **CANCELLED**, the corresponding calendar event is deleted
- The event summary includes the patient name and doctor name
- The event description includes full appointment details

## Troubleshooting

- **"Failed to initialize Google Calendar service"**: Check that the credentials file path is correct
- **Tokens expired**: Delete the `tokens/` folder and restart the app to re-authenticate
- **Appointments still work without Google Calendar**: Yes! The system works in "dry-run" mode when Google Calendar is disabled
