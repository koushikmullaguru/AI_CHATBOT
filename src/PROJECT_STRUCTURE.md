# 📁 Project Structure

## Complete File Tree

```
ai-school-chat/
│
├── 📄 index.html                    # Entry HTML file
├── 📄 main.tsx                      # React app entry point
├── 📄 App.tsx                       # Main application component
│
├── 📁 components/                   # React Components (30+ files)
│   ├── 🔐 Authentication
│   │   ├── LoginScreen.tsx          # Login interface (Student/Parent/Teacher)
│   │   ├── ProfileSelector.tsx      # Parent profile selection with PIN
│   │   └── StudentSelector.tsx      # Teacher student selection
│   │
│   ├── 💬 Chat System
│   │   ├── ChatInterface.tsx        # Main chat container
│   │   ├── ChatHeader.tsx           # Header with profile/logout
│   │   ├── ChatSidebar.tsx          # Chat history sidebar
│   │   ├── ChatMessages.tsx         # Message display
│   │   ├── ChatInput.tsx            # Message input field
│   │   └── ModeSelector.tsx         # Learning mode selector
│   │
│   ├── 🎓 Student Features
│   │   ├── StudentProfileScreen.tsx  # Profile with report cards
│   │   ├── DiscussionMode.tsx       # Voice chat with transcription
│   │   ├── QuizMode.tsx             # Legacy quiz mode
│   │   ├── ExamMode.tsx             # Full exam interface
│   │   ├── ExamSetup.tsx            # Exam configuration (6 types)
│   │   ├── HomeworkSetup.tsx        # Homework topic selection
│   │   ├── RevisionSetup.tsx        # Revision topic selection
│   │   ├── AssessmentSetup.tsx      # Quiz/Worksheet setup
│   │   └── AssessmentMode.tsx       # Unified quiz/worksheet interface
│   │
│   ├── 👪 Parent Features
│   │   └── ParentDashboard.tsx      # Insights & study planner
│   │
│   └── 👨‍🏫 Teacher Features
│       ├── TeacherModeSelector.tsx   # 5 teacher modes
│       ├── TeacherClassSelector.tsx  # Class/subject selection
│       ├── ContentCreation.tsx       # Lesson content creator
│       ├── CurriculumPlanner.tsx     # Course planning tool
│       ├── WorksheetCreator.tsx      # Worksheet generator
│       ├── TeacherExamCreator.tsx    # Exam creation tool
│       └── TeacherInsights.tsx       # Analytics dashboard
│
├── 📁 hooks/                        # Custom React Hooks
│   └── useTheme.ts                  # Dark/light mode hook
│
├── 📁 types/                        # TypeScript Definitions
│   └── index.ts                     # All type definitions
│
├── 📁 styles/                       # Styling
│   └── globals.css                  # Global styles + Tailwind
│
├── 📁 node_modules/                 # Dependencies (auto-generated)
│
├── 📁 dist/                         # Production build (auto-generated)
│
├── 📄 package.json                  # Dependencies & scripts
├── 📄 package-lock.json             # Dependency lock file
├── 📄 tsconfig.json                 # TypeScript config
├── 📄 tsconfig.node.json            # TypeScript Node config
├── 📄 vite.config.ts                # Vite build config
├── 📄 postcss.config.js             # PostCSS config
├── 📄 .eslintrc.cjs                 # ESLint config
├── 📄 .gitignore                    # Git ignore rules
│
└── 📄 Documentation
    ├── README.md                    # Full documentation
    ├── SETUP_GUIDE.md               # Quick setup guide
    ├── COMMANDS.md                  # Command reference
    └── PROJECT_STRUCTURE.md         # This file
```

---

## 📂 Directory Details

### `/components` - React Components

All UI components organized by feature:

**Authentication (3 files)**
- User login and registration
- Profile selection for parents
- PIN protection system

**Chat System (6 files)**
- Core chat functionality
- Message display and input
- Sidebar and navigation
- Mode switching

**Student Features (9 files)**
- Learning modes (Q&A, Exam, Quiz, etc.)
- Profile screen with report cards
- Setup screens for each mode
- Voice chat in discussion mode

**Parent Features (1 file)**
- Dashboard with insights
- Study planner
- Progress tracking

**Teacher Features (7 files)**
- 5 main teaching modes
- Content creation tools
- Analytics and insights
- Student management

---

### `/hooks` - Custom Hooks

Reusable React hooks:

```typescript
// useTheme.ts
- Manages light/dark theme
- Persists theme in localStorage
- Returns theme state and toggle function
```

---

### `/types` - TypeScript Types

Central type definitions:

```typescript
// index.ts
- User types (Student, Parent, Teacher)
- StudentProfile interface
- ChatMode types
- Message interface
- ExamConfig, HomeworkTopic, etc.
- All shared types
```

---

### `/styles` - Stylesheets

```css
/* globals.css */
- Tailwind CSS imports
- CSS custom properties (theme colors)
- Dark mode variables
- Typography defaults
- Global styles
```

---

## 🔑 Key Files Explained

### `index.html`
- HTML entry point
- Links to main.tsx
- Defines root div
- Meta tags for SEO

### `main.tsx`
- React application entry
- Renders App component
- Imports global styles
- React.StrictMode wrapper

### `App.tsx`
- Main application logic
- Handles authentication state
- Routes between screens
- Theme management

### `package.json`
- Lists all dependencies
- Defines npm scripts
- Project metadata
- Version numbers

### `vite.config.ts`
- Vite build configuration
- Dev server settings
- Port configuration
- Plugin setup

### `tsconfig.json`
- TypeScript compiler options
- File inclusion rules
- Module resolution
- Type checking settings

---

## 📊 Component Hierarchy

```
App.tsx
│
├─ LoginScreen.tsx (if not logged in)
│
├─ ProfileSelector.tsx (if parent, before profile selection)
│
└─ ChatInterface.tsx (main interface)
   │
   ├─ ChatSidebar.tsx
   ├─ ChatHeader.tsx
   │  └─ Profile Button → StudentProfileScreen.tsx
   │
   ├─ ModeSelector.tsx (when changing mode)
   │
   ├─ Student Screens
   │  ├─ ExamSetup.tsx → ExamMode.tsx
   │  ├─ HomeworkSetup.tsx
   │  ├─ RevisionSetup.tsx
   │  ├─ AssessmentSetup.tsx → AssessmentMode.tsx
   │  └─ DiscussionMode.tsx
   │
   ├─ Parent Screens
   │  └─ ParentDashboard.tsx
   │
   ├─ Teacher Screens
   │  ├─ TeacherModeSelector.tsx
   │  ├─ TeacherClassSelector.tsx
   │  ├─ ContentCreation.tsx
   │  ├─ CurriculumPlanner.tsx
   │  ├─ WorksheetCreator.tsx
   │  ├─ TeacherExamCreator.tsx
   │  └─ TeacherInsights.tsx
   │
   ├─ ChatMessages.tsx (message display)
   └─ ChatInput.tsx (message input)
```

---

## 🎯 Data Flow

```
User Input → Component State → Props → Child Components → UI Update
     ↓
localStorage (theme, auth)
     ↓
Persistence across sessions
```

---

## 🔄 State Management

### Global State (App.tsx)
- `currentUser` - Logged in user
- `selectedProfile` - Active student profile (parents)
- `showProfileSelector` - Profile selection visibility
- `theme` - Dark/light mode

### Local State (ChatInterface.tsx)
- `messages` - Chat messages array
- `currentMode` - Active learning mode
- `examConfig` - Exam settings
- `teacherMode` - Active teacher mode
- `showProfileScreen` - Profile modal visibility

### Component State
- Each component manages its own local state
- Props passed down from parent
- Events bubbled up via callbacks

---

## 📦 Dependencies Overview

### Core Dependencies
```json
{
  "react": "^18.2.0",           // UI framework
  "react-dom": "^18.2.0",       // DOM rendering
  "lucide-react": "^0.294.0",   // Icons
  "recharts": "^2.10.3",        // Charts
  "sonner": "^1.2.0"            // Notifications
}
```

### Dev Dependencies
```json
{
  "@vitejs/plugin-react": "^4.2.1",  // Vite React plugin
  "typescript": "^5.2.2",            // Type checking
  "tailwindcss": "^4.0.0",           // Styling
  "autoprefixer": "^10.4.16",        // CSS prefixes
  "eslint": "^8.55.0"                // Code linting
}
```

---

## 🎨 Styling Architecture

### Tailwind CSS Classes
- Utility-first approach
- Dark mode with `dark:` prefix
- Responsive with `sm:`, `md:`, `lg:` prefixes
- Custom colors in globals.css

### Color System
```css
Light Mode:
- Background: white, gray-50
- Text: gray-900, gray-700
- Borders: gray-200, gray-300

Dark Mode:
- Background: gray-900, gray-800
- Text: white, gray-300
- Borders: gray-700, gray-600
```

---

## 🔒 Protected Files

**Do not edit:**
- `/components/figma/ImageWithFallback.tsx` (system file)
- `/node_modules/*` (auto-generated)
- `/dist/*` (build output)
- `package-lock.json` (auto-generated)

---

## 📝 Configuration Files

| File | Purpose | Edit? |
|------|---------|-------|
| `package.json` | Dependencies | ✅ Yes |
| `vite.config.ts` | Build config | ✅ Yes |
| `tsconfig.json` | TypeScript | ✅ Yes |
| `.gitignore` | Git rules | ✅ Yes |
| `.eslintrc.cjs` | Linting rules | ✅ Yes |
| `postcss.config.js` | CSS processing | ⚠️ Rarely |
| `package-lock.json` | Dep versions | ❌ No |

---

## 🚀 Development Workflow

1. **Edit** component in `/components`
2. **Save** file (Ctrl+S)
3. **Browser** auto-reloads
4. **Test** changes
5. **Commit** to git

---

## 📈 Scaling the Project

### Adding New Features

**New Student Mode:**
1. Create setup component: `components/NewModeSetup.tsx`
2. Create mode component: `components/NewMode.tsx`
3. Add to `types/index.ts`: `ChatMode = '...' | 'newmode'`
4. Import in `ChatInterface.tsx`
5. Add to mode selector

**New Teacher Tool:**
1. Create tool component: `components/TeacherNewTool.tsx`
2. Add to `TeacherMode` type
3. Add to `TeacherModeSelector.tsx`
4. Import in `ChatInterface.tsx`

**New Dashboard Widget:**
1. Create widget: `components/NewWidget.tsx`
2. Import in `ParentDashboard.tsx` or `TeacherInsights.tsx`
3. Add to layout grid

---

## 🧪 Testing Structure (Future)

```
tests/
├── unit/
│   ├── components/
│   ├── hooks/
│   └── utils/
├── integration/
│   └── flows/
└── e2e/
    └── scenarios/
```

---

**📚 This structure is designed for scalability and maintainability!**

Navigate the codebase with confidence using this guide.
