# 🎓 AI School Chat Application

A comprehensive AI-powered school chat platform for teachers, parents, and students with multiple learning modes, assessment tools, and insights dashboards.

## ✨ Features

### 👨‍🎓 Student Features
- **Multiple Chat Modes**: Q&A, Exam Prep, Quiz, Worksheet, Homework Help, Revision, Discussion
- **Voice Chat**: Real-time transcription and text-to-speech in Discussion mode
- **Student Profile**: View personal details, interests, report cards, and achievements
- **AI-Powered Learning**: Get suggested follow-up questions and personalized guidance

### 👨‍🏫 Teacher Features
- **Content Creation**: Generate lessons, materials, and resources
- **Curriculum Planner**: Plan and organize course content
- **Worksheet Creator**: Design custom worksheets
- **Exam Creator**: Create comprehensive exams with 6 types
- **Teacher Insights**: Analytics dashboard with student performance tracking
- **Student Chat**: Direct communication with students

### 👪 Parent Features
- **Profile Switching**: Netflix-style profile selection with PIN protection
- **Parent Dashboard**: Monitor children's progress with AI insights
- **Study Planner**: Track and plan study schedules
- **Performance Analytics**: View detailed progress reports
- **Multi-child Support**: Manage multiple student profiles

### 🎨 Design Features
- **Light/Dark Mode**: Full theme support across all screens
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Beautiful gradients, smooth animations, and intuitive navigation
- **Accessibility**: WCAG compliant with keyboard navigation support

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed on your system:
- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v9.0.0 or higher) - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)

### Installation Steps

1. **Clone the repository** (or download the source code)
   ```bash
   git clone <your-repo-url>
   cd ai-school-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   
   This will install all required packages including:
   - React & React DOM
   - TypeScript
   - Vite (build tool)
   - Tailwind CSS
   - Lucide React (icons)
   - Recharts (charts/graphs)
   - Sonner (notifications)

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   
   The application will automatically open at `http://localhost:3000`
   
   If it doesn't open automatically, navigate to: **http://localhost:3000**

## 🎮 Usage Guide

### Login Credentials

The application uses mock authentication. Use these credentials to test different user types:

#### **Student Login**
- **Phone/Email**: Any valid format (e.g., `student@school.com` or `1234567890`)
- **Password**: `student123`

#### **Parent Login** (OTP-based)
- **Phone/Email**: Any valid format (e.g., `parent@email.com`)
- **OTP**: `123456` (any 6 digits work in demo mode)
- After login, select a student profile and enter PIN: `1234`

#### **Teacher Login**
- **Email**: `teacher@school.com`
- **Password**: `teacher123`
- **Role Options**: Subject Teacher, Class Teacher, Department Head, Principal

### Feature Tour

#### **For Students:**
1. Login with student credentials
2. Click "Select Mode" to choose learning mode
3. Click "Profile" button to view your profile, interests, and report cards
4. Start chatting with AI tutor
5. Toggle dark mode with the moon/sun icon

#### **For Parents:**
1. Login with parent credentials
2. Enter OTP: `123456`
3. Select student profile
4. Enter PIN: `1234`
5. View dashboard with insights and study planner
6. Switch between child profiles anytime
7. Click "Profile" to view selected child's details

#### **For Teachers:**
1. Login with teacher credentials
2. Select your role and subjects
3. Choose from 5 main modes:
   - Content Creation
   - Curriculum Planner
   - Worksheet Creator
   - Exam Creator
   - Teacher Insights
4. Access student chat for one-on-one support

## 📁 Project Structure

```
ai-school-chat/
├── components/          # React components
│   ├── LoginScreen.tsx
│   ├── ProfileSelector.tsx
│   ├── ChatInterface.tsx
│   ├── StudentProfileScreen.tsx
│   ├── ParentDashboard.tsx
│   ├── TeacherInsights.tsx
│   ├── ExamSetup.tsx
│   ├── HomeworkSetup.tsx
│   ├── RevisionSetup.tsx
│   ├── AssessmentSetup.tsx
│   └── ... (many more)
├── hooks/              # Custom React hooks
│   └── useTheme.ts
├── styles/             # CSS styles
│   └── globals.css
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
├── index.html          # HTML template
├── package.json        # Dependencies and scripts
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## 🛠️ Available Scripts

### `npm run dev`
Starts the development server with hot module replacement (HMR).
- Opens at: `http://localhost:3000`
- Changes are reflected instantly

### `npm run build`
Creates an optimized production build in the `dist/` folder.
- Runs TypeScript compiler
- Bundles and minifies code
- Optimizes assets

### `npm run preview`
Preview the production build locally before deployment.
- Serves the `dist/` folder
- Tests production build

### `npm run lint`
Runs ESLint to check code quality and catch errors.

## 🎨 Customization

### Theme Colors

Edit `/styles/globals.css` to customize the color scheme:

```css
@theme {
  --color-primary: #8b5cf6;    /* Purple */
  --color-secondary: #ec4899;   /* Pink */
  --color-accent: #3b82f6;      /* Blue */
}
```

### Mock Data

All mock data (students, report cards, achievements) can be customized in:
- `/components/StudentProfileScreen.tsx` - Profile data
- `/components/ParentDashboard.tsx` - Dashboard data
- `/components/TeacherInsights.tsx` - Analytics data

## 🔧 Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
# Edit vite.config.ts and change the port
server: {
  port: 3001,  // Change to any available port
}
```

### Dependencies Not Installing
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Make sure TypeScript is properly configured
npm run build -- --force
```

### Dark Mode Issues
- Clear browser cache and localStorage
- Check if system dark mode is overriding
- Toggle theme button to reset

## 🌐 Browser Support

- **Chrome/Edge**: v90+
- **Firefox**: v88+
- **Safari**: v14+
- **Opera**: v76+

## 📦 Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons
- **Recharts** - Data visualization
- **Sonner** - Toast notifications

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The optimized files will be in the `dist/` folder.

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### Deploy to GitHub Pages

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to package.json:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

## 📝 License

This project is for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please create an issue in the repository.

---

**Made with ❤️ for better education**
