#!/bin/bash

# AI School Chat - Installation Script
# This script automates the setup process

echo "╔═══════════════════════════════════════════════════╗"
echo "║                                                   ║"
echo "║      🎓 AI School Chat Installation Script       ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${BLUE}Checking prerequisites...${NC}"
echo ""

if ! command -v node &> /dev/null
then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo ""
    echo "Please install Node.js from: https://nodejs.org/"
    echo "Required version: 18.0.0 or higher"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js found: ${NODE_VERSION}${NC}"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo -e "${RED}❌ npm is not installed!${NC}"
    echo ""
    echo "npm should come with Node.js installation"
    echo "Please reinstall Node.js from: https://nodejs.org/"
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm found: v${NPM_VERSION}${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
echo ""
echo "This may take 2-3 minutes depending on your internet speed."
echo ""

npm install

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Dependencies installed successfully!${NC}"
else
    echo ""
    echo -e "${RED}❌ Installation failed!${NC}"
    echo ""
    echo "Try running these commands manually:"
    echo "  npm cache clean --force"
    echo "  npm install"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Success message
echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}║           ✓ Installation Complete!               ║${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Next steps
echo -e "${BLUE}🚀 Next steps:${NC}"
echo ""
echo "  1. Start the development server:"
echo -e "     ${YELLOW}npm run dev${NC}"
echo ""
echo "  2. Open your browser at:"
echo -e "     ${YELLOW}http://localhost:3000${NC}"
echo ""
echo "  3. Test login credentials:"
echo -e "     Student:  ${YELLOW}student@school.com${NC} / ${YELLOW}student123${NC}"
echo -e "     Parent:   ${YELLOW}1234567890${NC} / OTP: ${YELLOW}123456${NC}"
echo -e "     Teacher:  ${YELLOW}teacher@school.com${NC} / ${YELLOW}teacher123${NC}"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   → START_HERE.md       - Quick start guide"
echo "   → GETTING_STARTED.md  - Visual walkthrough"
echo "   → README.md           - Full documentation"
echo ""
echo -e "${GREEN}Happy coding! 💻✨${NC}"
echo ""
