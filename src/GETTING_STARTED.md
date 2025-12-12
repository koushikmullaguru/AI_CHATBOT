# 🎯 Getting Started - Visual Guide

## 📋 Prerequisites Checklist

Before you begin, make sure you have:

- [ ] **Node.js** installed (version 18 or higher)
- [ ] **npm** installed (comes with Node.js)
- [ ] A **code editor** (VS Code recommended)
- [ ] A **modern browser** (Chrome, Firefox, Safari, or Edge)
- [ ] **Terminal/Command Prompt** access

---

## 🚀 Installation in 3 Simple Steps

### Step 1: Open Terminal

**Windows:**
- Press `Win + R`
- Type `cmd` or `powershell`
- Press Enter

**Mac:**
- Press `Cmd + Space`
- Type `terminal`
- Press Enter

**Linux:**
- Press `Ctrl + Alt + T`

### Step 2: Navigate to Project

```bash
cd path/to/ai-school-chat
```

💡 **Tip:** Drag and drop the folder into terminal to auto-fill the path!

### Step 3: Install & Run

```bash
# Install all dependencies
npm install

# Start the development server
npm run dev
```

⏳ **Wait 2-3 minutes for installation...**

✅ **Done! The app will open automatically in your browser.**

---

## 🎬 First Launch

### What You'll See

```
  VITE v5.0.8  ready in 823 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.5:3000/
  ➜  press h to show help
```

### Your browser opens to:

```
┌─────────────────────────────────────┐
│                                     │
│     🎓 AI School Chat               │
│                                     │
│     Smart Learning Platform         │
│                                     │
│   ┌───────────────────────────┐    │
│   │  📚 Login as Student      │    │
│   └───────────────────────────┘    │
│                                     │
│   ┌───────────────────────────┐    │
│   │  👪 Login as Parent       │    │
│   └───────────────────────────┘    │
│                                     │
│   ┌───────────────────────────┐    │
│   │  👨‍🏫 Login as Teacher      │    │
│   └───────────────────────────┘    │
│                                     │
│              🌙 Dark Mode           │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎮 Test Drive the App

### 🎓 Try Student Features

**Step 1:** Click "Login as Student"

**Step 2:** Enter credentials:
- Email: `student@school.com`
- Password: `student123`

**Step 3:** Click "Sign In"

**You'll see:**
```
┌─────────────────────────────────────┐
│  Welcome, Student! 📚               │
│  ○○○  🌙  👤 Profile  🚪 Logout     │
├─────────────────────────────────────┤
│                                     │
│  💬  Select Learning Mode           │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ Q&A │ │ Exam│ │ Quiz│           │
│  └─────┘ └─────┘ └─────┘           │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │Sheet│ │Home │ │ Rev │           │
│  └─────┘ └─────┘ └─────┘           │
│                                     │
│  ┌─────────────────────────┐       │
│  │ 🎙️ Discussion Mode     │       │
│  └─────────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

**Step 4:** Click "Profile" button (top right)

**You'll see your profile with:**
- 📝 Personal details
- ⭐ Interests (editable!)
- 📊 Report cards (3 terms)
- 🏆 Achievements

---

### 👪 Try Parent Features

**Step 1:** Logout and click "Login as Parent"

**Step 2:** Enter phone number:
- Phone: `1234567890`

**Step 3:** Click "Send OTP"

**Step 4:** Enter OTP:
- OTP: `123456`

**Step 5:** Click "Verify OTP"

**You'll see profiles:**
```
┌─────────────────────────────────────┐
│  Select Student Profile             │
│                                     │
│  ┌──────────────┐  ┌──────────────┐│
│  │   👧 Emma    │  │   👦 Alex    ││
│  │  Grade 8     │  │  Grade 10    ││
│  │              │  │              ││
│  │  [Select]    │  │  [Select]    ││
│  └──────────────┘  └──────────────┘│
│                                     │
│  ┌──────────────┐                  │
│  │   👶 Sophie  │                  │
│  │  Grade 5     │                  │
│  │              │                  │
│  │  [Select]    │                  │
│  └──────────────┘                  │
│                                     │
└─────────────────────────────────────┘
```

**Step 6:** Select any profile

**Step 7:** Enter PIN: `1234`

**You'll see:**
```
┌─────────────────────────────────────┐
│  Emma's Dashboard 📊                │
│                                     │
│  [Select Mode]  [View Dashboard]    │
│                                     │
└─────────────────────────────────────┘
```

**Step 8:** Click "View Dashboard"

**You'll see:**
- 📈 Learning analytics
- 💡 AI-powered insights
- 📅 Study planner
- 🎯 Goals and recommendations

---

### 👨‍🏫 Try Teacher Features

**Step 1:** Logout and click "Login as Teacher"

**Step 2:** Enter credentials:
- Email: `teacher@school.com`
- Password: `teacher123`

**Step 3:** Select role:
- Choose: "Subject Teacher"

**Step 4:** Select subjects:
- Check: Mathematics, Science

**Step 5:** Click "Continue to Dashboard"

**You'll see 5 modes:**
```
┌─────────────────────────────────────┐
│  Teacher Dashboard 👨‍🏫              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📝 Content Creation        │   │
│  │  Create lessons & materials │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📚 Curriculum Planner      │   │
│  │  Plan your course           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📄 Worksheet Creator       │   │
│  │  Generate worksheets        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📝 Exam Creator            │   │
│  │  Create comprehensive exams │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📊 Teacher Insights        │   │
│  │  View analytics & reports   │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎨 Toggle Dark Mode

Click the **moon icon (🌙)** in the top-right corner.

**Before (Light Mode):**
- White background
- Dark text
- Light borders

**After (Dark Mode):**
- Dark gray background
- Light text
- Darker borders

Toggle anytime! Theme is saved automatically.

---

## 🔧 Common Setup Issues

### ❌ Issue: "Command not found: npm"

**Solution:**
```bash
# Download and install Node.js from:
https://nodejs.org/

# Verify installation:
node --version
npm --version
```

---

### ❌ Issue: "Port 3000 is already in use"

**Solution 1:** Kill the process
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Windows (in PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

**Solution 2:** Change the port
Edit `vite.config.ts`:
```typescript
server: {
  port: 3001,  // Change to 3001
}
```

---

### ❌ Issue: "Module not found" errors

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

### ❌ Issue: White/blank screen

**Solution:**
1. Open browser console (F12)
2. Look for errors
3. Clear cache (Ctrl+Shift+Delete)
4. Hard reload (Ctrl+Shift+R)
5. Restart dev server

---

### ❌ Issue: Slow installation

**Solution:**
```bash
# Use faster registry
npm config set registry https://registry.npmjs.org/

# Or clear cache
npm cache clean --force
npm install
```

---

## 📂 Project Overview

```
Your project contains:
✅ 30+ React components
✅ Student, Parent, Teacher features
✅ Multiple learning modes
✅ Dark/light theme
✅ Profile system with report cards
✅ Analytics dashboards
✅ Voice chat functionality
```

---

## 🎯 Next Steps

### Explore Features

1. **Student Mode:**
   - Try Q&A mode
   - Setup an exam
   - Create a quiz
   - Use discussion mode
   - View your profile

2. **Parent Mode:**
   - Switch between profiles
   - Check dashboard
   - View study planner
   - Monitor progress

3. **Teacher Mode:**
   - Create content
   - Plan curriculum
   - Generate worksheets
   - Create exams
   - View insights

### Customize

1. **Change Colors:**
   - Edit `/styles/globals.css`
   - Modify theme colors

2. **Add Features:**
   - Create new component in `/components`
   - Import in `App.tsx`

3. **Modify Data:**
   - Edit mock data in components
   - Update student profiles
   - Change report cards

---

## 📚 Learn More

### Documentation Files

- 📖 **README.md** - Full documentation
- 🚀 **SETUP_GUIDE.md** - Detailed setup
- 📋 **COMMANDS.md** - Command reference
- 📁 **PROJECT_STRUCTURE.md** - File structure
- 🎯 **GETTING_STARTED.md** - This file

### External Resources

- **React:** https://react.dev/learn
- **TypeScript:** https://www.typescriptlang.org/docs/
- **Tailwind:** https://tailwindcss.com/docs
- **Vite:** https://vitejs.dev/guide/

---

## ✅ Success Checklist

- [ ] Node.js installed
- [ ] npm install completed
- [ ] npm run dev working
- [ ] App opens in browser
- [ ] Tested student login
- [ ] Tested parent login
- [ ] Tested teacher login
- [ ] Profile screen works
- [ ] Dark mode toggles
- [ ] All features accessible

---

## 🆘 Need Help?

### Check These First

1. **Console Errors:** Press F12 → Console tab
2. **Terminal Output:** Read error messages carefully
3. **Documentation:** Check README.md
4. **Internet:** Ensure stable connection

### Still Stuck?

1. **Restart dev server:** `Ctrl+C` then `npm run dev`
2. **Clear cache:** `npm cache clean --force`
3. **Reinstall:** Delete `node_modules` and run `npm install`
4. **Check versions:** `node --version` and `npm --version`

---

## 🎉 You're Ready!

```
     ✓ Setup complete
     ✓ App is running
     ✓ All features work
     ✓ Dark mode enabled
     
     🚀 Start building amazing features!
```

**Happy coding! 💻✨**

---

### Quick Commands Reference

```bash
# Start development
npm run dev

# Stop server
Ctrl + C

# Build for production
npm run build

# Preview build
npm run preview
```

**Access at:** http://localhost:3000

**Enjoy your AI School Chat application!** 🎓📚✨
