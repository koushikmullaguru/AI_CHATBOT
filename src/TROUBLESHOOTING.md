# 🔧 Troubleshooting Guide

Common issues and their solutions for the AI School Chat application.

---

## 🚨 Installation Issues

### ❌ "npm: command not found"

**Problem:** Node.js or npm is not installed

**Solution:**
1. Download Node.js from https://nodejs.org/
2. Install the LTS (Long Term Support) version
3. Restart your terminal
4. Verify: `node --version` and `npm --version`

**Expected output:**
```
v18.17.0 (or higher)
9.6.7 (or higher)
```

---

### ❌ "npm install" fails or hangs

**Problem:** Network issues, corrupted cache, or permission errors

**Solution 1: Clear cache and retry**
```bash
npm cache clean --force
npm install
```

**Solution 2: Delete and reinstall**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Solution 3: Use different registry**
```bash
npm config set registry https://registry.npmjs.org/
npm install
```

**Solution 4: Check permissions (Mac/Linux)**
```bash
sudo chown -R $USER:$(id -gn $USER) ~/.npm
sudo chown -R $USER:$(id -gn $USER) ./node_modules
```

---

### ❌ "EACCES: permission denied" (Mac/Linux)

**Problem:** npm doesn't have write permissions

**Solution:**
```bash
# Fix npm permissions
sudo chown -R $USER ~/.npm
sudo chown -R $USER /usr/local/lib/node_modules

# Or reinstall Node with nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
```

---

## 🖥️ Development Server Issues

### ❌ "Port 3000 is already in use"

**Problem:** Another application is using port 3000

**Solution 1: Kill the process**

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Windows (PowerShell):**
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

**Windows (CMD):**
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

**Solution 2: Change the port**

Edit `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 3001,  // Change to any available port
  },
});
```

---

### ❌ Server starts but browser shows "Cannot GET /"

**Problem:** Wrong URL or build issue

**Solution:**
1. Make sure you're accessing `http://localhost:3000` (not `http://localhost:3000/src`)
2. Check terminal for errors
3. Try hard refresh: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
4. Restart server: `Ctrl + C` then `npm run dev`

---

### ❌ "Cannot find module" errors

**Problem:** Missing dependencies or incorrect imports

**Solution 1: Reinstall dependencies**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Solution 2: Check import paths**
```typescript
// Wrong
import { Component } from 'components/Component';

// Correct
import { Component } from './components/Component';
```

**Solution 3: Install missing package**
```bash
npm install missing-package-name
```

---

### ❌ Hot reload not working

**Problem:** File changes not reflecting in browser

**Solution 1: Clear Vite cache**
```bash
rm -rf node_modules/.vite
npm run dev
```

**Solution 2: Hard refresh browser**
- Chrome/Firefox: `Ctrl + Shift + R`
- Safari: `Cmd + Option + R`

**Solution 3: Check file watchers (Linux)**
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## 🎨 Display Issues

### ❌ White/blank screen

**Problem:** JavaScript error or build issue

**Solution:**
1. Open browser console: `F12` → Console tab
2. Look for red error messages
3. Common fixes:
   - Clear browser cache: `Ctrl + Shift + Delete`
   - Hard reload: `Ctrl + Shift + R`
   - Restart dev server
   - Check for TypeScript errors: `npx tsc --noEmit`

**If error says "Cannot find module":**
```bash
npm install
```

**If error says "Unexpected token":**
```bash
npm run build
npm run preview
```

---

### ❌ Styles not loading / CSS broken

**Problem:** Tailwind CSS not working or styles not applied

**Solution 1: Check globals.css import**

Verify in `main.tsx`:
```typescript
import './styles/globals.css';
```

**Solution 2: Rebuild Tailwind**
```bash
rm -rf node_modules/.vite
npm run dev
```

**Solution 3: Check tailwind classes**
```typescript
// Wrong
<div className="colour-red">

// Correct
<div className="text-red-500">
```

---

### ❌ Dark mode not working

**Problem:** Theme not persisting or not applying

**Solution:**
1. Clear localStorage:
   - Open Console (F12)
   - Type: `localStorage.clear()`
   - Press Enter
   - Refresh page

2. Check theme toggle:
   - Click moon/sun icon
   - Check if `dark` class is on `<html>` element

3. Force theme:
```typescript
// In browser console
localStorage.setItem('theme', 'dark');
location.reload();
```

---

### ❌ Icons not displaying

**Problem:** Lucide React icons not loading

**Solution:**
1. Check import:
```typescript
import { Icon } from 'lucide-react';  // Correct
import { Icon } from 'lucide';        // Wrong
```

2. Reinstall lucide-react:
```bash
npm uninstall lucide-react
npm install lucide-react@latest
```

---

## 🏗️ Build Issues

### ❌ "npm run build" fails

**Problem:** TypeScript errors or build configuration issue

**Solution 1: Check TypeScript errors**
```bash
npx tsc --noEmit
```

Fix all errors shown, then build again.

**Solution 2: Check for unused imports**
```bash
npm run lint
```

**Solution 3: Ignore TypeScript errors (not recommended)**

Edit `tsconfig.json`:
```json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

---

### ❌ Build succeeds but preview shows errors

**Problem:** Environment-specific issue

**Solution:**
1. Check console for errors:
   - Press F12
   - Look for error messages

2. Check asset paths:
```typescript
// Development works, production breaks
import img from './image.png';  // ❌ Wrong

// Both work
import img from '/assets/image.png';  // ✅ Correct
```

3. Check base URL in `vite.config.ts`:
```typescript
export default defineConfig({
  base: './',  // For relative paths
});
```

---

## 🔐 Authentication Issues

### ❌ Login not working

**Problem:** Mock authentication logic issue

**Solution:**

**Student Login:**
- Email: Any format (e.g., `student@school.com`)
- Password: `student123`

**Parent Login:**
- Phone: Any 10 digits (e.g., `1234567890`)
- OTP: `123456` (any 6 digits work in demo)
- PIN: `1234` (any 4 digits work in demo)

**Teacher Login:**
- Email: `teacher@school.com`
- Password: `teacher123`

If still not working:
1. Clear localStorage: `localStorage.clear()` in console
2. Refresh page
3. Try again

---

### ❌ Profile selection not showing

**Problem:** Parent profile selector not appearing

**Solution:**
1. Make sure you logged in as Parent (not Student)
2. Clear storage: `localStorage.clear()`
3. Login again
4. Check console for errors (F12)

---

## 💾 Data Issues

### ❌ Data not persisting

**Problem:** localStorage not saving

**Solution:**
1. Check browser settings:
   - Enable cookies and site data
   - Disable "Clear on exit"

2. Check incognito/private mode:
   - Don't use private browsing
   - Use regular browser window

3. Test localStorage:
```javascript
// In console
localStorage.setItem('test', 'works');
console.log(localStorage.getItem('test'));  // Should show "works"
```

---

### ❌ Report cards not showing

**Problem:** Data not loading in StudentProfileScreen

**Solution:**
1. Check component is imported:
```typescript
import { StudentProfileScreen } from './components/StudentProfileScreen';
```

2. Check profile prop:
```typescript
<StudentProfileScreen 
  profile={profileToShow}  // Must not be null
  onClose={() => setShowProfileScreen(false)} 
/>
```

3. Check console for errors

---

## 🌐 Browser Issues

### ❌ Works in Chrome but not Safari

**Problem:** Browser compatibility issue

**Solution:**
1. Use latest browser version
2. Enable JavaScript
3. Clear cache
4. Check for console errors

**Safari specific:**
- Enable Develop menu: Safari → Preferences → Advanced → Show Develop menu
- Console: Develop → Show JavaScript Console

---

### ❌ Works on desktop but not mobile

**Problem:** Responsive design issue or mobile browser limitation

**Solution:**
1. Test in mobile browser DevTools:
   - Chrome: F12 → Toggle device toolbar
   - Check different screen sizes

2. Check responsive classes:
```typescript
<div className="hidden md:block">  // Hidden on mobile
<div className="block md:hidden">  // Hidden on desktop
```

3. Test on real device if possible

---

## 🐛 Runtime Errors

### ❌ "Cannot read property of undefined"

**Problem:** Accessing property on undefined/null object

**Solution:**
1. Find error location in console
2. Add null checks:

```typescript
// Before (breaks)
const name = user.profile.name;

// After (safe)
const name = user?.profile?.name ?? 'Unknown';
```

---

### ❌ "Maximum update depth exceeded"

**Problem:** Infinite loop in React component

**Solution:**
1. Check useEffect dependencies:

```typescript
// Wrong - infinite loop
useEffect(() => {
  setState(value);
}, [value]);

// Correct - runs once
useEffect(() => {
  setState(value);
}, []);
```

2. Check event handlers:

```typescript
// Wrong - runs immediately
<button onClick={handleClick()}>

// Correct - runs on click
<button onClick={handleClick}>
<button onClick={() => handleClick()}>
```

---

## 📱 Performance Issues

### ❌ App is slow/laggy

**Problem:** Performance bottleneck

**Solution:**
1. Check console for warnings
2. Reduce mock data size
3. Optimize re-renders:

```typescript
// Use React.memo for expensive components
const MemoizedComponent = React.memo(ExpensiveComponent);
```

4. Check browser DevTools:
   - Chrome: F12 → Performance tab
   - Record and analyze

---

### ❌ Build size too large

**Problem:** Bundle size exceeds expectations

**Solution:**
1. Analyze bundle:
```bash
npm run build
# Check dist/assets/ file sizes
```

2. Remove unused dependencies:
```bash
npm uninstall unused-package
```

3. Use code splitting:
```typescript
const LazyComponent = React.lazy(() => import('./Component'));
```

---

## 🔍 Debugging Tips

### Enable Debug Mode

```typescript
// Add to App.tsx
console.log('Current user:', currentUser);
console.log('Selected profile:', selectedProfile);
```

### React DevTools

1. Install React DevTools browser extension
2. Open DevTools: F12
3. Click "Components" tab
4. Inspect component props and state

### Network Tab

1. F12 → Network tab
2. Reload page
3. Check for:
   - Failed requests (red)
   - Slow requests
   - Missing files

---

## 📞 Still Stuck?

### Checklist Before Asking for Help

- [ ] Checked console for errors (F12)
- [ ] Tried clearing cache and localStorage
- [ ] Restarted dev server
- [ ] Reinstalled dependencies
- [ ] Checked this troubleshooting guide
- [ ] Read error message carefully

### How to Report an Issue

Include:
1. **Error message** (exact text or screenshot)
2. **Steps to reproduce**
3. **Environment info**:
   - OS (Windows/Mac/Linux)
   - Node version: `node --version`
   - npm version: `npm --version`
   - Browser (Chrome/Firefox/Safari)
4. **What you've tried** (from this guide)

---

## 🛠️ Emergency Reset

**If nothing works, nuclear option:**

```bash
# 1. Delete everything
rm -rf node_modules package-lock.json
rm -rf dist
rm -rf node_modules/.vite

# 2. Clear npm cache
npm cache clean --force

# 3. Reinstall
npm install

# 4. Try again
npm run dev
```

**Browser reset:**
1. Clear all browser data (Ctrl+Shift+Delete)
2. Close all browser tabs
3. Restart browser
4. Open app again

---

## ✅ Prevention Tips

### Best Practices

1. **Keep dependencies updated:**
   ```bash
   npm outdated
   npm update
   ```

2. **Use version control:**
   ```bash
   git init
   git add .
   git commit -m "Working version"
   ```

3. **Regular maintenance:**
   - Clear cache weekly: `npm cache clean --force`
   - Update Node.js monthly
   - Check for security updates: `npm audit`

4. **Backup before changes:**
   ```bash
   git branch backup-before-big-change
   ```

---

## 📚 Additional Resources

- **Vite Issues:** https://github.com/vitejs/vite/issues
- **React Docs:** https://react.dev/learn
- **Stack Overflow:** Tag: [reactjs] + [vite]
- **Node.js Issues:** https://nodejs.org/en/docs/

---

**🎯 Most issues can be fixed by:**
1. Checking console (F12)
2. Clearing cache
3. Restarting server
4. Reinstalling dependencies

**Good luck! 🚀**
