# 📜 NPM Scripts Guide

## Available Scripts

All scripts are defined in `package.json` and run with `npm run <script-name>`

---

## 🚀 Development Scripts

### `npm run dev`

**Starts the development server with hot module replacement (HMR)**

```bash
npm run dev
```

**What it does:**
- Starts Vite dev server
- Opens browser automatically
- Enables hot reload (instant updates)
- Runs on port 3000
- Shows helpful error messages

**Output:**
```
VITE v5.0.8  ready in 823 ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.1.5:3000/
```

**Use when:**
- Developing features
- Testing changes
- Daily coding work

---

## 🏗️ Build Scripts

### `npm run build`

**Creates optimized production build**

```bash
npm run build
```

**What it does:**
- Runs TypeScript compiler (`tsc`)
- Bundles code with Vite
- Minifies JavaScript
- Optimizes CSS
- Compresses images
- Generates source maps
- Creates `dist/` folder

**Output:**
```
vite v5.0.8 building for production...
✓ 234 modules transformed.
dist/index.html                   0.46 kB
dist/assets/index-a1b2c3d4.css   12.34 kB │ gzip:  3.21 kB
dist/assets/index-e5f6g7h8.js   145.67 kB │ gzip: 48.23 kB
✓ built in 3.45s
```

**Use when:**
- Deploying to production
- Testing production build
- Checking bundle size

---

### `npm run preview`

**Previews the production build locally**

```bash
npm run preview
```

**What it does:**
- Serves the `dist/` folder
- Simulates production environment
- Tests production build
- No hot reload (static files)

**Output:**
```
➜  Local:   http://localhost:4173/
➜  Network: http://192.168.1.5:4173/
```

**Use when:**
- Testing build before deployment
- Checking production behavior
- Verifying optimizations

---

## 🔍 Quality Scripts

### `npm run lint`

**Checks code quality with ESLint**

```bash
npm run lint
```

**What it does:**
- Scans all `.ts` and `.tsx` files
- Checks for code issues
- Reports unused variables
- Finds potential bugs
- Shows warnings and errors

**Output:**
```
✓ 0 errors, 0 warnings

or

/components/App.tsx
  45:7  warning  'userName' is assigned but never used  @typescript-eslint/no-unused-vars
```

**Use when:**
- Before committing code
- Finding code issues
- Maintaining quality

---

## 🛠️ Utility Commands

### Clean Install

**Remove and reinstall all dependencies**

```bash
# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall everything
npm install
```

**Use when:**
- Installation errors occur
- Dependency conflicts
- After updating package.json

---

### Clear Cache

**Clear npm cache**

```bash
npm cache clean --force
```

**Use when:**
- Installation problems
- Corrupted cache
- Download issues

---

### Update Packages

**Check for outdated packages**

```bash
npm outdated
```

**Update all packages**

```bash
npm update
```

**Update specific package**

```bash
npm update package-name
```

---

## 🔧 Custom Scripts (Add to package.json)

### Add Type Checking

```json
{
  "scripts": {
    "type-check": "tsc --noEmit"
  }
}
```

**Run:** `npm run type-check`

---

### Add Format Script

```json
{
  "scripts": {
    "format": "prettier --write \"**/*.{ts,tsx,css,md}\""
  }
}
```

**Run:** `npm run format`

---

### Add Test Script

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

**Run:** `npm test`

---

### Add Clean Script

```json
{
  "scripts": {
    "clean": "rm -rf dist node_modules",
    "clean:cache": "npm cache clean --force"
  }
}
```

**Run:** `npm run clean`

---

## 📊 Script Comparison

| Script | Speed | Purpose | When to Use |
|--------|-------|---------|-------------|
| `dev` | ⚡ Fast | Development | Daily coding |
| `build` | 🐌 Slow | Production | Before deploy |
| `preview` | ⚡ Fast | Testing | Test build |
| `lint` | ⚡ Fast | Quality | Before commit |

---

## 🎯 Recommended Workflow

### Daily Development

```bash
# Morning: Start dev server
npm run dev

# Work on features...
# Changes reload automatically

# Evening: Check code quality
npm run lint

# Before commit
git add .
git commit -m "Add new feature"
```

### Before Deployment

```bash
# 1. Lint code
npm run lint

# 2. Build for production
npm run build

# 3. Preview build
npm run preview

# 4. Test in browser
# Open http://localhost:4173

# 5. Deploy
# Upload dist/ folder
```

---

## 🚨 Common Issues

### Issue: "Cannot find module"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### Issue: "Port already in use"

**Solution:**

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Windows:**
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

**Or change port in `vite.config.ts`:**
```typescript
server: {
  port: 3001
}
```

---

### Issue: "Build fails with TypeScript errors"

**Solution:**
```bash
# Check what's wrong
npm run lint

# See TypeScript errors
npx tsc --noEmit

# Fix errors in code
# Then build again
npm run build
```

---

### Issue: "Dev server not reloading"

**Solution:**
1. Stop server (Ctrl+C)
2. Clear cache: `rm -rf node_modules/.vite`
3. Restart: `npm run dev`

---

## 💡 Pro Tips

### 1. Watch Mode

Keep dev server running while coding:
```bash
npm run dev
# Leave this terminal open
# Open new terminal for other commands
```

### 2. Check Build Size

After building, check file sizes:
```bash
npm run build
ls -lh dist/assets/
```

### 3. Parallel Commands

Run multiple scripts:
```bash
# Install npm-run-all
npm install --save-dev npm-run-all

# Add to package.json
{
  "scripts": {
    "dev:all": "npm-run-all --parallel dev lint:watch"
  }
}
```

### 4. Environment Variables

Create `.env` files:
```bash
# .env.local
VITE_API_URL=http://localhost:3000
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

### 5. Script Shortcuts

Add to `package.json`:
```json
{
  "scripts": {
    "d": "npm run dev",
    "b": "npm run build",
    "p": "npm run preview",
    "l": "npm run lint"
  }
}
```

**Run:** `npm run d` instead of `npm run dev`

---

## 🎓 Learn More

### Vite Documentation
https://vitejs.dev/guide/

### NPM Scripts
https://docs.npmjs.com/cli/v9/using-npm/scripts

### Package.json
https://docs.npmjs.com/cli/v9/configuring-npm/package-json

---

## ✅ Quick Reference

```bash
# Development
npm run dev           # Start dev server
Ctrl + C              # Stop dev server

# Production
npm run build         # Build app
npm run preview       # Preview build

# Quality
npm run lint          # Check code

# Installation
npm install           # Install deps
npm cache clean -f    # Clear cache
```

---

**🚀 Master these scripts for efficient development!**
