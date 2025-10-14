# Database Setup Guide

**Difficulty:** 🔴 High
**Time Required:** 45-60 minutes (local) or 20-30 minutes (cloud)
**Cost:** Free options available
**Prerequisites:** Terminal/Command Prompt access

---

## What You'll Accomplish

By the end of this guide, you'll have:
- ✅ A database installed and running (local or cloud)
- ✅ Database connection string for your backend
- ✅ Understanding of database basics
- ✅ A plan for development vs production databases

---

## Table of Contents

1. [Understanding Databases](#1-understanding-databases)
2. [Choosing Your Database](#2-choosing-your-database)
3. [Option A: Local PostgreSQL Setup](#3-option-a-local-postgresql-setup)
4. [Option B: Cloud Database (Recommended for Beginners)](#4-option-b-cloud-database-recommended-for-beginners)
5. [Testing Your Database Connection](#5-testing-your-database-connection)
6. [Common Errors](#6-common-errors)
7. [Next Steps](#7-next-steps)

---

## 1. Understanding Databases

### What is a database?
A database stores your app's data:
- User accounts (email, password, name)
- Sessions (who's in a session, session status)
- Swipes (which places users liked)
- Place cache (Google Places data we've already fetched)

### PostgreSQL vs MongoDB vs Firebase

**PostgreSQL (Recommended for NightSwipe):**
- ✅ Structured data (tables, rows, columns)
- ✅ Relationships (users → sessions → swipes)
- ✅ SQL queries (industry standard)
- ✅ Free hosting options

**MongoDB:**
- Flexible data structure (JSON-like documents)
- Good for unstructured data
- Less strict about relationships

**Firebase:**
- Easiest to set up
- Real-time sync built-in
- More expensive at scale
- Less control

**For NightSwipe MVP, we recommend PostgreSQL.**

---

## 2. Choosing Your Database

### Local vs Cloud

**Local Database (For Development):**
- ✅ Free
- ✅ Fast (no network latency)
- ✅ Full control
- ❌ Harder to set up
- ❌ Need to run database server locally
- ❌ Can't access from deployed app

**Cloud Database (For Production):**
- ✅ Easy to set up
- ✅ Always accessible
- ✅ Automatic backups
- ❌ May cost money (but free tiers available)
- ❌ Slight network latency

**Recommended Strategy:**
- Development: Local PostgreSQL
- Production: Cloud PostgreSQL (Heroku, Railway, Supabase)

---

## 3. Option A: Local PostgreSQL Setup

Choose your operating system:

---

### macOS Setup

#### Step 1: Install Homebrew (if not installed)

1. Open **Terminal** (Applications → Utilities → Terminal)
2. Run this command:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
3. Press **Enter** when prompted
4. Enter your Mac password when asked (you won't see characters as you type - this is normal)
5. Wait 5-10 minutes for installation

**✅ Success indicator:** Terminal shows "Installation successful!"

---

#### Step 2: Install PostgreSQL

1. In Terminal, run:
   ```bash
   brew install postgresql@15
   ```
2. Wait for download and installation (2-5 minutes)

**✅ Success indicator:** Terminal shows "postgresql@15 ... installed"

---

#### Step 3: Start PostgreSQL Service

1. Run:
   ```bash
   brew services start postgresql@15
   ```
2. Verify it's running:
   ```bash
   brew services list
   ```
3. Look for `postgresql@15` with status `started` (green)

**✅ Success indicator:** PostgreSQL is listed as "started"

---

#### Step 4: Create Database and User

1. Access PostgreSQL shell:
   ```bash
   psql postgres
   ```
   You should see a prompt: `postgres=#`

2. Create a database:
   ```sql
   CREATE DATABASE nightswipe_dev;
   ```
   (Hit Enter - you should see `CREATE DATABASE`)

3. Create a user:
   ```sql
   CREATE USER nightswipe_user WITH PASSWORD 'your_secure_password';
   ```
   (Replace `your_secure_password` with something secure)

4. Grant permissions:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE nightswipe_dev TO nightswipe_user;
   ```

5. Exit PostgreSQL shell:
   ```sql
   \q
   ```

**✅ Success indicator:** Back to normal Terminal prompt

---

#### Step 5: Get Your Connection String

Your connection string is:
```
postgresql://nightswipe_user:your_secure_password@localhost:5432/nightswipe_dev
```

**Save this!** You'll need it in your `.env` file.

---

### Windows Setup

#### Step 1: Download PostgreSQL Installer

1. Go to: https://www.postgresql.org/download/windows/
2. Click **"Download the installer"**
3. Choose **"Windows x86-64"** for version **15.x**
4. Download will start (250MB file)

---

#### Step 2: Run Installer

1. Double-click the downloaded `.exe` file
2. Click **"Next"** through welcome screens
3. **Installation Directory:** Leave default (`C:\Program Files\PostgreSQL\15`)
4. **Select Components:** Check all boxes
5. **Data Directory:** Leave default
6. **Password:** Enter a password for the `postgres` superuser
   - **IMPORTANT:** Remember this password!
   - Write it down somewhere safe
7. **Port:** Leave as `5432`
8. **Locale:** Leave default
9. Click **"Next"** → **"Install"**
10. Wait 5-10 minutes
11. Uncheck **"Launch Stack Builder"** at the end
12. Click **"Finish"**

**✅ Success indicator:** PostgreSQL installed successfully

---

#### Step 3: Add PostgreSQL to PATH

1. Press **Windows key**, type **"Environment Variables"**
2. Click **"Edit the system environment variables"**
3. Click **"Environment Variables"** button
4. Under **"System variables"**, find **"Path"**, click **"Edit"**
5. Click **"New"**
6. Add: `C:\Program Files\PostgreSQL\15\bin`
7. Click **"OK"** on all windows
8. **Close and reopen Command Prompt** (important!)

---

#### Step 4: Create Database and User

1. Open **Command Prompt** (Windows key → type "cmd")
2. Run:
   ```cmd
   psql -U postgres
   ```
3. Enter the password you set during installation
4. You should see: `postgres=#`

5. Create database:
   ```sql
   CREATE DATABASE nightswipe_dev;
   ```

6. Create user:
   ```sql
   CREATE USER nightswipe_user WITH PASSWORD 'your_secure_password';
   ```

7. Grant permissions:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE nightswipe_dev TO nightswipe_user;
   ```

8. Exit:
   ```sql
   \q
   ```

**✅ Success indicator:** Back to Command Prompt

---

#### Step 5: Get Your Connection String

Your connection string is:
```
postgresql://nightswipe_user:your_secure_password@localhost:5432/nightswipe_dev
```

---

### Linux (Ubuntu/Debian) Setup

#### Step 1: Install PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

Enter password when prompted.

---

#### Step 2: Start PostgreSQL

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Start on boot
```

---

#### Step 3: Create Database and User

```bash
sudo -u postgres psql
```

Then run:
```sql
CREATE DATABASE nightswipe_dev;
CREATE USER nightswipe_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE nightswipe_dev TO nightswipe_user;
\q
```

---

#### Step 4: Get Your Connection String

```
postgresql://nightswipe_user:your_secure_password@localhost:5432/nightswipe_dev
```

---

## 4. Option B: Cloud Database (Recommended for Beginners)

We'll use **Supabase** (free tier, PostgreSQL-based, easy setup).

**Alternatives:**
- Railway (also easy, $5/month after trial)
- Heroku Postgres (used to be free, now $5/month minimum)
- Neon (serverless PostgreSQL, generous free tier)

---

### Supabase Setup (Free Forever Tier)

#### Step 1: Create Account

1. Go to: https://supabase.com
2. Click **"Start your project"**
3. Sign up with GitHub (easiest) or email
4. Confirm your email if using email signup

---

#### Step 2: Create New Project

1. Click **"New Project"**
2. Choose organization (create one if needed):
   - Organization name: Your name or "NightSwipe"
3. Fill in project details:
   - **Name:** `nightswipe-mvp`
   - **Database Password:** Generate a strong password
     - **IMPORTANT:** Copy this password immediately!
     - Save it in a password manager
   - **Region:** Choose closest to you (e.g., "US East" if in USA)
   - **Plan:** Free (should be selected by default)
4. Click **"Create new project"**
5. Wait 2-3 minutes for database to provision

**What you should see:**
> _[Screenshot placeholder: Supabase project creation]_

---

#### Step 3: Get Your Connection String

1. In your Supabase project dashboard, click **"Project Settings"** (gear icon, bottom left)
2. Click **"Database"** in the sidebar
3. Scroll down to **"Connection string"**
4. Select **"URI"** tab
5. You'll see something like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
6. **Replace `[YOUR-PASSWORD]`** with the password you created in Step 2
7. Copy the full string

**Example:**
```
postgresql://postgres:MySecurePass123@db.abcdefghijk.supabase.co:5432/postgres
```

**SAVE THIS!** You'll need it for your backend.

---

#### Step 4: Enable Connection Pooling (Recommended)

1. Still in **Database** settings
2. Scroll to **"Connection pooling"**
3. Toggle **"Enable"**
4. Copy the **"Connection pooling"** string (different from above)
5. This one starts with `postgresql://postgres.xxxx...`
6. Use this for your backend in production (better performance)

---

### Supabase Free Tier Limits

**What you get for FREE:**
- 500MB database storage
- Unlimited API requests
- 50,000 monthly active users
- Automatic backups (7 days)

**For MVP:** More than enough!

**Upgrade needed when:**
- Database > 500MB (unlikely for MVP)
- Need custom domains
- Need more backups

---

## 5. Testing Your Database Connection

### Using Terminal/Command Prompt

Test your connection string:

**macOS/Linux:**
```bash
psql "postgresql://nightswipe_user:your_password@localhost:5432/nightswipe_dev"
```

**Windows:**
```cmd
psql "postgresql://nightswipe_user:your_password@localhost:5432/nightswipe_dev"
```

**Supabase:**
```bash
psql "postgresql://postgres:your_password@db.xxx.supabase.co:5432/postgres"
```

**What you should see:**
```
psql (15.x)
Type "help" for help.

nightswipe_dev=>
```

**Try a test query:**
```sql
SELECT version();
```

Should show PostgreSQL version.

Type `\q` to exit.

---

### Using a GUI Tool (Easier for Non-Developers)

**pgAdmin (Free, Cross-Platform):**

1. Download from: https://www.pgadmin.org/download/
2. Install and open
3. Right-click **"Servers"** → **"Register" → "Server"**
4. Fill in:
   - **General Tab:**
     - Name: `NightSwipe Local` (or `NightSwipe Supabase`)
   - **Connection Tab:**
     - Host: `localhost` (or `db.xxx.supabase.co` for Supabase)
     - Port: `5432`
     - Database: `nightswipe_dev` (or `postgres` for Supabase)
     - Username: `nightswipe_user` (or `postgres` for Supabase)
     - Password: Your password
5. Click **"Save"**
6. Expand **"Servers" → "NightSwipe Local" → "Databases"**
7. You should see your database!

**What you should see:**
> _[Screenshot placeholder: pgAdmin successful connection]_

---

## 6. Common Errors

### Error: `psql: command not found`

**Cause:** PostgreSQL bin folder not in PATH
**Fix (macOS):**
```bash
echo 'export PATH="/usr/local/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Fix (Windows):**
- Re-do "Add to PATH" steps in Windows Setup
- Make sure to close and reopen Command Prompt

---

### Error: `FATAL: password authentication failed`

**Cause:** Wrong username or password
**Fix:**
1. Double-check your password (no extra spaces)
2. Reset password if needed:
   ```bash
   psql -U postgres
   ALTER USER nightswipe_user WITH PASSWORD 'new_password';
   ```

---

### Error: `could not connect to server: Connection refused`

**Cause:** PostgreSQL service not running
**Fix (macOS):**
```bash
brew services start postgresql@15
```

**Fix (Windows):**
1. Press Windows key → "Services"
2. Find "postgresql-x64-15"
3. Right-click → "Start"

**Fix (Linux):**
```bash
sudo systemctl start postgresql
```

---

### Error: `database "nightswipe_dev" does not exist`

**Cause:** Database not created yet
**Fix:**
```bash
psql -U postgres
CREATE DATABASE nightswipe_dev;
\q
```

---

### Error (Supabase): `no pg_hba.conf entry for host`

**Cause:** Connection pooling enabled but using wrong connection string
**Fix:**
- Use the "Direct connection" string for `psql` CLI
- Use "Connection pooling" string for backend code

---

## 7. Next Steps

### Save Your Connection String

1. Open your backend project
2. Create a `.env` file (if not exists)
3. Add this line:
   ```
   DATABASE_URL=postgresql://nightswipe_user:your_password@localhost:5432/nightswipe_dev
   ```
4. Replace with your actual connection string
5. **IMPORTANT:** Add `.env` to `.gitignore`

**Example `.env`:**
```bash
# Database
DATABASE_URL=postgresql://nightswipe_user:SecurePass123@localhost:5432/nightswipe_dev

# Google Places API
GOOGLE_PLACES_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

### Create Database Tables (Schema)

We'll create tables in **Sprint 01 (S-101)** when setting up the backend.

**Preview of tables we'll create:**
- `users` - User accounts
- `sessions` - Swipe sessions
- `session_members` - Who's in each session
- `swipes` - User swipes (left/right)
- `places_cache` - Cached Google Places data

We'll use **migrations** to create these (covered in backend setup).

---

### Backup Strategy

**Local Database:**
- Backup command:
  ```bash
  pg_dump nightswipe_dev > backup.sql
  ```
- Restore command:
  ```bash
  psql nightswipe_dev < backup.sql
  ```

**Supabase:**
- Automatic daily backups (7-day retention)
- Manual backup: Database Settings → "Backups" → "Backup now"

---

## 8. Database Best Practices

### ✅ DO:
- Use different databases for dev/staging/production
- Back up regularly (Supabase does this automatically)
- Use connection pooling in production
- Keep passwords secure (`.env` file, not in code)
- Use migrations for schema changes

### ❌ DON'T:
- Commit database passwords to Git
- Use production database for testing
- Delete data without backups
- Share database credentials in Slack/email
- Run SQL commands you don't understand on production

---

## 9. Troubleshooting Checklist

Before asking for help, check:

- [ ] PostgreSQL service is running (`brew services list` or "Services" on Windows)
- [ ] Connection string has correct username, password, host, port
- [ ] No extra spaces in connection string
- [ ] Database actually exists (check in pgAdmin or `psql -l`)
- [ ] `.env` file is in correct directory (backend project root)
- [ ] `.env` file is loaded by your backend code (we'll cover this in backend setup)

---

## 10. What's Next?

Now that you have a database:

1. ✅ **Test connection** with `psql` or pgAdmin
2. ✅ **Save connection string** in `.env` file
3. ✅ **Add `.env` to `.gitignore`**
4. ✅ **Set up backend** (see Backend Deployment Guide)
5. ✅ **Create tables** (Sprint 01 - we'll guide you)

---

## Need Help?

### Official PostgreSQL Documentation
- Getting Started: https://www.postgresql.org/docs/current/tutorial.html
- psql Commands: https://www.postgresql.org/docs/current/app-psql.html

### Supabase Documentation
- Quickstart: https://supabase.com/docs/guides/getting-started
- Connection Strings: https://supabase.com/docs/guides/database/connecting-to-postgres

### Common Questions

**Q: Can I use MySQL instead of PostgreSQL?**
A: Yes, but our guides assume PostgreSQL. MySQL works similarly but some SQL syntax differs.

**Q: Do I need pgAdmin or can I use Terminal only?**
A: Terminal is fine! pgAdmin just makes it easier to visualize your data.

**Q: What if I forget my database password?**
A: Reset it using the `ALTER USER` command (shown in Common Errors section).

**Q: Should I use the same database for dev and production?**
A: No! Always use separate databases. Local for dev, cloud for production.

**Q: How do I know if my database is full?**
A: Supabase shows storage usage in dashboard. Local PostgreSQL has no hard limit (depends on disk space).

---

**✅ Guide Complete!** You now have a working database.

**Next Guide:** [Backend Deployment Guide](./03_Backend_Deployment.md)
