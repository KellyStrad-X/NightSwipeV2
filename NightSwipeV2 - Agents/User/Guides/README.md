# NightSwipe Setup Guides for Non-Developers

**Purpose:** Step-by-step guides to help you set up NightSwipe MVP without prior development experience.

**Created:** 2025-10-05
**Maintainer:** Claude (Code Implementor)

---

## 📚 Guide Index

### 🔴 Must-Have (Sprint 01-02) ✅ COMPLETE

**Complete these FIRST before starting development:**

| # | Guide | Difficulty | Time | Status |
|---|-------|-----------|------|--------|
| 01 | [Google Places API Setup](./01_Google_Places_API_Setup.md) | 🔴 High | 30-45 min | ✅ |
| 02 | [Database Setup](./02_Database_Setup.md) | 🔴 High | 45-60 min | ✅ |
| 03 | [Backend Deployment](./03_Backend_Deployment.md) | 🔴 High | 30-45 min | ✅ |
| 04 | [Development Environment Setup](./04_Dev_Environment_Setup.md) | 🟡 Medium | 30-60 min | ✅ |
| 05 | [Environment Variables](./05_Environment_Variables.md) | 🟡 Medium | 15-20 min | ✅ |

---

### 🟡 Should-Have (Sprint 03-04) ⏳ PENDING

**Complete these when needed:**

| # | Guide | Difficulty | Time | Needed For | Status |
|---|-------|-----------|------|------------|--------|
| 06 | [Authentication Testing](./06_Authentication_Testing.md) | 🟡 Medium | 15-30 min | Sprint 01 (S-201, S-202) | ✅ |
| 07 | Deep Linking Configuration | 🔴 High | 45-60 min | Sprint 02 (S-203) | ⏳ Pending |
| 08 | API Key Security Best Practices | 🟢 Easy | 15-20 min | Sprint 01-02 | ⏳ Pending |

---

### 🟢 Nice-to-Have (Sprint 05) 💡 OPTIONAL

**Complete when ready for production:**

| # | Guide | Difficulty | Time | Status |
|---|-------|-----------|------|--------|
| 09 | TestFlight & Play Store Deployment | 🔴 High | 60-90 min | 💡 Future |
| 10 | Git Basics for Non-Developers | 🟢 Easy | 20-30 min | 💡 Future |
| 11 | Debugging Production Issues | 🟡 Medium | 30 min | 💡 Future |

---

## 🎯 Quick Start Path

**Never developed before? Follow this exact order:**

### Week 1: Setup
1. ✅ [Development Environment Setup](./04_Dev_Environment_Setup.md) - Install tools
2. ✅ [Environment Variables](./05_Environment_Variables.md) - Understand .env files
3. ✅ [Google Places API Setup](./01_Google_Places_API_Setup.md) - Get API key

### Week 2: Infrastructure
4. ✅ [Database Setup](./02_Database_Setup.md) - Local PostgreSQL or Supabase
5. ✅ [Backend Deployment](./03_Backend_Deployment.md) - Deploy to Railway

### Sprint 02-03: Advanced
6. ⏳ Deep Linking Configuration (when implementing S-203)
7. ⏳ Authentication Setup (when implementing S-201, S-202)

---

## 📖 Guide Features

Each guide includes:
- ✅ **Clear learning objectives** - What you'll accomplish
- ✅ **Step-by-step instructions** - No skipped steps
- ✅ **Platform-specific** - macOS, Windows, Linux
- ✅ **Screenshots** - Visual guidance (placeholders for now)
- ✅ **Common errors** - Solutions to frequent problems
- ✅ **Success indicators** - "How do I know it worked?"
- ✅ **Cost breakdowns** - Know what you'll pay
- ✅ **Security warnings** - Avoid exposing secrets

---

## 💡 Tips for Success

### Before You Start
- ☕ **Set aside time** - Don't rush through setup
- 📝 **Take notes** - Document your specific setup
- 💾 **Save credentials** - Use a password manager
- 🆘 **Ask for help** - Get stuck? Check Common Errors sections first

### During Setup
- ✅ **Follow steps exactly** - Order matters
- ⚠️ **Read warnings** - Especially about security
- 🔄 **Test as you go** - Verify each step before moving on
- 📸 **Screenshot settings** - Easy reference later

### After Setup
- 🔒 **Secure your secrets** - Never commit .env to Git
- 📚 **Bookmark docs** - Official documentation links in each guide
- 🎯 **Plan next steps** - Check Sprint 01 to start building

---

## 🚨 Common Issues Across Guides

### "Command not found" Errors
**Cause:** Tool not installed or not in PATH
**Fix:** Restart terminal, check PATH, reinstall tool

### Permission Denied (Mac/Linux)
**Cause:** Need admin rights
**Fix:** Use `sudo` or fix permissions (see specific guide)

### API Keys Not Working
**Cause:** Not loaded from .env or wrong format
**Fix:** Restart server, check `.env` syntax, verify no spaces

### Database Connection Errors
**Cause:** Wrong connection string or database not running
**Fix:** Verify DATABASE_URL, check database status

---

## 📞 Getting Help

### 1. Check the Guide's "Common Errors" Section
Most issues are covered!

### 2. Verify Prerequisites
Did you complete earlier guides?

### 3. Check Official Docs
Links provided in each guide

### 4. Search Error Messages
Copy exact error message → Google it

### 5. Ask for Help
- Stack Overflow
- Expo Discord: https://chat.expo.dev
- Reddit: r/reactnative, r/node

---

## 🔄 Keeping Guides Updated

**These guides are for MVP (as of 2025-10-05).**

**If tools change:**
- Update version numbers
- Add new screenshots
- Note deprecations

**Future maintainers:** Update this README with new guide links!

---

## ✅ Setup Checklist

Use this to track your progress:

### Prerequisites
- [ ] Computer (Mac, Windows, or Linux)
- [ ] Internet connection
- [ ] Credit card (for Google API - won't be charged on free tier)
- [ ] GitHub account
- [ ] Email account
- [ ] 4-8 hours to complete all Must-Have guides

### Must-Have Guides
- [ ] 01 - Google Places API Setup
- [ ] 02 - Database Setup (Local or Supabase)
- [ ] 03 - Backend Deployment (Railway recommended)
- [ ] 04 - Development Environment Setup
- [ ] 05 - Environment Variables

### Verification
- [ ] Can run backend locally: `npm start`
- [ ] Can run frontend locally: `npx expo start`
- [ ] App loads on phone via Expo Go
- [ ] Backend deployed and accessible via URL
- [ ] Database connected (test query works)
- [ ] All environment variables set
- [ ] `.env` in `.gitignore` (not committed to Git)

### Ready to Build!
- [ ] All Must-Have guides complete
- [ ] Read Sprint 01 plan
- [ ] Start with S-101 (Dev Environment Validation)

---

## 📝 Notes Section

**Your Setup Notes:**

```
Date Started: ___________
Date Completed: ___________

Google Places API Key: (stored in password manager)
Database: [ ] Local PostgreSQL  [ ] Supabase  [ ] Other: _______
Backend Deployed To: [ ] Railway  [ ] Render  [ ] Heroku  [ ] Other: _______
Backend URL: https://________________________________

Issues Encountered:
1.
2.
3.

Time Spent:
- Google API Setup: _____ min
- Database Setup: _____ min
- Backend Deployment: _____ min
- Dev Environment: _____ min
- Environment Variables: _____ min
Total: _____ hours
```

---

## 🎉 What's Next?

After completing all Must-Have guides:

1. **Review Sprint Overview:** `../Sprints/SPRINT_OVERVIEW.md`
2. **Start Sprint 01:** `../Sprints/Sprint_01_Foundation_Auth.md`
3. **Begin Development:** Start with S-101 (Validate Dev Environment)
4. **Track Progress:** Use Restart Briefs to document work

---

**Good luck building NightSwipe! 🌙💫**

You've got this!
