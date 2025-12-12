# 🚀 Quick Setup Guide

## Step-by-Step Installation

### 1️⃣ Check Prerequisites

Open your terminal/command prompt and verify installations:

```bash
# Check Node.js version (should be 18.0.0 or higher)
node --version

# Check npm version (should be 9.0.0 or higher)
npm --version
```

**Don't have Node.js?** Download from: https://nodejs.org/

### 2️⃣ Navigate to Project Directory

```bash
cd /path/to/ai-school-chat
```

### 3️⃣ Install Dependencies

```bash
npm install
```

⏳ This will take 2-3 minutes. You'll see progress bars as packages install.

**Expected output:**
```
added 423 packages, and audited 424 packages in 2m
```

### 4️⃣ Start Development Server

```bash
npm run dev
```

**Expected output:**
```
  VITE v5.0.8  ready in 823 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### 5️⃣ Open in Browser

The app should automatically open at: **http://localhost:3000**

If not, manually open your browser and navigate to: **http://localhost:3000**

---

## 🎯 Test the Application

### Test as Student

1. Click "Login as Student"
2. Enter any email: `student@school.com`
3. Enter password: `student123`
4. Click "Sign In"
5. Click "Select Mode" to choose learning mode
6. Click "Profile" button (top right) to view profile

### Test as Parent

1. Click "Login as Parent"
2. Enter any phone: `1234567890`
3. Click "Send OTP"
4. Enter OTP: `123456`
5. Click "Verify OTP"
6. Select any student profile
7. Enter PIN: `1234`
8. Click "View Dashboard" for insights

### Test as Teacher

1. Click "Login as Teacher"
2. Enter email: `teacher@school.com`
3. Enter password: `teacher123`
4. Click "Sign In"
5. Select role (e.g., "Subject Teacher")
6. Select subjects (e.g., "Mathematics")
7. Explore 5 teacher modes

---

## 🎨 Toggle Dark Mode

Click the moon/sun icon in the top-right corner to switch themes.

---

## ⚠️ Common Issues & Solutions

### Issue: Port 3000 already in use

**Solution:**
```bash
# Kill the process using port 3000 (Mac/Linux)
lsof -ti:3000 | xargs kill -9

# Or change the port in vite.config.ts
# Change "port: 3000" to "port: 3001"
```

### Issue: `npm install` fails

**Solution:**
```bash
# Clear cache and try again
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: White screen on load

**Solution:**
1. Open browser console (F12)
2. Check for errors
3. Clear browser cache (Ctrl+Shift+Delete)
4. Hard reload (Ctrl+Shift+R)

### Issue: Dark mode not working

**Solution:**
1. Clear localStorage: Console → `localStorage.clear()`
2. Refresh page
3. Toggle theme again

---

## 📂 File Structure Overview

```
ai-school-chat/
├── 📄 index.html          # Entry HTML file
├── 📄 main.tsx            # React entry point
├── 📄 App.tsx             # Main app component
├── 📁 components/         # All React components (30+ files)
├── 📁 hooks/              # Custom hooks (theme, etc.)
├── 📁 styles/             # CSS files
├── 📁 types/              # TypeScript definitions
├── 📄 package.json        # Dependencies & scripts
├── 📄 vite.config.ts      # Vite configuration
└── 📄 README.md           # Full documentation
```

---

## 🔄 Development Workflow

### Making Changes

1. Edit any `.tsx` or `.css` file
2. Save the file (Ctrl+S)
3. Browser automatically reloads
4. See changes instantly! ⚡

### Adding New Features

1. Create new component in `/components` folder
2. Import in `App.tsx` or parent component
3. Use TypeScript for type safety
4. Test in browser

### Stop the Server

Press `Ctrl + C` in the terminal running the dev server.

---

## 🏗️ Build for Production

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

The build will be in the `dist/` folder, ready for deployment!

---

## 🎓 Learning Resources

- **React**: https://react.dev/learn
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Vite**: https://vitejs.dev/guide/

---

## ✅ Checklist

- [ ] Node.js installed (v18+)
- [ ] npm installed (v9+)
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)
- [ ] Browser open at http://localhost:3000
- [ ] Tested student login
- [ ] Tested parent login
- [ ] Tested teacher login
- [ ] Dark mode working
- [ ] Profile screen accessible

---

**🎉 You're all set! Happy coding!**

If you encounter any issues not covered here, check the full README.md or create an issue.
