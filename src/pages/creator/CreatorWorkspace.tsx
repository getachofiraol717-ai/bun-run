import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor, { OnMount } from '@monaco-editor/react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import CreatorLayout from './CreatorLayout';
import { useWorkspaceStore } from '@/plugins/margeos/vscode-workspace/store/workspaceStore';
import { FileSystemService } from '@/plugins/margeos/vscode-workspace/services/FileSystemService';
import { ExecutionOrchestrator } from '@/plugins/margeos/terminal-sandbox/core/ExecutionOrchestrator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { aiStream } from './aiClient';
import { buildProjectSrcDoc } from './previewBuilder';
import {
  Plus, Trash2, Save, Play, Download, Upload, Folder, FolderOpen, FileCode2, FileText, FileJson, Sparkles,
  PanelLeftClose, PanelLeftOpen, Loader2, X, Eye, Terminal as TermIcon,
  Check, CloudOff, CircleDot, GitBranch, GitCommit as GitCommitIcon,
  AlertTriangle, History, ChevronRight, ChevronDown, RotateCw, ExternalLink, Smartphone, Tablet, Monitor,
  Maximize2, Minimize2, Laptop, RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

const db = supabase as any;

type File = { id?: string; path: string; content: string; language: string };
type Project = { id: string; name: string; description: string; language: string };
type GitCommitT = { id: string; message: string; timestamp: number; parent: string | null; snapshot: Record<string, string>; branch: string };

const LANG_FROM_EXT: Record<string, string> = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript', jsx: 'javascript',
  html: 'html', htm: 'html', css: 'css', scss: 'scss',
  json: 'json', md: 'markdown', py: 'python', sql: 'sql',
  java: 'java', cpp: 'cpp', cc: 'cpp', c: 'c', h: 'cpp',
  go: 'go', rs: 'rust', sh: 'shell', yml: 'yaml', yaml: 'yaml',
  txt: 'plaintext',
};
const langOf = (path: string) => LANG_FROM_EXT[path.split('.').pop()?.toLowerCase() ?? ''] ?? 'plaintext';

const TEMPLATES: Record<string, File[]> = {
  blank: [{ path: 'README.md', content: '# New Project\n\nBuilt in Knowledge Universe.\n', language: 'markdown' }],
  web: [
    { path: 'index.html', content:
`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>My KU App</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="hero">
    <h1>Hello, Universe 🌌</h1>
    <p>Edit the files on the left and hit ▶ Run.</p>
    <button id="b">Click me</button>
    <p id="msg"></p>
  </div>
  <script src="app.js"></script>
</body>
</html>
`, language: 'html' },
    { path: 'style.css', content:
`* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: system-ui, sans-serif; background:#0a0a1a; color:#fff; min-height:100vh; display:flex; align-items:center; justify-content:center; }
.hero { text-align:center; padding:3rem; background:rgba(255,255,255,0.05); border:1px solid rgba(124,58,237,0.3); border-radius:1rem; backdrop-filter:blur(20px); }
h1 { font-size:2.5rem; color:#a78bfa; margin-bottom:.5rem; }
p { color:#94a3b8; margin:.5rem 0; }
button { background:linear-gradient(135deg,#7c3aed,#6366f1); color:#fff; border:0; padding:.7rem 1.5rem; border-radius:.5rem; cursor:pointer; font-size:1rem; margin-top:1rem; transition:transform .15s; }
button:hover { transform:scale(1.05); }
#msg { font-size:1.1rem; color:#a78bfa; min-height:1.5rem; margin-top:1rem; }
`, language: 'css' },
    { path: 'app.js', content:
`const msgs = [
  'Hello from your KU project! 👋',
  'Building something amazing! 🚀',
  'The universe is yours! 🌌',
];
let i = 0;
document.getElementById('b').addEventListener('click', () => {
  document.getElementById('msg').textContent = msgs[i++ % msgs.length];
});
console.log('KU App loaded!');
`, language: 'javascript' },
    { path: 'README.md', content: '# My Web App\n\nBuilt on Knowledge Universe Creator.\n\n## Run\nOpen `index.html` or use Live Preview.\n', language: 'markdown' },
  ],
  react: [
    { path: 'src/main.tsx', content:
`import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './App.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
`, language: 'typescript' },
    { path: 'src/App.tsx', content:
`import { useState } from 'react'
import './App.css'

export default function App() {
  const [count, setCount] = useState(0)
  return (
    <div className="app">
      <h1>🌌 Knowledge Universe</h1>
      <p className="sub">React + Vite + TypeScript</p>
      <div className="card">
        <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
        <p>Edit <code>src/App.tsx</code> to start building!</p>
      </div>
    </div>
  )
}
`, language: 'typescript' },
    { path: 'src/App.css', content:
`.app { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg,#0a0612,#1a0a2e); color:#e2e8f0; font-family:'Segoe UI',sans-serif; }
h1 { font-size:2.5rem; color:#a78bfa; }
.sub { color:#94a3b8; margin:.5rem 0 1.5rem; }
.card { background:rgba(255,255,255,0.06); border:1px solid rgba(139,92,246,0.3); padding:2rem; border-radius:1rem; text-align:center; }
button { background:linear-gradient(135deg,#8b5cf6,#6366f1); color:#fff; border:none; padding:.6rem 1.5rem; border-radius:.5rem; font-size:1rem; cursor:pointer; transition:transform .2s; }
button:hover { transform:scale(1.05); }
code { color:#a78bfa; background:rgba(139,92,246,.15); padding:.1rem .4rem; border-radius:.25rem; }
`, language: 'css' },
    { path: 'index.html', content:
`<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>KU React App</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
`, language: 'html' },
    { path: 'package.json', content: '{\n  "name": "ku-react-app",\n  "version": "0.0.1",\n  "scripts": { "dev": "vite", "build": "tsc && vite build", "preview": "vite preview" },\n  "dependencies": { "react": "^18.3.1", "react-dom": "^18.3.1" },\n  "devDependencies": { "@types/react": "^18.3.1", "@types/react-dom": "^18.3.1", "@vitejs/plugin-react": "^4.3.1", "typescript": "^5.5.3", "vite": "^5.4.1" }\n}\n', language: 'json' },
    { path: 'vite.config.ts', content: "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })\n", language: 'typescript' },
    { path: 'README.md', content: '# KU React App\n\n```bash\nnpm install\nnpm run dev\n```\n', language: 'markdown' },
  ],
  typescript: [
    { path: 'src/index.ts', content:
`// TypeScript starter — Knowledge Universe

interface Student {
  name: string;
  grade: number;
  xp: number;
  subjects: string[];
}

function enroll(s: Student, subject: string): Student {
  if (s.subjects.includes(subject)) return s;
  console.log(\`✅ \${s.name} enrolled in \${subject}! XP: \${s.xp + 10}\`);
  return { ...s, xp: s.xp + 10, subjects: [...s.subjects, subject] };
}

function study(s: Student, subject: string, hours: number): Student {
  const earned = Math.floor(hours * 25);
  console.log(\`📚 \${subject} · \${hours}h → +\${earned} XP (Total: \${s.xp + earned})\`);
  return { ...s, xp: s.xp + earned };
}

let abebe: Student = { name: 'Abebe', grade: 10, xp: 0, subjects: [] };
abebe = enroll(abebe, 'Mathematics');
abebe = enroll(abebe, 'TypeScript');
abebe = study(abebe, 'TypeScript', 2.5);
console.log('🌟 Final:', JSON.stringify(abebe, null, 2));
`, language: 'typescript' },
    { path: 'tsconfig.json', content: '{\n  "compilerOptions": {\n    "target": "ES2020",\n    "module": "ESNext",\n    "moduleResolution": "bundler",\n    "strict": true,\n    "esModuleInterop": true,\n    "skipLibCheck": true\n  },\n  "include": ["src"]\n}\n', language: 'json' },
  ],
  python: [
    { path: 'main.py', content:
`# Python starter — Knowledge Universe

class Student:
    def __init__(self, name: str, grade: int):
        self.name = name
        self.grade = grade
        self.xp = 0
        self.subjects: list[str] = []

    def enroll(self, subject: str) -> None:
        if subject not in self.subjects:
            self.subjects.append(subject)
            self.xp += 10
            print(f"OK {self.name} enrolled in {subject}! XP: {self.xp}")

    def study(self, subject: str, hours: float) -> int:
        earned = int(hours * 25)
        self.xp += earned
        print(f"Study {subject} x{hours}h -> +{earned} XP (Total: {self.xp})")
        return earned

    def __repr__(self) -> str:
        return f"Student({self.name!r}, grade={self.grade}, xp={self.xp})"


if __name__ == "__main__":
    s = Student("Abebe", 10)
    for sub in ["Mathematics", "Physics", "Python"]:
        s.enroll(sub)
    s.study("Python", 2.5)
    s.study("Mathematics", 1.5)
    print("Result:", s)
`, language: 'python' },
    { path: 'requirements.txt', content: '# Add dependencies here\n# numpy\n# pandas\n', language: 'plaintext' },
    { path: 'README.md', content: '# Python Project\n\n```bash\npython main.py\n```\n', language: 'markdown' },
  ],
  js: [{ path: 'main.js', content: '// JavaScript playground\nconsole.log("Hello from KU");\n', language: 'javascript' }],
  sql: [
    { path: 'schema.sql', content:
`-- Knowledge Universe — SQL Starter

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    grade INTEGER NOT NULL,
    xp INTEGER DEFAULT 0
);

CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    subject TEXT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO students (name, grade, xp) VALUES
  ('Abebe', 10, 0),
  ('Chaltu', 9, 25);

INSERT INTO enrollments (student_id, subject) VALUES
  (1, 'Mathematics'),
  (1, 'Physics'),
  (2, 'Biology');
`, language: 'sql' },
    { path: 'queries.sql', content:
`-- Example queries

-- Top students by XP
SELECT name, grade, xp
FROM students
ORDER BY xp DESC;

-- Subjects per student
SELECT s.name, e.subject, e.enrolled_at
FROM students s
JOIN enrollments e ON e.student_id = s.id
ORDER BY s.name;

-- Count enrollments per subject
SELECT subject, COUNT(*) AS total
FROM enrollments
GROUP BY subject
ORDER BY total DESC;
`, language: 'sql' },
    { path: 'README.md', content: '# SQL Project\n\nSchema + example queries for a student database. Use the AI assistant to explain or extend these queries.\n', language: 'markdown' },
  ],
  java: [
    { path: 'Main.java', content:
`// Knowledge Universe — Java Starter

import java.util.*;

public class Main {
    static class Student {
        String name;
        int grade;
        int xp = 0;
        List<String> subjects = new ArrayList<>();

        Student(String name, int grade) {
            this.name = name;
            this.grade = grade;
        }

        void enroll(String subject) {
            if (!subjects.contains(subject)) {
                subjects.add(subject);
                xp += 10;
                System.out.println("Enrolled " + name + " in " + subject + "! XP: " + xp);
            }
        }

        void study(String subject, double hours) {
            int earned = (int) (hours * 25);
            xp += earned;
            System.out.println("Studied " + subject + " for " + hours + "h -> +" + earned + " XP (Total: " + xp + ")");
        }

        public String toString() {
            return "Student{name='" + name + "', grade=" + grade + ", xp=" + xp + "}";
        }
    }

    public static void main(String[] args) {
        Student abebe = new Student("Abebe", 10);
        abebe.enroll("Mathematics");
        abebe.enroll("Physics");
        abebe.enroll("Java");
        abebe.study("Java", 2.5);
        abebe.study("Mathematics", 1.5);
        System.out.println(abebe);
    }
}
`, language: 'java' },
    { path: 'README.md', content: '# Java Project\n\n```bash\njavac Main.java\njava Main\n```\n', language: 'markdown' },
  ],
  cpp: [
    { path: 'main.cpp', content:
`// Knowledge Universe — C++ Starter
#include <iostream>
#include <string>
#include <vector>

class Student {
public:
    std::string name;
    int grade;
    int xp = 0;
    std::vector<std::string> subjects;

    Student(std::string n, int g) : name(n), grade(g) {}

    void enroll(const std::string& subject) {
        for (auto& s : subjects) if (s == subject) return;
        subjects.push_back(subject);
        xp += 10;
        std::cout << "Enrolled " << name << " in " << subject << "! XP: " << xp << "\\n";
    }

    void study(const std::string& subject, double hours) {
        int earned = static_cast<int>(hours * 25);
        xp += earned;
        std::cout << "Studied " << subject << " for " << hours << "h -> +" << earned << " XP (Total: " << xp << ")\\n";
    }
};

int main() {
    Student abebe("Abebe", 10);
    abebe.enroll("Mathematics");
    abebe.enroll("Physics");
    abebe.enroll("C++");
    abebe.study("C++", 2.5);
    abebe.study("Mathematics", 1.5);
    std::cout << "Final XP: " << abebe.xp << "\\n";
    return 0;
}
`, language: 'cpp' },
    { path: 'README.md', content: '# C++ Project\n\n```bash\ng++ -std=c++17 main.cpp -o main\n./main\n```\n', language: 'markdown' },
  ],
  go: [
    { path: 'main.go', content:
`// Knowledge Universe — Go Starter
package main

import "fmt"

type Student struct {
	Name     string
	Grade    int
	XP       int
	Subjects []string
}

func (s *Student) Enroll(subject string) {
	for _, sub := range s.Subjects {
		if sub == subject {
			return
		}
	}
	s.Subjects = append(s.Subjects, subject)
	s.XP += 10
	fmt.Printf("Enrolled %s in %s! XP: %d\\n", s.Name, subject, s.XP)
}

func (s *Student) Study(subject string, hours float64) {
	earned := int(hours * 25)
	s.XP += earned
	fmt.Printf("Studied %s for %.1fh -> +%d XP (Total: %d)\\n", subject, hours, earned, s.XP)
}

func main() {
	abebe := &Student{Name: "Abebe", Grade: 10}
	abebe.Enroll("Mathematics")
	abebe.Enroll("Physics")
	abebe.Enroll("Go")
	abebe.Study("Go", 2.5)
	abebe.Study("Mathematics", 1.5)
	fmt.Printf("Final: %+v\\n", abebe)
}
`, language: 'go' },
    { path: 'go.mod', content: 'module ku-project\n\ngo 1.22\n', language: 'plaintext' },
    { path: 'README.md', content: '# Go Project\n\n```bash\ngo run main.go\n```\n', language: 'markdown' },
  ],
  rust: [
    { path: 'src/main.rs', content:
`// Knowledge Universe — Rust Starter

#[derive(Debug)]
struct Student {
    name: String,
    grade: u8,
    xp: u32,
    subjects: Vec<String>,
}

impl Student {
    fn new(name: &str, grade: u8) -> Self {
        Student { name: name.to_string(), grade, xp: 0, subjects: Vec::new() }
    }

    fn enroll(&mut self, subject: &str) {
        if !self.subjects.iter().any(|s| s == subject) {
            self.subjects.push(subject.to_string());
            self.xp += 10;
            println!("Enrolled {} in {}! XP: {}", self.name, subject, self.xp);
        }
    }

    fn study(&mut self, subject: &str, hours: f64) {
        let earned = (hours * 25.0) as u32;
        self.xp += earned;
        println!("Studied {} for {}h -> +{} XP (Total: {})", subject, hours, earned, self.xp);
    }
}

fn main() {
    let mut abebe = Student::new("Abebe", 10);
    abebe.enroll("Mathematics");
    abebe.enroll("Physics");
    abebe.enroll("Rust");
    abebe.study("Rust", 2.5);
    abebe.study("Mathematics", 1.5);
    println!("Final: {:?}", abebe);
}
`, language: 'rust' },
    { path: 'Cargo.toml', content: '[package]\nname = "ku-project"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\n', language: 'plaintext' },
    { path: 'README.md', content: '# Rust Project\n\n```bash\ncargo run\n```\n', language: 'markdown' },
  ],
};

interface FileItemNode {
  name: string;
  fullPath: string;
  isFolder: boolean;
  children: FileItemNode[];
  file?: File;
}

function buildNestedFileTree(filesList: File[]): FileItemNode[] {
  const root: FileItemNode[] = [];

  filesList.forEach(file => {
    const parts = file.path.split('/').filter(Boolean);
    let currentLevel = root;

    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      const fullPath = parts.slice(0, idx + 1).join('/');
      let existingNode = currentLevel.find(n => n.name === part);

      if (!existingNode) {
        existingNode = {
          name: part,
          fullPath,
          isFolder: !isLast,
          children: [],
          file: isLast ? file : undefined,
        };
        currentLevel.push(existingNode);
      }

      if (!isLast) {
        currentLevel = existingNode.children;
      }
    });
  });

  const sortNodes = (nodes: FileItemNode[]) => {
    nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(n => {
      if (n.isFolder) sortNodes(n.children);
    });
  };

  sortNodes(root);
  return root;
}

function renderFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
    return <FileCode2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />;
  }
  if (['json', 'yaml', 'yml'].includes(ext)) {
    return <FileJson className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
  }
  if (['md', 'txt', 'pdf'].includes(ext)) {
    return <FileText className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
  }
  return <FileCode2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />;
}

function FileTreeNodeItem({
  node,
  depth = 0,
  activePath,
  openFile,
  deleteFile
}: {
  node: FileItemNode;
  depth?: number;
  activePath: string | null;
  openFile: (path: string) => void;
  deleteFile: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  if (node.isFolder) {
    return (
      <div>
        <div
          className="flex items-center gap-1.5 px-2 py-1 text-xs cursor-pointer hover:bg-muted/50 rounded text-foreground/80 font-medium select-none"
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          {expanded ? (
            <FolderOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-amber-400/80 shrink-0" />
          )}
          <span className="truncate flex-1 font-mono">{node.name}</span>
        </div>
        {expanded && (
          <div>
            {node.children.map(child => (
              <FileTreeNodeItem
                key={child.fullPath}
                node={child}
                depth={depth + 1}
                activePath={activePath}
                openFile={openFile}
                deleteFile={deleteFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = activePath === node.fullPath;

  return (
    <div
      className={`group flex items-center gap-1.5 px-2 py-1 text-xs cursor-pointer rounded transition-colors select-none ${
        isActive
          ? 'bg-primary/20 text-primary font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
      }`}
      style={{ paddingLeft: `${depth * 12 + 18}px` }}
      onClick={() => openFile(node.fullPath)}
    >
      {renderFileIcon(node.name)}
      <span className="truncate flex-1 font-mono">{node.name}</span>
      <button
        onClick={e => {
          e.stopPropagation();
          deleteFile(node.fullPath);
        }}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity p-0.5"
        title="Remove file"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function CreatorWorkspace() {
  const { user } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'responsive' | 'iphone' | 'android' | 'ipad' | 'laptop' | 'desktop'>('responsive');
  const [previewOrientation, setPreviewOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [mobileWorkspaceTab, setMobileWorkspaceTab] = useState<'editor' | 'preview' | 'files' | 'terminal' | 'ai'>('editor');
  const [previewRefreshing, setPreviewRefreshing] = useState(false);
  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTeachMode, setAiTeachMode] = useState<'beginner'|'intermediate'|'advanced'|'expert'>('intermediate');
  const [aiMessages, setAiMessages] = useState<{role:'user'|'assistant';content:string;id:string}[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const aiBusyRef = useRef(false);
  const aiAbortRef = useRef<AbortController|null>(null);
  const aiBottomRef = useRef<HTMLDivElement>(null);
  const aiMsgsRef = useRef(aiMessages);
  useEffect(() => { aiMsgsRef.current = aiMessages; }, [aiMessages]);
  useEffect(() => { aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages.length]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTpl, setNewTpl] = useState<keyof typeof TEMPLATES>('web');
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const [termOpen, setTermOpen] = useState(false);
  const [termLines, setTermLines] = useState<string[]>([
    'KU Sandbox Terminal v0.1 — type `help` for commands.',
  ]);
  const [termCwd, setTermCwd] = useState<string>('/');
  const [termInput, setTermInput] = useState('');
  const [termHistory, setTermHistory] = useState<string[]>([]);
  const [termHistIdx, setTermHistIdx] = useState<number>(-1);
  const saveTimers = useRef<Record<string, any>>({});
  const previewRef = useRef<HTMLIFrameElement>(null);

  // ── Git (in-memory sandbox repo) ──────────────────────────────────
  const [gitOpen, setGitOpen]               = useState(false);
  const [gitInit, setGitInit]               = useState(false);
  const [gitBranches, setGitBranches]       = useState<Record<string, string | null>>({ main: null });
  const [gitCurrentBranch, setGitCurrentBranch] = useState('main');
  const [gitStaged, setGitStaged]           = useState<Set<string>>(new Set());
  const [gitCommits, setGitCommits]         = useState<Record<string, GitCommitT>>({});
  const [commitMsg, setCommitMsg]           = useState('');
  const [aiCommitBusy, setAiCommitBusy]     = useState(false);
  const [aiExplainId, setAiExplainId]       = useState<string | null>(null);
  const [aiExplainText, setAiExplainText]   = useState('');
  const [mergeConflicts, setMergeConflicts] = useState<string[]>([]);
  const [aiResolveBusy, setAiResolveBusy]   = useState(false);

const LOCAL_PROJ_KEY = 'ku_creator_projects_local';
const getLocalProjects = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PROJ_KEY) || '[]');
  } catch {
    return [];
  }
};
const saveLocalProject = (proj: any) => {
  try {
    const existing = getLocalProjects().filter(p => p.id !== proj.id);
    localStorage.setItem(LOCAL_PROJ_KEY, JSON.stringify([proj, ...existing]));
  } catch { /* ignore */ }
};
const getLocalFiles = (projId: string): File[] => {
  try {
    return JSON.parse(localStorage.getItem(`ku_creator_files_${projId}`) || '[]');
  } catch {
    return [];
  }
};
const saveLocalFiles = (projId: string, filesList: File[]) => {
  try {
    localStorage.setItem(`ku_creator_files_${projId}`, JSON.stringify(filesList));
  } catch { /* ignore */ }
};

  const activeFile = files.find(f => f.path === activePath) || null;

  // ── Load projects list
  useEffect(() => {
    const local = getLocalProjects();
    if (user) {
      db.from('creator_projects').select('*').eq('user_id', user.id).order('updated_at', { ascending: false })
        .then(({ data }: any) => {
          const remote = data ?? [];
          const ids = new Set(remote.map((r: any) => r.id));
          const combined = [...remote, ...local.filter((l: any) => !ids.has(l.id))];
          setProjects(combined);
        })
        .catch(() => setProjects(local));
    } else {
      setProjects(local);
    }
  }, [user]);

  // ── Resolve current project (route param OR first project OR new prompt)
  useEffect(() => {
    (async () => {
      if (projectId) {
        const localMatch = getLocalProjects().find(p => p.id === projectId);
        if (localMatch) { setProject(localMatch); return; }
        if (user) {
          const { data } = await db.from('creator_projects').select('*').eq('id', projectId).maybeSingle();
          if (data) { setProject(data); return; }
        }
      }
      if (projects.length) {
        setProject(projects[0]);
        navigate(`/creator/workspace/${projects[0].id}`, { replace: true });
      } else if (!showNewProject) {
        setShowNewProject(true);
      }
    })();
  }, [projectId, projects, user]);

  // ── Load files when project changes
  useEffect(() => {
    if (!project) { setFiles([]); setOpenTabs([]); setActivePath(null); return; }

    const localFs = getLocalFiles(project.id);
    if (localFs.length > 0) {
      setFiles(localFs);
      const first = localFs.find(f => /index\.html|main\.(js|py|ts)|README\.md/i.test(f.path)) || localFs[0];
      if (first) { setOpenTabs([first.path]); setActivePath(first.path); }
      return;
    }

    if (user && !project.id.startsWith('proj_')) {
      db.from('creator_files').select('*').eq('project_id', project.id).order('path')
        .then(({ data }: any) => {
          if (data && data.length > 0) {
            const fs = data.map((f: any) => ({ id: f.id, path: f.path, content: f.content ?? '', language: f.language || langOf(f.path) }));
            setFiles(fs);
            saveLocalFiles(project.id, fs);
            const first = fs.find((f: File) => /index\.html|main\.(js|py|ts)|README\.md/i.test(f.path)) || fs[0];
            if (first) { setOpenTabs([first.path]); setActivePath(first.path); }
            return;
          }
          const tplFiles = TEMPLATES[project.template || 'blank'] ?? TEMPLATES.blank;
          const fs = tplFiles.map((f, idx) => ({ id: `file_${idx}`, path: f.path, content: f.content, language: f.language }));
          setFiles(fs);
          saveLocalFiles(project.id, fs);
          const first = fs.find(f => /index\.html|main\.(js|py|ts)|README\.md/i.test(f.path)) || fs[0];
          if (first) { setOpenTabs([first.path]); setActivePath(first.path); }
        })
        .catch(() => {
          const tplFiles = TEMPLATES[project.template || 'blank'] ?? TEMPLATES.blank;
          const fs = tplFiles.map((f, idx) => ({ id: `file_${idx}`, path: f.path, content: f.content, language: f.language }));
          setFiles(fs);
          saveLocalFiles(project.id, fs);
          const first = fs.find(f => /index\.html|main\.(js|py|ts)|README\.md/i.test(f.path)) || fs[0];
          if (first) { setOpenTabs([first.path]); setActivePath(first.path); }
        });
    } else {
      const tplFiles = TEMPLATES[project.template || 'blank'] ?? TEMPLATES.blank;
      const fs = tplFiles.map((f, idx) => ({ id: `file_${idx}`, path: f.path, content: f.content, language: f.language }));
      setFiles(fs);
      saveLocalFiles(project.id, fs);
      const first = fs.find(f => /index\.html|main\.(js|py|ts)|README\.md/i.test(f.path)) || fs[0];
      if (first) { setOpenTabs([first.path]); setActivePath(first.path); }
    }
  }, [project, user]);

  // ── Sync with canonical VSCode Workspace Store
  useEffect(() => {
    if (!project) return;
    const store = useWorkspaceStore.getState();
    store.setCurrentProject(project.id);
    store.setCurrentWorkspace(project.id);

    try {
      const fsService = FileSystemService.getInstance();
      files.forEach((f) => {
        fsService.createFile(project.id, f.path.split('/').pop() || f.path, f.path, f.content);
      });
    } catch { /* ignore duplicates */ }

    openTabs.forEach((filePath) => {
      const f = files.find((file) => file.path === filePath);
      if (f) {
        store.openTab({
          id: `tab_${project.id}_${f.path}`,
          fileId: f.id || f.path,
          fileName: f.path.split('/').pop() || f.path,
          filePath: f.path,
          language: f.language || langOf(f.path),
          content: f.content,
        });
      }
    });

    if (activePath) {
      const activeTab = store.openTabs.find((t) => t.filePath === activePath);
      if (activeTab) {
        store.setActiveTab(activeTab.id);
      }
    }
  }, [project, files, openTabs, activePath]);

  // ── Create new project
  const createProject = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      toast.error('Please enter a project name');
      return;
    }

    const tplKey = newTpl || 'web';
    const tplFiles = TEMPLATES[tplKey] ?? TEMPLATES.blank;
    let newProjObj: any = null;

    if (user) {
      try {
        const { data: p, error } = await db.from('creator_projects').insert({
          user_id: user.id, name: trimmedName, language: tplKey, template: tplKey,
        }).select().single();
        if (!error && p) {
          newProjObj = p;
          await db.from('creator_files').insert(tplFiles.map(f => ({ project_id: p.id, ...f })));
        }
      } catch (err) {
        console.warn('Supabase project creation fallback to local:', err);
      }
    }

    if (!newProjObj) {
      const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      newProjObj = {
        id,
        user_id: user?.id || 'guest_user',
        name: trimmedName,
        language: tplKey,
        template: tplKey,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    saveLocalProject(newProjObj);
    const formattedFiles = tplFiles.map((f, idx) => ({
      id: `f_${Date.now()}_${idx}`,
      path: f.path,
      content: f.content,
      language: f.language || langOf(f.path)
    }));
    saveLocalFiles(newProjObj.id, formattedFiles);

    setProjects(prev => [newProjObj, ...prev.filter(p => p.id !== newProjObj.id)]);
    setProject(newProjObj);
    setFiles(formattedFiles);
    setShowNewProject(false);
    setNewName('');
    navigate(`/creator/workspace/${newProjObj.id}`);
    toast.success(`Project "${trimmedName}" created!`);
  };

  // ── File ops
  const openFile = (path: string) => {
    setActivePath(path);
    setOpenTabs(t => t.includes(path) ? t : [...t, path]);
  };
  const closeTab = (path: string) => {
    setOpenTabs(t => {
      const next = t.filter(x => x !== path);
      if (activePath === path) setActivePath(next[next.length - 1] ?? null);
      return next;
    });
  };
  const addFile = async () => {
    if (!project) return;
    const path = prompt('New file path (e.g. src/utils.js)');
    if (!path) return;
    if (files.some(f => f.path === path)) return toast.error('Already exists');
    const f = { id: `f_${Date.now()}`, project_id: project.id, path, content: '', language: langOf(path) };
    if (user && !project.id.startsWith('proj_')) {
      try {
        const { data } = await db.from('creator_files').insert({ project_id: project.id, path, content: '', language: f.language }).select().single();
        if (data?.id) f.id = data.id;
      } catch { /* fallback */ }
    }
    const updated = [...files, f];
    setFiles(updated);
    saveLocalFiles(project.id, updated);
    openFile(path);
  };
  const deleteFile = async (path: string) => {
    if (!project) return;
    if (!confirm(`Delete ${path}?`)) return;
    if (user && !project.id.startsWith('proj_')) {
      try {
        await db.from('creator_files').delete().eq('project_id', project.id).eq('path', path);
      } catch { /* fallback */ }
    }
    const updated = files.filter(f => f.path !== path);
    setFiles(updated);
    saveLocalFiles(project.id, updated);
    setOpenTabs(t => t.filter(x => x !== path));
    if (activePath === path) setActivePath(null);
  };

  // ── Save a single file with retry + state feedback
  const saveFile = useCallback(async (path: string, content: string) => {
    if (!project) return;
    setSaveState('saving');

    setFiles(prev => {
      const updated = prev.map(f => f.path === path ? { ...f, content } : f);
      saveLocalFiles(project.id, updated);
      return updated;
    });

    if (user && !project.id.startsWith('proj_')) {
      try {
        await db.from('creator_files')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('project_id', project.id).eq('path', path);
      } catch { /* local saved */ }
    }

    setSaveState('saved');
    setTimeout(() => setSaveState(s => s === 'saved' ? 'idle' : s), 1500);
  }, [project, user]);

  // ── Autosave on edit (debounced)
  const onEdit = (val: string | undefined) => {
    if (!activeFile || !project) return;
    const content = val ?? '';
    setFiles(prev => prev.map(f => f.path === activeFile.path ? { ...f, content } : f));
    setSaveState('dirty');
    const store = useWorkspaceStore.getState();
    const tab = store.openTabs.find(t => t.filePath === activeFile.path);
    if (tab) store.updateTabContent(tab.id, content);
    clearTimeout(saveTimers.current[activeFile.path]);
    saveTimers.current[activeFile.path] = setTimeout(() => saveFile(activeFile.path, content), 700);
  };

  // ── Manual save (Ctrl/Cmd+S) + beforeunload guard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (activeFile) {
          clearTimeout(saveTimers.current[activeFile.path]);
          saveFile(activeFile.path, activeFile.content);
        }
      }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveState === 'dirty' || saveState === 'saving') {
        e.preventDefault(); e.returnValue = '';
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [activeFile, saveState, saveFile]);

  // ── Build preview (supports HTML/CSS/JS, React, TS, Python, Markdown)
  const buildSrcDoc = useCallback(() => {
    return buildProjectSrcDoc(files);
  }, [files]);

  // ── Live iframe message listener
  useEffect(() => {
    const handleFrameMsg = (e: MessageEvent) => {
      if (e.data && e.data.__ku_preview) {
        if (e.data.type === 'log') {
          setConsoleLines(prev => [...prev.slice(-80), `[${e.data.level || 'info'}] ${e.data.text}`]);
        } else if (e.data.type === 'error') {
          setConsoleLines(prev => [...prev.slice(-80), `[ERROR] ${e.data.text}`]);
        }
      }
    };
    window.addEventListener('message', handleFrameMsg);
    return () => window.removeEventListener('message', handleFrameMsg);
  }, []);

  // ── Manual refresh preview
  const refreshPreview = useCallback(() => {
    setPreviewRefreshing(true);
    if (previewRef.current) {
      previewRef.current.srcdoc = buildSrcDoc();
    }
    setTimeout(() => setPreviewRefreshing(false), 300);
    toast.success('Live preview reloaded');
  }, [buildSrcDoc]);

  // ── Pop out preview into a new tab
  const popOutPreview = useCallback(() => {
    const doc = buildSrcDoc();
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [buildSrcDoc]);

  // ── Run code
  const run = async () => {
    if (!activeFile && files.length === 0) return;
    if (previewRef.current) {
      previewRef.current.srcdoc = buildSrcDoc();
    }
    setPreviewOpen(true);
    toast.success('Project executed in Live Preview');
  };

  // Auto-refresh preview on file change or project change (debounced)
  useEffect(() => {
    if (!previewOpen) return;
    const id = setTimeout(() => {
      if (previewRef.current) {
        previewRef.current.srcdoc = buildSrcDoc();
      }
    }, 400);
    return () => clearTimeout(id);
  }, [files, previewOpen, buildSrcDoc]);

  // ── ZIP export
  const exportZip = async () => {
    if (!project) return;
    const zip = new JSZip();
    files.forEach(f => zip.file(f.path, f.content));
    zip.file('ku-project.json', JSON.stringify({ name: project.name, language: project.language, exportedAt: new Date().toISOString() }, null, 2));
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${project.name.replace(/\s+/g, '-').toLowerCase()}.zip`);
    toast.success('Downloaded ZIP');
  };

  // ── ZIP import
  const importZip = async (file: globalThis.File) => {
    if (!project) return;
    if (file.size > 25 * 1024 * 1024) { toast.error('ZIP too large (max 25MB)'); return; }
    let zip: JSZip;
    try { zip = await JSZip.loadAsync(file); }
    catch { toast.error('Not a valid ZIP file'); return; }
    const entries = Object.values(zip.files).filter((e: any) => !e.dir);
    if (entries.length === 0) { toast.error('ZIP is empty'); return; }
    if (entries.length > 500) { toast.error('Too many files (max 500)'); return; }
    // Strip common top-level folder if every entry shares it
    const top = entries[0].name.split('/')[0];
    const stripTop = entries.every(e => e.name.startsWith(top + '/'));
    let added = 0, skipped = 0;
    for (const e of entries) {
      if (e.name === 'ku-project.json') continue;
      let path = stripTop ? e.name.slice(top.length + 1) : e.name;
      if (!path || path.includes('..') || path.startsWith('/')) { skipped++; continue; }
      // Skip binaries / oversized
      // @ts-ignore JSZip exposes _data.uncompressedSize
      const size = (e as any)._data?.uncompressedSize ?? 0;
      if (size > 1024 * 1024) { skipped++; continue; }
      const content = await e.async('string');
      if (/\x00/.test(content.slice(0, 4096))) { skipped++; continue; }
      const language = langOf(path);
      const exists = files.some(f => f.path === path);
      if (exists) {
        await db.from('creator_files').update({ content, updated_at: new Date().toISOString() })
          .eq('project_id', project.id).eq('path', path);
        setFiles(prev => prev.map(f => f.path === path ? { ...f, content, language } : f));
      } else {
        const { data } = await db.from('creator_files').insert({ project_id: project.id, path, content, language }).select().single();
        setFiles(prev => [...prev, { id: data?.id, path, content, language }]);
      }
      added++;
    }
    toast.success(`Imported ${added} files${skipped ? ` (${skipped} skipped)` : ''}`);
  };

  // ── AI Code Assistant with conversation history ──────────────────
  const askAI = async () => {
    if (!aiPrompt.trim() || aiBusyRef.current) return;
    const userText = aiPrompt.trim();
    const aiId = `ai_${Date.now()}`;
    setAiMessages(prev => [
      ...prev,
      { id: `u_${Date.now()}`, role: 'user',      content: userText },
      { id: aiId,              role: 'assistant', content: '' },
    ]);
    setAiPrompt('');
    aiBusyRef.current = true; setAiBusy(true);
    const controller = new AbortController();
    aiAbortRef.current = controller;

    const ctxFile = activeFile
      ? `\n\n[FILE: ${activeFile.path}]\n\`\`\`${activeFile.language}\n${activeFile.content.slice(0, 3000)}\n\`\`\``
      : '';
    const projectCtx = project ? `[PROJECT: ${project.name} | ${project.language}]` : '';
    const TEACH_INSTR: Record<typeof aiTeachMode, string> = {
      beginner:     'Explain everything step-by-step as if to someone writing their first program. Avoid jargon, use simple analogies, and define any technical terms you use.',
      intermediate: 'Balance explanation with code. Assume basic programming knowledge — variables, loops, functions.',
      advanced:     'Skip basics. Focus on best practices, design patterns, edge cases, and trade-offs.',
      expert:       'Peer-to-peer technical discussion. Be concise, discuss internals, performance, and architecture trade-offs directly.',
    };

    // Build history (max 8 previous turns, must start with user)
    const raw = aiMsgsRef.current
      .filter(m => m.content.trim())
      .slice(-8)
      .map(m => ({ role: m.role, content: m.content }));
    while (raw.length > 0 && raw[0].role === 'assistant') raw.shift();
    const hist: {role:'user'|'assistant';content:string}[] = [];
    for (const m of raw) {
      const last = hist[hist.length - 1];
      if (last && last.role === m.role) last.content += '\n\n' + m.content;
      else hist.push({ ...m });
    }
    hist.push({ role: 'user', content: userText + ctxFile });

    try {
      await aiStream({
        mode: 'coding',
        messages: [
          { role: 'user', content: `${projectCtx}\nYou are a senior software engineer and coding mentor. Help me with my project.\n\nTeaching mode: ${aiTeachMode}. ${TEACH_INSTR[aiTeachMode]}` },
          { role: 'assistant', content: 'Understood. I\'m your AI Code Assistant — ready to help debug, explain, generate, and refactor your code at the right depth for you.' },
          ...hist,
        ],
        onToken: (t) => setAiMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: m.content + t } : m)),
        signal: controller.signal,
      });
    } catch (e: any) {
      const errMsg = e?.name === 'AbortError' ? '⚠️ Stopped.' : `⚠️ ${e.message || 'AI error'}`;
      setAiMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: prev.find(x => x.id === aiId)?.content + '\n' + errMsg } : m));
    } finally {
      aiBusyRef.current = false; setAiBusy(false); aiAbortRef.current = null;
    }
  };

  // ── Sandbox terminal — operates on in-memory project files
  // ── Git helpers (in-memory sandbox repo) ──────────────────────────
  const headCommit = useCallback((): GitCommitT | null => {
    const id = gitBranches[gitCurrentBranch];
    return id ? gitCommits[id] ?? null : null;
  }, [gitBranches, gitCurrentBranch, gitCommits]);

  const getModifiedFiles = useCallback((): string[] => {
    const head = headCommit();
    const headSnap = head?.snapshot ?? {};
    const out: string[] = [];
    for (const f of files) {
      if (headSnap[f.path] !== f.content) out.push(f.path);
    }
    for (const p of Object.keys(headSnap)) {
      if (!files.some(f => f.path === p)) out.push(`${p} (deleted)`);
    }
    return out;
  }, [files, headCommit]);

  const gitInitRepo = () => {
    if (gitInit) { termPrint('Git repository already initialized.'); return; }
    setGitInit(true);
    setGitBranches({ main: null });
    setGitCurrentBranch('main');
    setGitStaged(new Set());
    setGitCommits({});
    setMergeConflicts([]);
    termPrint(
      'Initialized empty Git repository (in-memory sandbox) on branch main ✅',
      'Note: this is a learning sandbox — branches live only for this session.',
    );
  };

  const gitStatus = () => {
    if (!gitInit) { termPrint('fatal: not a git repository (run `git init`)'); return; }
    const modified = getModifiedFiles();
    const staged = Array.from(gitStaged);
    const unstaged = modified.filter(p => !gitStaged.has(p.replace(' (deleted)', '')));
    const lines = [`On branch ${gitCurrentBranch}`];
    if (staged.length) {
      lines.push('Changes to be committed:');
      staged.forEach(p => lines.push(`  staged: ${p}`));
    }
    if (unstaged.length) {
      lines.push('Changes not staged for commit:');
      unstaged.forEach(p => lines.push(`  modified: ${p}`));
    }
    if (!staged.length && !unstaged.length) lines.push('nothing to commit, working tree clean');
    termPrint(...lines);
  };

  const gitAdd = (arg: string) => {
    if (!gitInit) { termPrint('fatal: not a git repository (run `git init`)'); return; }
    if (arg === '.' || !arg) {
      const modified = getModifiedFiles().map(p => p.replace(' (deleted)', ''));
      setGitStaged(new Set(modified));
      termPrint(`Staged ${modified.length} file(s)`);
      return;
    }
    if (!files.some(f => f.path === arg)) { termPrint(`fatal: pathspec '${arg}' did not match any files`); return; }
    setGitStaged(prev => new Set(prev).add(arg));
    termPrint(`Staged ${arg}`);
  };

  const gitCommit = (message: string): string | null => {
    if (!gitInit) { termPrint('fatal: not a git repository (run `git init`)'); return null; }
    if (gitStaged.size === 0) { termPrint('nothing to commit (use "git add")'); return null; }
    if (!message.trim()) { termPrint('error: commit message required (use -m "message")'); return null; }
    const head = headCommit();
    const snapshot: Record<string, string> = { ...(head?.snapshot ?? {}) };
    for (const p of gitStaged) {
      const f = files.find(x => x.path === p);
      if (f) snapshot[p] = f.content;
      else delete snapshot[p];
    }
    const id = Math.random().toString(36).slice(2, 9);
    const commit: GitCommitT = { id, message: message.trim(), timestamp: Date.now(), parent: head?.id ?? null, snapshot, branch: gitCurrentBranch };
    setGitCommits(prev => ({ ...prev, [id]: commit }));
    setGitBranches(prev => ({ ...prev, [gitCurrentBranch]: id }));
    setGitStaged(new Set());
    termPrint(`[${gitCurrentBranch} ${id}] ${message.trim()}`);
    return id;
  };

  const gitLog = () => {
    if (!gitInit) { termPrint('fatal: not a git repository (run `git init`)'); return; }
    let id: string | undefined = gitBranches[gitCurrentBranch];
    if (!id) { termPrint('No commits yet'); return; }
    const lines: string[] = [];
    while (id) {
      const c = gitCommits[id];
      if (!c) break;
      lines.push(`${c.id}  ${new Date(c.timestamp).toLocaleString()}  ${c.message}`);
      id = c.parent || undefined;
    }
    termPrint(...lines);
  };

  const gitBranchCmd = (name?: string) => {
    if (!gitInit) { termPrint('fatal: not a git repository (run `git init`)'); return; }
    if (!name) {
      termPrint(...Object.keys(gitBranches).map(b => (b === gitCurrentBranch ? '* ' : '  ') + b));
      return;
    }
    if (gitBranches[name]) { termPrint(`fatal: branch '${name}' already exists`); return; }
    setGitBranches(prev => ({ ...prev, [name]: prev[gitCurrentBranch] }));
    termPrint(`Created branch '${name}' from '${gitCurrentBranch}'`);
  };

  const gitCheckout = (name: string, createNew = false) => {
    if (!gitInit) { termPrint('fatal: not a git repository (run `git init`)'); return; }
    if (!name) { termPrint('usage: git checkout <branch> | git checkout -b <new-branch>'); return; }
    if (createNew) {
      if (gitBranches[name]) { termPrint(`fatal: branch '${name}' already exists`); return; }
    } else if (!(name in gitBranches)) {
      termPrint(`error: pathspec '${name}' did not match any branch`); return;
    }
    if (getModifiedFiles().length > 0) {
      termPrint('error: you have uncommitted changes. Commit them or run `git reset --hard` first.');
      return;
    }
    if (createNew) setGitBranches(prev => ({ ...prev, [name]: prev[gitCurrentBranch] }));
    const targetId = createNew ? gitBranches[gitCurrentBranch] : gitBranches[name];
    const snapshot = targetId ? gitCommits[targetId]?.snapshot ?? {} : {};
    const newFiles: File[] = Object.entries(snapshot).map(([path, content]) => {
      const existing = files.find(f => f.path === path);
      return { id: existing?.id, path, content, language: existing?.language ?? langOf(path) };
    });
    if (newFiles.length) setFiles(newFiles);
    setGitCurrentBranch(name);
    setOpenTabs(prev => {
      const next = prev.filter(p => newFiles.some(f => f.path === p));
      return next.length ? next : (newFiles[0] ? [newFiles[0].path] : []);
    });
    setActivePath(prev => (newFiles.some(f => f.path === prev) ? prev : (newFiles[0]?.path ?? null)));
    termPrint(`Switched to ${createNew ? 'a new ' : ''}branch '${name}'`);
  };

  const gitMerge = (branch: string) => {
    if (!gitInit) { termPrint('fatal: not a git repository (run `git init`)'); return; }
    if (!branch) { termPrint('usage: git merge <branch>'); return; }
    if (!(branch in gitBranches)) { termPrint(`error: branch '${branch}' not found`); return; }
    const currentId = gitBranches[gitCurrentBranch];
    const incomingId = gitBranches[branch];
    if (!incomingId) { termPrint(`branch '${branch}' has no commits`); return; }
    if (currentId === incomingId) { termPrint('Already up to date.'); return; }
    const currentSnap = currentId ? gitCommits[currentId].snapshot : {};
    const incomingSnap = gitCommits[incomingId].snapshot;
    const conflicts: string[] = [];
    const merged: Record<string, string> = { ...currentSnap };
    for (const [path, content] of Object.entries(incomingSnap)) {
      if (!(path in currentSnap)) { merged[path] = content; continue; }
      if (currentSnap[path] !== content) {
        conflicts.push(path);
        merged[path] = `<<<<<<< ${gitCurrentBranch}\n${currentSnap[path]}\n=======\n${content}\n>>>>>>> ${branch}\n`;
      }
    }
    const newFiles: File[] = Object.entries(merged).map(([path, content]) => {
      const existing = files.find(f => f.path === path);
      return { id: existing?.id, path, content, language: existing?.language ?? langOf(path) };
    });
    setFiles(newFiles);
    if (conflicts.length) {
      setMergeConflicts(conflicts);
      setGitOpen(true);
      termPrint(
        `Auto-merging...`,
        `CONFLICT (content): Merge conflict in ${conflicts.join(', ')}`,
        'Fix conflicts (or click "Resolve with AI" in the Git panel), then `git add <file>` and `git commit`.',
      );
    } else {
      const id = Math.random().toString(36).slice(2, 9);
      const commit: GitCommitT = { id, message: `Merge branch '${branch}' into ${gitCurrentBranch}`, timestamp: Date.now(), parent: currentId, snapshot: merged, branch: gitCurrentBranch };
      setGitCommits(prev => ({ ...prev, [id]: commit }));
      setGitBranches(prev => ({ ...prev, [gitCurrentBranch]: id }));
      termPrint(`Merge made (no conflicts). [${gitCurrentBranch} ${id}] Merge branch '${branch}' into ${gitCurrentBranch}`);
    }
  };

  const gitResetHard = () => {
    if (!gitInit) { termPrint('fatal: not a git repository (run `git init`)'); return; }
    const head = headCommit();
    const snapshot = head?.snapshot ?? {};
    const newFiles: File[] = Object.entries(snapshot).map(([path, content]) => {
      const existing = files.find(f => f.path === path);
      return { id: existing?.id, path, content, language: existing?.language ?? langOf(path) };
    });
    setFiles(newFiles);
    setGitStaged(new Set());
    setMergeConflicts([]);
    termPrint(`HEAD is now at ${head?.id ?? '(no commits)'}. Working tree reset.`);
  };

  // AI: generate a commit message from the current diff
  const aiGenerateCommitMsg = async () => {
    const modified = getModifiedFiles();
    if (modified.length === 0) { toast.error('No changes to describe'); return; }
    setAiCommitBusy(true);
    const head = headCommit();
    const summary = modified.map(p => {
      const clean = p.replace(' (deleted)', '');
      const f = files.find(x => x.path === clean);
      const before = head?.snapshot[clean] ?? '';
      const after = f?.content ?? '';
      return p.includes('(deleted)')
        ? `Deleted: ${clean}`
        : `${before ? 'Modified' : 'Added'}: ${clean} (${before.length} → ${after.length} chars)`;
    }).join('\n');
    try {
      const msg = await aiStream({
        mode: 'coding',
        messages: [{ role: 'user', content: `Generate a concise, conventional-commits style commit message (one short line, max 72 chars, optionally with a 1-2 line body) for these changes:\n\n${summary}\n\nReturn ONLY the commit message text — no quotes, no markdown, no labels.` }],
      });
      setCommitMsg(msg.trim().replace(/^["'`]|["'`]$/g, ''));
    } catch (e: any) { toast.error(e.message); }
    setAiCommitBusy(false);
  };

  // AI: explain what a commit changed
  const aiExplainCommit = async (id: string) => {
    const c = gitCommits[id];
    if (!c) return;
    setAiExplainId(id); setAiExplainText('');
    const parentSnap = c.parent ? gitCommits[c.parent]?.snapshot ?? {} : {};
    const changed = Object.keys(c.snapshot).filter(p => parentSnap[p] !== c.snapshot[p]);
    const ctx = changed.map(p => `--- ${p} ---\n${c.snapshot[p].slice(0, 800)}`).join('\n\n');
    try {
      await aiStream({
        mode: 'coding',
        messages: [{ role: 'user', content: `Explain this git commit in plain language for a student learning version control.\n\nCommit message: "${c.message}"\nFiles changed: ${changed.join(', ') || '(none detected)'}\n\n${ctx.slice(0, 3000)}` }],
        onToken: t => setAiExplainText(prev => prev + t),
      });
    } catch (e: any) { setAiExplainText(`⚠️ ${e.message}`); }
  };

  // AI: resolve a merge conflict in a file
  const aiResolveConflict = async (path: string) => {
    const f = files.find(x => x.path === path);
    if (!f) return;
    setAiResolveBusy(true);
    try {
      let resolved = await aiStream({
        mode: 'coding',
        messages: [{ role: 'user', content: `This file has git merge conflict markers (<<<<<<<, =======, >>>>>>>). Resolve the conflict by intelligently combining both sides — keep working functionality from both where sensible. Return ONLY the final resolved file content, no conflict markers, no markdown code fences, no explanation.\n\nFile: ${path}\n\n${f.content}` }],
      });
      resolved = resolved.replace(/^```[\w-]*\n?/, '').replace(/```\s*$/, '').trim();
      setFiles(prev => prev.map(x => x.path === path ? { ...x, content: resolved } : x));
      setMergeConflicts(prev => prev.filter(p => p !== path));
      setGitStaged(prev => new Set(prev).add(path));
      toast.success(`AI resolved conflict in ${path} — review and commit`);
    } catch (e: any) { toast.error(e.message); }
    setAiResolveBusy(false);
  };


  const termPrint = (...lines: string[]) => setTermLines(prev => [...prev, ...lines]);
  const runTerm = async (raw: string) => {
    const line = raw.trim();
    termPrint(`${termCwd} $ ${raw}`);
    if (!line) return;
    setTermHistory(prev => (prev[prev.length - 1] === line ? prev : [...prev, line]).slice(-100));
    setTermHistIdx(-1);

    if (line === 'clear') { setTermLines([]); return; }

    const [cmd, ...args] = line.split(/\s+/);
    const resolve = (p: string) => {
      if (!p) return termCwd;
      if (p.startsWith('/')) return p.replace(/\/+$/, '') || '/';
      const base = termCwd === '/' ? '' : termCwd;
      const parts = (base + '/' + p).split('/').filter(Boolean);
      const stack: string[] = [];
      for (const seg of parts) {
        if (seg === '.') continue;
        if (seg === '..') stack.pop();
        else stack.push(seg);
      }
      return '/' + stack.join('/');
    };
    const fileAt = (p: string) => files.find(f => '/' + f.path === p);

    try {
      if (cmd === 'help') {
        termPrint('Commands: help, ls [path], cd <path>, cat <file>, echo <text>, pwd, clear, history, run <file.js>, node -e "<code>", python <file.py>, touch <file>, rm <file>');
        termPrint('Git: git init | status | add <file|.> | commit -m "msg" | log | branch [name] | checkout [-b] <branch> | merge <branch> | diff | reset --hard');
        return;
      }
      if (cmd === 'history') {
        termPrint(...termHistory.map((c, i) => `${i + 1}  ${c}`));
        return;
      }

      // Route code execution and tool commands to ExecutionOrchestrator
      const orchestrator = ExecutionOrchestrator.getInstance();
      const workspaceFiles = files.map(f => ({ path: f.path, content: f.content }));

      const execMeta = await orchestrator.execute({
        userId: project?.id ? `user-${project.id}` : 'creator-student',
        projectId: project?.id || 'creator-workspace',
        workspaceId: project?.id || 'creator-workspace',
        command: line,
        cwd: termCwd,
        files: workspaceFiles,
      });

      if (execMeta.stdout) termPrint(execMeta.stdout);
      if (execMeta.stderr) termPrint(`[err] ${execMeta.stderr}`);
      if (execMeta.error) termPrint(`[error] ${execMeta.error}`);

      if (cmd === 'cd' && execMeta.status === 'completed') {
        const p = resolve(args[0] ?? '/');
        setTermCwd(p);
      }
    } catch (e: any) { termPrint('error: ' + (e.message || String(e))); }
  };

  // ── Render
  return (
    <CreatorLayout fullBleed>
      {/* Top toolbar */}
      <div className="min-h-12 py-1.5 px-3 flex items-center gap-2 border-b border-border/50 bg-card/40 backdrop-blur sticky top-16 z-10 overflow-x-auto no-scrollbar">
        <button onClick={() => setSidebarOpen(s => !s)} className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground shrink-0 hidden lg:inline-flex">
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </button>
        <select
          value={project?.id ?? ''}
          onChange={(e) => navigate(`/creator/workspace/${e.target.value}`)}
          className="bg-muted/50 text-xs sm:text-sm rounded px-2 py-1 border border-border/60 max-w-[140px] sm:max-w-[200px] shrink-0"
        >
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={() => setShowNewProject(true)} className="text-xs px-2 py-1 rounded border border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-1 shrink-0">
          <Plus className="h-3 w-3" /> New
        </button>
        <div className="flex-1 min-w-2" />
        <button onClick={run} className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs sm:text-sm font-poppins inline-flex items-center gap-1.5 hover:brightness-110 shrink-0 font-medium">
          <Play className="h-3.5 w-3.5" /> Run
        </button>
        <button onClick={() => { setPreviewOpen(true); setMobileWorkspaceTab('preview'); }} className="px-2 py-1.5 rounded border border-border text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-xs sm:text-sm shrink-0">
          <Eye className="h-3.5 w-3.5" /> Preview
        </button>
        <button onClick={() => { setTermOpen(o => !o); setMobileWorkspaceTab('terminal'); }} className="px-2 py-1.5 rounded border border-border text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-xs sm:text-sm shrink-0">
          <TermIcon className="h-3.5 w-3.5" /> Terminal
        </button>
        <button onClick={() => setGitOpen(o => !o)} className={`px-2 py-1.5 rounded border inline-flex items-center gap-1.5 text-xs sm:text-sm shrink-0 ${mergeConflicts.length ? 'border-destructive/50 text-destructive' : 'border-border text-muted-foreground hover:text-primary'}`}>
          <GitBranch className="h-3.5 w-3.5" /> Git{gitInit && <span className="text-[10px] opacity-70">({gitCurrentBranch})</span>}
          {mergeConflicts.length > 0 && <AlertTriangle className="h-3 w-3" />}
        </button>
        <button onClick={() => { setAiOpen(o => !o); setMobileWorkspaceTab('ai'); }} className="px-2 py-1.5 rounded border border-accent/40 text-accent hover:bg-accent/10 inline-flex items-center gap-1.5 text-xs sm:text-sm shrink-0">
          <Sparkles className="h-3.5 w-3.5" /> AI
        </button>
        <span className="ml-1 text-[11px] inline-flex items-center gap-1 text-muted-foreground min-w-[70px] shrink-0">
          {saveState === 'saving' && <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>}
          {saveState === 'saved' && <><Check className="h-3 w-3 text-green-400" /> Saved</>}
          {saveState === 'dirty' && <><CircleDot className="h-3 w-3 text-amber-400" /> Unsaved</>}
          {saveState === 'error' && <><CloudOff className="h-3 w-3 text-destructive" /> Offline</>}
        </span>
        <button onClick={exportZip} className="px-2 py-1.5 rounded border border-border text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-xs sm:text-sm shrink-0">
          <Download className="h-3.5 w-3.5" /> ZIP
        </button>
        <label className="px-2 py-1.5 rounded border border-border text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer shrink-0">
          <Upload className="h-3.5 w-3.5" /> Import
          <input type="file" accept=".zip" className="hidden" onChange={e => e.target.files?.[0] && importZip(e.target.files[0])} />
        </label>
      </div>

      {/* Mobile / Tablet Mode Tab Switcher (< lg screens) */}
      <div className="lg:hidden flex items-center bg-card/60 border-b border-border/50 px-2 py-1.5 gap-1 overflow-x-auto text-xs">
        <button
          onClick={() => setMobileWorkspaceTab('editor')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
            mobileWorkspaceTab === 'editor' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileCode2 className="h-3.5 w-3.5" /> Code
        </button>
        <button
          onClick={() => setMobileWorkspaceTab('preview')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
            mobileWorkspaceTab === 'preview' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Eye className="h-3.5 w-3.5" /> Preview
        </button>
        <button
          onClick={() => setMobileWorkspaceTab('files')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
            mobileWorkspaceTab === 'files' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Folder className="h-3.5 w-3.5" /> Files ({files.length})
        </button>
        <button
          onClick={() => setMobileWorkspaceTab('terminal')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
            mobileWorkspaceTab === 'terminal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <TermIcon className="h-3.5 w-3.5" /> Terminal
        </button>
        <button
          onClick={() => setMobileWorkspaceTab('ai')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
            mobileWorkspaceTab === 'ai' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" /> AI
        </button>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100dvh-7.5rem)] lg:h-[calc(100dvh-7rem)] overflow-hidden">
        {/* File tree (Visible when sidebarOpen on desktop OR when mobileWorkspaceTab === 'files' on mobile) */}
        {(sidebarOpen || mobileWorkspaceTab === 'files') && (
          <aside className={`${mobileWorkspaceTab === 'files' ? 'flex flex-1 w-full lg:w-60' : 'hidden lg:flex lg:w-60'} shrink-0 border-r border-border/50 bg-card/30 backdrop-blur flex-col`}>
            <div className="px-3 py-2 flex items-center justify-between border-b border-border/50">
              <span className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Folder className="h-3 w-3" /> Files
              </span>
              <button onClick={addFile} className="p-1 rounded hover:bg-primary/10 text-primary"><Plus className="h-3.5 w-3.5" /></button>
            </div>
            <div className="flex-1 overflow-auto py-2 px-1">
              {files.length === 0 && <div className="px-3 text-xs text-muted-foreground">No files.</div>}
              {buildNestedFileTree(files).map(node => (
                <FileTreeNodeItem
                  key={node.fullPath}
                  node={node}
                  activePath={activePath}
                  openFile={(path) => {
                    openFile(path);
                    setMobileWorkspaceTab('editor');
                  }}
                  deleteFile={deleteFile}
                />
              ))}
            </div>
          </aside>
        )}

        {/* Editor + console */}
        <section className={`${mobileWorkspaceTab === 'editor' ? 'flex' : 'hidden lg:flex'} flex-1 min-w-0 flex-col`}>
          {/* Tabs */}
          <div className="h-9 flex items-center bg-card/20 border-b border-border/50 overflow-x-auto no-scrollbar">
            {openTabs.map(p => (
              <div key={p} onClick={() => setActivePath(p)}
                className={`group flex items-center gap-1.5 px-3 h-full border-r border-border/50 cursor-pointer text-xs shrink-0 ${
                  activePath === p ? 'bg-background text-primary' : 'text-muted-foreground hover:text-primary'
                }`}>
                {p}
                <button onClick={(e) => { e.stopPropagation(); closeTab(p); }} className="opacity-50 hover:opacity-100"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>

          {/* Editor */}
          <div className="flex-1 min-h-0">
            {activeFile ? (
              <Editor
                height="100%"
                theme="vs-dark"
                language={activeFile.language}
                value={activeFile.content}
                onChange={onEdit}
                options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, wordWrap: 'on' }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
                Select a file from the file tree, or <button onClick={addFile} className="text-primary underline ml-1">create one</button>.
              </div>
            )}
          </div>

          {/* Console */}
          {consoleLines.length > 0 && (
            <div className="max-h-36 overflow-auto border-t border-border/50 bg-black/60 font-mono text-xs p-3 text-green-300">
              <div className="flex items-center gap-1 text-muted-foreground mb-1"><TermIcon className="h-3 w-3" /> console</div>
              {consoleLines.map((l, i) => <div key={i}>&gt; {l}</div>)}
            </div>
          )}

          {/* Sandbox Terminal (Embedded when open) */}
          {termOpen && (
            <div className="h-52 flex flex-col border-t border-border/50 bg-black/80 font-mono text-xs">
              <div className="px-3 py-1.5 flex items-center justify-between border-b border-border/40 text-muted-foreground">
                <span className="flex items-center gap-1.5"><TermIcon className="h-3 w-3" /> sandbox</span>
                <button onClick={() => setTermOpen(false)} className="hover:text-primary"><X className="h-3 w-3" /></button>
              </div>
              <div className="flex-1 overflow-auto px-3 py-2 text-green-300 whitespace-pre-wrap">
                {termLines.map((l, i) => <div key={i}>{l}</div>)}
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); runTerm(termInput); setTermInput(''); }}
                className="flex items-center gap-2 px-3 py-1.5 border-t border-border/40"
              >
                <span className="text-primary">{termCwd} $</span>
                <input
                  value={termInput}
                  onChange={e => setTermInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (!termHistory.length) return;
                      const ni = termHistIdx < 0 ? termHistory.length - 1 : Math.max(0, termHistIdx - 1);
                      setTermHistIdx(ni); setTermInput(termHistory[ni] ?? '');
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (termHistIdx < 0) return;
                      const ni = termHistIdx + 1;
                      if (ni >= termHistory.length) { setTermHistIdx(-1); setTermInput(''); }
                      else { setTermHistIdx(ni); setTermInput(termHistory[ni]); }
                    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
                      e.preventDefault(); setTermLines([]);
                    }
                  }}
                  placeholder="help"
                  className="flex-1 bg-transparent outline-none text-green-200"
                  autoFocus
                />
              </form>
            </div>
          )}
        </section>

        {/* Dedicated Mobile Terminal View */}
        {mobileWorkspaceTab === 'terminal' && (
          <section className="lg:hidden flex flex-1 min-w-0 flex-col bg-black/90 font-mono text-xs">
            <div className="px-3 py-2 flex items-center justify-between border-b border-border/40 text-muted-foreground bg-card/20">
              <span className="flex items-center gap-1.5"><TermIcon className="h-3.5 w-3.5 text-primary" /> KU Sandbox Terminal</span>
              <button onClick={() => setTermLines([])} className="text-[10px] text-muted-foreground hover:text-foreground">Clear</button>
            </div>
            <div className="flex-1 overflow-auto p-3 text-green-300 whitespace-pre-wrap">
              {termLines.map((l, i) => <div key={i}>{l}</div>)}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); runTerm(termInput); setTermInput(''); }}
              className="flex items-center gap-2 p-2 border-t border-border/40 bg-black"
            >
              <span className="text-primary">{termCwd} $</span>
              <input
                value={termInput}
                onChange={e => setTermInput(e.target.value)}
                placeholder="type help for commands"
                className="flex-1 bg-transparent outline-none text-green-200 text-xs"
                autoFocus
              />
              <button type="submit" className="px-2 py-1 bg-primary text-primary-foreground text-[10px] rounded">Run</button>
            </form>
          </section>
        )}

        {/* Live Preview Panel (Responsive sizing for Phones, Tablets, Laptops, Desktops, and Linux) */}
        {(previewOpen || mobileWorkspaceTab === 'preview') && (
          <aside className={`${mobileWorkspaceTab === 'preview' ? 'flex flex-1 w-full' : 'hidden lg:flex lg:w-[46%]'} border-l border-border/50 bg-background/95 flex-col min-w-[300px]`}>
            {/* Preview Toolbar */}
            <div className="min-h-9 py-1 px-3 flex items-center justify-between border-b border-border/50 text-xs text-muted-foreground bg-card/40 overflow-x-auto no-scrollbar gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-poppins font-medium text-foreground text-xs flex items-center gap-1.5 mr-1">
                  <Eye className="h-3.5 w-3.5 text-primary" /> Preview
                </span>

                {/* Device Sizing Presets */}
                <div className="flex items-center gap-0.5 bg-background/80 border border-border/60 rounded p-0.5">
                  <button
                    onClick={() => setPreviewDevice('responsive')}
                    title="Responsive (Fit to Screen)"
                    className={`px-1.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${previewDevice === 'responsive' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Monitor className="h-3 w-3" />
                    <span className="hidden sm:inline">Fit</span>
                  </button>
                  <button
                    onClick={() => setPreviewDevice('iphone')}
                    title="iPhone 15/16 Pro (393 × 852)"
                    className={`p-1 rounded transition-colors ${previewDevice === 'iphone' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Smartphone className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('android')}
                    title="Android Galaxy (412 × 915)"
                    className={`px-1.5 py-1 rounded text-[10px] font-mono transition-colors ${previewDevice === 'android' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Android
                  </button>
                  <button
                    onClick={() => setPreviewDevice('ipad')}
                    title="iPad / Tablet (820 × 1180)"
                    className={`p-1 rounded transition-colors ${previewDevice === 'ipad' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Tablet className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('laptop')}
                    title="Laptop (1024 × 640)"
                    className={`p-1 rounded transition-colors ${previewDevice === 'laptop' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Laptop className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    title="Desktop / Linux (1280 × 720)"
                    className={`px-1.5 py-1 rounded text-[10px] font-mono transition-colors ${previewDevice === 'desktop' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Desktop
                  </button>
                </div>

                {/* Portrait / Landscape Orientation Switcher */}
                {previewDevice !== 'responsive' && (
                  <button
                    onClick={() => setPreviewOrientation(o => o === 'portrait' ? 'landscape' : 'portrait')}
                    title={`Rotate to ${previewOrientation === 'portrait' ? 'Landscape' : 'Portrait'}`}
                    className="p-1 rounded border border-border/60 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors text-[10px] flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span className="hidden xl:inline capitalize">{previewOrientation}</span>
                  </button>
                )}
              </div>

              {/* Action Controls: Refresh, Popout, Fullscreen, Close */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={refreshPreview}
                  title="Reload preview"
                  className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                >
                  <RotateCw className={`h-3.5 w-3.5 ${previewRefreshing ? 'animate-spin text-primary' : ''}`} />
                </button>
                <button
                  onClick={popOutPreview}
                  title="Open in new window / tab"
                  className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setPreviewFullscreen(true)}
                  title="True Fullscreen Mode"
                  className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setPreviewOpen(false);
                    if (mobileWorkspaceTab === 'preview') setMobileWorkspaceTab('editor');
                  }}
                  title="Close preview"
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Device Canvas Frame Area */}
            <div className="flex-1 bg-neutral-950/80 overflow-auto flex items-center justify-center p-2 sm:p-4">
              <div
                className={`bg-white transition-all duration-200 overflow-hidden shadow-2xl relative ${
                  previewDevice === 'iphone'
                    ? previewOrientation === 'portrait'
                      ? 'w-[393px] h-[780px] max-h-[96%] border-4 border-neutral-800 rounded-[36px] ring-1 ring-neutral-700'
                      : 'w-[780px] h-[393px] max-w-[96%] border-4 border-neutral-800 rounded-[36px] ring-1 ring-neutral-700'
                    : previewDevice === 'android'
                    ? previewOrientation === 'portrait'
                      ? 'w-[412px] h-[820px] max-h-[96%] border-4 border-neutral-800 rounded-[28px] ring-1 ring-neutral-700'
                      : 'w-[820px] h-[412px] max-w-[96%] border-4 border-neutral-800 rounded-[28px] ring-1 ring-neutral-700'
                    : previewDevice === 'ipad'
                    ? previewOrientation === 'portrait'
                      ? 'w-[760px] h-[980px] max-h-[96%] max-w-[96%] border-8 border-neutral-800 rounded-[24px]'
                      : 'w-[980px] h-[700px] max-h-[96%] max-w-[96%] border-8 border-neutral-800 rounded-[24px]'
                    : previewDevice === 'laptop'
                    ? 'w-[1024px] h-[640px] max-w-[98%] max-h-[96%] border-4 border-neutral-800 rounded-lg shadow-2xl'
                    : previewDevice === 'desktop'
                    ? 'w-[1280px] h-[720px] max-w-[98%] max-h-[96%] border-4 border-neutral-800 rounded-md shadow-2xl'
                    : 'w-full h-full rounded-sm'
                }`}
              >
                {/* Simulated device top speaker / notch bar */}
                {(previewDevice === 'iphone' || previewDevice === 'android') && previewOrientation === 'portrait' && (
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 h-4 w-28 bg-neutral-900 rounded-full z-20 pointer-events-none flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-neutral-950 mr-2" />
                    <div className="h-1.5 w-8 rounded-full bg-neutral-800" />
                  </div>
                )}
                <iframe
                  ref={previewRef}
                  title="preview"
                  sandbox="allow-scripts allow-forms allow-modals allow-same-origin allow-popups"
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            </div>
          </aside>
        )}

        {/* AI Code Assistant panel (Visible when aiOpen on desktop OR when mobileWorkspaceTab === 'ai' on mobile) */}
        {(aiOpen || mobileWorkspaceTab === 'ai') && (
          <aside className={`${mobileWorkspaceTab === 'ai' ? 'flex flex-1 w-full' : 'hidden lg:flex lg:w-96'} shrink-0 border-l border-border/50 bg-card/40 backdrop-blur flex-col`}>
            <div className="h-9 px-3 flex items-center justify-between border-b border-border/50">
              <span className="text-xs uppercase tracking-widest text-accent flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> AI Code Assistant</span>
              <div className="flex items-center gap-1">
                {aiMessages.length > 0 && (
                  <button onClick={() => setAiMessages([])} className="text-xs text-muted-foreground hover:text-destructive px-1">Clear</button>
                )}
                <button
                  onClick={() => {
                    setAiOpen(false);
                    if (mobileWorkspaceTab === 'ai') setMobileWorkspaceTab('editor');
                  }}
                  className="text-muted-foreground hover:text-primary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Teaching mode selector */}
            <div className="px-3 py-2 border-b border-border/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest mr-1">Mode</span>
              {(['beginner','intermediate','advanced','expert'] as const).map(m => (
                <button key={m} onClick={() => setAiTeachMode(m)}
                  className={`px-2 py-1 rounded-full text-[10px] font-poppins capitalize transition-colors shrink-0 ${
                    aiTeachMode === m ? 'bg-accent/20 border border-accent/50 text-accent' : 'border border-border/50 text-muted-foreground hover:text-foreground'
                  }`}>
                  {m}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto p-3 space-y-3">
              {aiMessages.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  Ask me to explain, debug, refactor, or generate code for your current file.
                  I remember the conversation context.
                </p>
              )}
              {aiMessages.map((m) => (
                <div key={m.id} className={`rounded-lg p-3 text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-primary/10 border border-primary/20 text-foreground'
                    : 'bg-card/60 border border-border/50 text-foreground'
                }`}>
                  {m.role === 'assistant' && (
                    <div className="text-[10px] text-accent font-mono mb-1.5">🤖 AI Engineer</div>
                  )}
                  {m.content || (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                    </span>
                  )}
                </div>
              ))}
              <div ref={aiBottomRef} />
            </div>

            <div className="p-3 border-t border-border/50 space-y-2">
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askAI(); } }}
                placeholder="Ask me anything about your code… (Enter to send)"
                rows={3}
                className="w-full bg-background/60 border border-border rounded p-2 text-sm focus:border-primary outline-none resize-none"
              />
              <div className="flex gap-2">
                <button disabled={aiBusy} onClick={askAI}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded bg-accent text-accent-foreground font-poppins hover:brightness-110 disabled:opacity-50">
                  {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {aiBusy ? 'Thinking…' : 'Ask AI'}
                </button>
                {aiBusy && (
                  <button onClick={() => aiAbortRef.current?.abort()}
                    className="px-3 py-2 rounded border border-destructive/50 text-destructive hover:bg-destructive/10 text-sm">
                    Stop
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Git panel — in-memory sandbox repo */}
        {gitOpen && (
          <aside className="w-96 shrink-0 border-l border-border/50 bg-card/40 backdrop-blur flex flex-col overflow-hidden">
            <div className="h-9 px-3 flex items-center justify-between border-b border-border/50">
              <span className="text-xs uppercase tracking-widest text-primary flex items-center gap-1.5"><GitBranch className="h-3 w-3" /> Git</span>
              <button onClick={() => setGitOpen(false)} className="text-muted-foreground hover:text-primary"><X className="h-3.5 w-3.5" /></button>
            </div>

            {!gitInit ? (
              <div className="p-4 text-sm text-muted-foreground space-y-3">
                <p>No repository yet. Initialize an in-memory git sandbox to practice commits, branches, and merges — perfect for learning.</p>
                <button onClick={gitInitRepo} className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm font-mono">git init</button>
              </div>
            ) : (
              <div className="flex-1 overflow-auto p-3 space-y-4 text-sm">

                {/* Branches */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Branch</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Object.keys(gitBranches).map(b => (
                      <button key={b} onClick={() => gitCheckout(b)}
                        className={`px-2 py-1 rounded text-xs border ${b === gitCurrentBranch ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground hover:text-primary'}`}>
                        {b}
                      </button>
                    ))}
                    <button onClick={() => { const n = prompt(`New branch from '${gitCurrentBranch}':`); if (n?.trim()) gitBranchCmd(n.trim()); }}
                      className="px-2 py-1 rounded text-xs border border-dashed border-border text-muted-foreground hover:text-primary">
                      + branch
                    </button>
                  </div>
                </div>

                {/* Merge conflicts */}
                {mergeConflicts.length > 0 && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-2 space-y-1.5">
                    <div className="text-[10px] text-destructive uppercase tracking-widest flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Merge Conflicts</div>
                    {mergeConflicts.map(p => (
                      <div key={p} className="flex items-center justify-between gap-2">
                        <button onClick={() => { if (!openTabs.includes(p)) setOpenTabs(prev => [...prev, p]); setActivePath(p); }} className="text-xs text-primary underline truncate">{p}</button>
                        <button onClick={() => aiResolveConflict(p)} disabled={aiResolveBusy}
                          className="text-[10px] px-1.5 py-0.5 rounded border border-accent/40 text-accent hover:bg-accent/10 disabled:opacity-50 inline-flex items-center gap-1 shrink-0">
                          {aiResolveBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Resolve with AI
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Changes */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Changes</div>
                  {(() => {
                    const modified = getModifiedFiles();
                    if (modified.length === 0) return <p className="text-xs text-muted-foreground italic">Working tree clean</p>;
                    return (
                      <div className="space-y-1">
                        {modified.map(p => {
                          const clean = p.replace(' (deleted)', '');
                          const staged = gitStaged.has(clean);
                          return (
                            <label key={p} className="flex items-center gap-2 text-xs cursor-pointer">
                              <input type="checkbox" checked={staged} onChange={() => setGitStaged(prev => {
                                const n = new Set(prev);
                                staged ? n.delete(clean) : n.add(clean);
                                return n;
                              })} />
                              <span className={p.includes('(deleted)') ? 'text-destructive' : 'text-foreground'}>{p}</span>
                            </label>
                          );
                        })}
                        <button onClick={() => gitAdd('.')} className="text-[10px] text-primary underline mt-1">Stage all</button>
                      </div>
                    );
                  })()}
                </div>

                {/* Commit */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Commit</div>
                  <textarea value={commitMsg} onChange={e => setCommitMsg(e.target.value)} rows={2} placeholder="Commit message…"
                    className="w-full bg-background/60 border border-border rounded p-2 text-xs focus:border-primary outline-none resize-none mb-1.5" />
                  <div className="flex gap-2">
                    <button onClick={aiGenerateCommitMsg} disabled={aiCommitBusy}
                      className="px-2 py-1 rounded border border-accent/40 text-accent text-xs inline-flex items-center gap-1 hover:bg-accent/10 disabled:opacity-50">
                      {aiCommitBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI message
                    </button>
                    <button onClick={() => { if (gitCommit(commitMsg)) setCommitMsg(''); }} disabled={gitStaged.size === 0 || !commitMsg.trim()}
                      className="flex-1 px-2 py-1 rounded bg-primary text-primary-foreground text-xs disabled:opacity-40 inline-flex items-center justify-center gap-1.5">
                      <GitCommitIcon className="h-3 w-3" /> Commit {gitStaged.size > 0 ? `(${gitStaged.size})` : ''}
                    </button>
                  </div>
                </div>

                {/* Merge branch */}
                {Object.keys(gitBranches).length > 1 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Merge into {gitCurrentBranch}</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Object.keys(gitBranches).filter(b => b !== gitCurrentBranch).map(b => (
                        <button key={b} onClick={() => gitMerge(b)} className="px-2 py-1 rounded text-xs border border-border text-muted-foreground hover:text-primary hover:border-primary/40">
                          Merge '{b}'
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* History */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1"><History className="h-3 w-3" /> History</div>
                  {(() => {
                    let id: string | undefined = gitBranches[gitCurrentBranch];
                    const list: GitCommitT[] = [];
                    while (id) {
                      const c = gitCommits[id];
                      if (!c) break;
                      list.push(c);
                      id = c.parent || undefined;
                    }
                    if (list.length === 0) return <p className="text-xs text-muted-foreground italic">No commits yet</p>;
                    return (
                      <div className="space-y-1.5">
                        {list.map(c => (
                          <div key={c.id} className="rounded border border-border/40 p-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-xs truncate">{c.message}</div>
                              <button onClick={() => aiExplainCommit(c.id)} className="text-[10px] text-accent hover:underline shrink-0 inline-flex items-center gap-1">
                                <Sparkles className="h-3 w-3" /> Explain
                              </button>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{c.id} · {new Date(c.timestamp).toLocaleString()}</div>
                            {aiExplainId === c.id && (
                              <div className="mt-1.5 text-[11px] text-muted-foreground whitespace-pre-wrap border-t border-border/30 pt-1.5">
                                {aiExplainText || <Loader2 className="h-3 w-3 animate-spin inline" />}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Danger zone */}
                <div className="pt-2 border-t border-border/30">
                  <button onClick={gitResetHard} className="text-[10px] text-destructive hover:underline">
                    git reset --hard (discard uncommitted changes)
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* New project modal */}
      {showNewProject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-card p-6">
            <h3 className="font-orbitron text-xl text-primary mb-4">New Project</h3>
            <label className="text-xs text-muted-foreground">Name</label>
            <input 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              onKeyDown={e => { if (e.key === 'Enter') createProject(); }}
              placeholder="My cosmic app"
              autoFocus
              className="w-full mt-1 mb-3 bg-background/60 border border-border rounded p-2 text-sm focus:border-primary outline-none" 
            />
            <label className="text-xs text-muted-foreground">Template</label>
            <div className="grid grid-cols-3 gap-2 mt-1 mb-4 max-h-64 overflow-y-auto pr-1">
              {([
                ['web','🌐 HTML/CSS/JS'],
                ['react','⚛️ React Vite'],
                ['typescript','🔷 TypeScript'],
                ['js','🟨 JavaScript'],
                ['python','🐍 Python'],
                ['sql','🗄️ SQL'],
                ['java','☕ Java'],
                ['cpp','⚙️ C++'],
                ['go','🐹 Go'],
                ['rust','🦀 Rust'],
                ['blank','📄 Blank'],
              ] as const).map(([k, label]) => (
                <button key={k} onClick={() => setNewTpl(k as any)} className={`px-2 py-2 rounded border text-xs ${newTpl === k ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground hover:text-primary'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-border/40">
              <button 
                onClick={() => { setShowNewProject(false); navigate('/creator/generator'); }} 
                className="px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary text-xs font-poppins flex items-center gap-1.5 hover:bg-primary/20 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" /> Generate with AI
              </button>
              <div className="flex items-center gap-2">
                {projects.length > 0 && <button onClick={() => setShowNewProject(false)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-primary">Cancel</button>}
                <button onClick={createProject} className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-poppins hover:brightness-110">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CreatorLayout>
  );
}