# 📋 Command Reference

## Essential Commands

### Development

```bash
# Start development server (with hot reload)
npm run dev

# Start on different port
PORT=3001 npm run dev

# Start and expose to network
npm run dev -- --host
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Build with source maps
npm run build -- --sourcemap
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues automatically
npm run lint -- --fix

# Type check
npx tsc --noEmit
```

---

## Package Management

### Installing Packages

```bash
# Install all dependencies
npm install

# Install specific package
npm install package-name

# Install dev dependency
npm install --save-dev package-name

# Update all packages
npm update

# Check for outdated packages
npm outdated
```

### Cleaning

```bash
# Remove node_modules
rm -rf node_modules

# Remove build output
rm -rf dist

# Clean npm cache
npm cache clean --force

# Full clean reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Git Commands (Optional)

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit"

# Create new branch
git checkout -b feature/new-feature

# Push to remote
git push origin main
```

---

## Troubleshooting Commands

### Port Issues

```bash
# Find process on port 3000 (Mac/Linux)
lsof -i :3000

# Kill process on port 3000 (Mac/Linux)
lsof -ti:3000 | xargs kill -9

# Find process on port 3000 (Windows)
netstat -ano | findstr :3000

# Kill process (Windows - replace PID)
taskkill /PID <PID> /F
```

### Node/npm Issues

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Update npm
npm install -g npm@latest

# Clear npm cache
npm cache clean --force

# Verify cache
npm cache verify
```

### Build Issues

```bash
# Clean build
rm -rf dist node_modules package-lock.json
npm install
npm run build

# Build with verbose output
npm run build -- --debug

# Check TypeScript errors
npx tsc --noEmit
```

---

## Environment-Specific Commands

### macOS/Linux

```bash
# Make scripts executable
chmod +x scripts/*.sh

# View running processes
ps aux | grep node

# Monitor disk space
df -h
```

### Windows (PowerShell)

```powershell
# Clear terminal
cls

# List directory contents
dir

# View environment variables
$env:PATH

# Run as administrator required for some operations
Start-Process powershell -Verb runAs
```

---

## Advanced Development

### Custom Scripts (Add to package.json)

```json
{
  "scripts": {
    "dev": "vite",
    "dev:host": "vite --host",
    "dev:port": "vite --port 3001",
    "build": "tsc && vite build",
    "build:watch": "vite build --watch",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "clean": "rm -rf dist node_modules",
    "reinstall": "npm run clean && npm install"
  }
}
```

### Run Custom Scripts

```bash
# Run any custom script
npm run script-name

# Example: type checking
npm run type-check

# Example: lint and fix
npm run lint:fix
```

---

## Deployment Commands

### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build and deploy
npm run build
netlify deploy

# Deploy to production
netlify deploy --prod --dir=dist
```

### GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy": "gh-pages -d dist"

# Deploy
npm run deploy
```

---

## Package Versions

### Check Versions

```bash
# List installed packages
npm list

# List top-level packages only
npm list --depth=0

# Check specific package version
npm list package-name

# View package info
npm info package-name
```

### Update Packages

```bash
# Update specific package
npm update package-name

# Update to latest (ignore semver)
npm install package-name@latest

# Interactive update
npx npm-check-updates -i
```

---

## Performance & Debugging

### Analyze Build

```bash
# Build with bundle analysis
npm run build

# Generate bundle size report (requires plugin)
npx vite-bundle-visualizer
```

### Debug

```bash
# Run with Node debugger
node --inspect node_modules/.bin/vite

# Debug in VS Code: Add to launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vite",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev"],
  "console": "integratedTerminal"
}
```

---

## Helpful Shortcuts

### Terminal

- `Ctrl + C` - Stop running process
- `Ctrl + L` - Clear terminal (or type `clear`)
- `Ctrl + R` - Search command history
- `↑/↓` - Navigate command history
- `Tab` - Auto-complete

### VS Code

- `Ctrl + P` - Quick file open
- `Ctrl + Shift + P` - Command palette
- `Ctrl + ` ` - Toggle terminal
- `Ctrl + B` - Toggle sidebar
- `F5` - Start debugging

---

## Quick Reference Card

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview build |
| `npm run lint` | Check code quality |
| `Ctrl + C` | Stop dev server |
| `http://localhost:3000` | Default dev URL |

---

**💡 Pro Tip:** Create aliases for frequently used commands!

### Bash/Zsh Aliases (~/.bashrc or ~/.zshrc)

```bash
alias nrd="npm run dev"
alias nrb="npm run build"
alias nrp="npm run preview"
alias ni="npm install"
alias nci="npm ci"
```

### PowerShell Aliases ($PROFILE)

```powershell
function nrd { npm run dev }
function nrb { npm run build }
function ni { npm install }
```

---

**🚀 Ready to develop! Use these commands to streamline your workflow.**
