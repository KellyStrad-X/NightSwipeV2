# Development Environment Setup Guide

**Difficulty:** 🟡 Medium
**Time Required:** 30-60 minutes
**Cost:** Free
**Prerequisites:** Computer with macOS, Windows, or Linux

---

## What You'll Accomplish

By the end of this guide, you'll have:
- ✅ Node.js and npm installed
- ✅ Git version control ready
- ✅ Code editor (VS Code) configured
- ✅ Expo CLI for React Native development
- ✅ Ability to run the NightSwipe app locally

---

## Table of Contents

1. [Install Node.js and npm](#1-install-nodejs-and-npm)
2. [Install Git](#2-install-git)
3. [Install VS Code](#3-install-vs-code)
4. [Install Expo CLI](#4-install-expo-cli)
5. [Clone the Project](#5-clone-the-project)
6. [Install Dependencies](#6-install-dependencies)
7. [Run the App](#7-run-the-app)
8. [Common Errors](#8-common-errors)

---

## 1. Install Node.js and npm

### What are Node.js and npm?
- **Node.js:** Runs JavaScript code outside the browser (needed for backend and build tools)
- **npm:** Package manager (installs libraries like React, Express, etc.)

---

### macOS Installation

**Option 1: Using Homebrew (Recommended)**

1. Install Homebrew (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install Node.js:
   ```bash
   brew install node@18
   ```

3. Verify installation:
   ```bash
   node --version  # Should show v18.x.x
   npm --version   # Should show 9.x.x or higher
   ```

**Option 2: Direct Download**

1. Go to: https://nodejs.org
2. Download **LTS version** (v18.x.x)
3. Run the installer
4. Accept defaults, click "Install"
5. Verify in Terminal:
   ```bash
   node --version
   npm --version
   ```

---

### Windows Installation

1. Go to: https://nodejs.org
2. Download **Windows Installer (.msi)** - LTS version
3. Run the installer
4. **Important:** Check the box "Automatically install the necessary tools"
5. Click through the wizard, accepting defaults
6. Restart your computer
7. Open Command Prompt and verify:
   ```cmd
   node --version
   npm --version
   ```

**If "command not found":**
- Restart Command Prompt
- If still not working, Node.js is not in PATH - reinstall and ensure "Add to PATH" is checked

---

### Linux (Ubuntu/Debian) Installation

```bash
# Update package manager
sudo apt update

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

---

## 2. Install Git

### What is Git?
Version control system that tracks code changes and lets you collaborate with others.

---

### macOS

Git is pre-installed on macOS! Verify:
```bash
git --version
```

If not installed, run:
```bash
brew install git
```

---

### Windows

1. Go to: https://git-scm.com/download/win
2. Download and run installer
3. **Important settings during install:**
   - Editor: Select "Use Visual Studio Code" (or default)
   - PATH: "Git from the command line and also from 3rd-party software"
   - Line endings: "Checkout Windows-style, commit Unix-style"
   - Terminal: "Use MinTTY"
4. Click "Install"
5. Verify in Command Prompt:
   ```cmd
   git --version
   ```

---

### Linux

```bash
sudo apt update
sudo apt install git
git --version
```

---

### Configure Git (All Platforms)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

Replace with your actual name and email.

---

## 3. Install VS Code

### Why VS Code?
- Free, powerful code editor
- Extensions for React Native, JavaScript, and more
- Integrated terminal

---

### All Platforms

1. Go to: https://code.visualstudio.com
2. Download for your OS
3. Install (accept defaults)
4. Open VS Code

---

### Recommended Extensions

1. Open VS Code
2. Click Extensions icon (left sidebar, or `Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search and install these:
   - **ES7+ React/Redux/React-Native snippets** (by dsznajder)
   - **Prettier - Code formatter** (by Prettier)
   - **ESLint** (by Microsoft)
   - **GitLens** (by GitKraken)
   - **React Native Tools** (by Microsoft)

---

### Configure VS Code

1. Open Settings: `Ctrl+,` (Windows/Linux) or `Cmd+,` (Mac)
2. Search for "format on save"
3. Check ✅ "Editor: Format On Save"
4. Search for "default formatter"
5. Set to: "Prettier - Code formatter"

---

## 4. Install Expo CLI

### What is Expo?
Framework for React Native that makes building mobile apps easier.

---

### Install Expo CLI Globally

```bash
npm install -g expo-cli
```

Wait 1-2 minutes for installation.

**Verify:**
```bash
expo --version
```

Should show version 6.x.x or higher.

---

### Install Expo Go App (On Your Phone)

**For testing the app on your phone:**

1. **iOS:** Download "Expo Go" from App Store
2. **Android:** Download "Expo Go" from Google Play Store

---

## 5. Clone the Project

### If Project is on GitHub

```bash
# Navigate to where you want the project
cd ~/Desktop  # or any folder

# Clone repository
git clone https://github.com/YOUR_USERNAME/nightswipe-frontend.git
git clone https://github.com/YOUR_USERNAME/nightswipe-backend.git

# Enter directories
cd nightswipe-frontend
```

Replace `YOUR_USERNAME` with your GitHub username.

---

### If Starting from Scratch

**Create Frontend (Expo React Native):**
```bash
npx create-expo-app nightswipe-frontend
cd nightswipe-frontend
```

**Create Backend (Node.js/Express):**
```bash
mkdir nightswipe-backend
cd nightswipe-backend
npm init -y
npm install express cors dotenv pg bcrypt jsonwebtoken
```

---

## 6. Install Dependencies

### Frontend

```bash
cd nightswipe-frontend
npm install
```

This installs all packages listed in `package.json`.

**Wait 2-5 minutes** for installation.

**✅ Success:** No error messages, `node_modules/` folder created.

---

### Backend

```bash
cd nightswipe-backend
npm install
```

---

## 7. Run the App

### Start Backend

```bash
cd nightswipe-backend
npm start
```

**Expected output:**
```
Server listening on port 3000
Database connected
```

Leave this terminal window open.

---

### Start Frontend (in new terminal)

```bash
cd nightswipe-frontend
npx expo start
```

**Expected output:**
```
Metro waiting on exp://192.168.1.x:8081
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
```

---

### Run on Your Phone

1. Open Expo Go app on your phone
2. **iOS:** Scan QR code in terminal with Camera app
3. **Android:** Scan QR code in terminal with Expo Go app
4. App should load on your phone!

**Make sure phone and computer are on same WiFi network.**

---

### Run on Simulator (macOS Only for iOS)

**iOS Simulator:**

1. Install Xcode from App Store (large download, 10+ GB)
2. Open Xcode, go to Preferences → Locations → Command Line Tools (select Xcode version)
3. In Expo terminal, press `i` to open iOS simulator

**Android Emulator (All Platforms):**

1. Install Android Studio: https://developer.android.com/studio
2. Open Android Studio → Tools → AVD Manager
3. Create Virtual Device (e.g., Pixel 5)
4. In Expo terminal, press `a` to open Android emulator

---

## 8. Common Errors

### Error: `command not found: node` or `command not found: npm`

**Cause:** Node.js not installed or not in PATH
**Fix:**
1. Reinstall Node.js
2. Restart terminal/computer
3. Check PATH:
   ```bash
   echo $PATH  # Mac/Linux
   echo %PATH%  # Windows
   ```
4. Node should be in PATH (e.g., `/usr/local/bin` on Mac)

---

### Error: `EACCES: permission denied` (Mac/Linux)

**Cause:** npm trying to install globally without permissions
**Fix:**
```bash
sudo npm install -g expo-cli
```

Or fix npm permissions (recommended):
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

---

### Error: `npm ERR! code ELIFECYCLE`

**Cause:** Installation failed, possibly due to incompatible package versions
**Fix:**
1. Delete `node_modules` and `package-lock.json`:
   ```bash
   rm -rf node_modules package-lock.json
   ```
2. Reinstall:
   ```bash
   npm install
   ```

---

### Error: `Expo command not found` after install

**Cause:** Global npm packages not in PATH
**Fix:**
```bash
# Find where npm global packages are
npm config get prefix

# Add to PATH (Mac/Linux)
echo 'export PATH="$PATH:~/.npm-global/bin"' >> ~/.zshrc
source ~/.zshrc
```

---

### Error: `Metro Bundler can't listen on port 8081`

**Cause:** Port already in use
**Fix:**
1. Kill process on port 8081:
   ```bash
   # Mac/Linux
   lsof -ti:8081 | xargs kill

   # Windows
   netstat -ano | findstr :8081
   taskkill /PID <PID> /F
   ```
2. Or start Expo on different port:
   ```bash
   npx expo start --port 8082
   ```

---

### Error: `Unable to connect to Expo Go`

**Cause:** Phone and computer on different networks
**Fix:**
1. Ensure both on same WiFi
2. Try tunnel mode:
   ```bash
   npx expo start --tunnel
   ```
3. Or connect via USB (see Expo docs)

---

## 9. Development Workflow

### Daily Workflow

1. Open VS Code
2. Open terminal (`` Ctrl+` `` or `` Cmd+` ``)
3. Start backend: `npm start` (in backend folder)
4. Open new terminal tab
5. Start frontend: `npx expo start` (in frontend folder)
6. Make code changes (auto-reload on save)
7. Test on phone or simulator

---

### Hot Reload

**Frontend:** Expo auto-reloads when you save files (Cmd+S or Ctrl+S)

**Backend:** Need to restart server manually, or install `nodemon`:
```bash
npm install --save-dev nodemon
```

Update `package.json`:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

Run with: `npm run dev`

---

## 10. Useful Terminal Commands

```bash
# Check versions
node --version
npm --version
git --version
expo --version

# Clear terminal
clear  # Mac/Linux
cls    # Windows

# Stop running process
Ctrl+C  # All platforms

# Navigate folders
cd folder-name      # Enter folder
cd ..               # Go up one level
pwd                 # Show current path
ls                  # List files (Mac/Linux)
dir                 # List files (Windows)

# Git basics
git status          # See changed files
git add .           # Stage all changes
git commit -m "msg" # Commit changes
git push            # Push to GitHub
git pull            # Pull from GitHub
```

---

## Need Help?

### Official Documentation
- Node.js: https://nodejs.org/docs
- npm: https://docs.npmjs.com
- Expo: https://docs.expo.dev
- VS Code: https://code.visualstudio.com/docs

### Common Questions

**Q: Do I need Xcode to develop for iOS?**
A: No! You can test on your iPhone using Expo Go. Xcode only needed for simulator or production builds.

**Q: Which Node version should I use?**
A: LTS version (18.x as of this guide). Avoid "Current" version (may have bugs).

**Q: Can I use Yarn instead of npm?**
A: Yes! Yarn is faster. Install with: `npm install -g yarn`, then use `yarn` instead of `npm install`.

**Q: Why is `npm install` taking so long?**
A: Normal for large projects (5-10 min on slow connections). Installs hundreds of packages.

---

**✅ Guide Complete!** Your development environment is ready.

**Next Guide:** [Environment Variables Guide](./05_Environment_Variables.md)
