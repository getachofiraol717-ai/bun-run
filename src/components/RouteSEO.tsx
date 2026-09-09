import { useLocation } from 'react-router-dom';
import SEO from './SEO';

/**
 * Fallback per-route metadata for routes whose page components don't render
 * their own <SEO />. Pages that do render <SEO /> are intentionally absent here.
 */
const routeMeta: Record<string, { title: string; description: string; noindex?: boolean }> = {
  '/login': {
    title: 'Sign In — Knowledge Universe',
    description: 'Sign in to Knowledge Universe to continue reading, studying with your AI tutor, and tracking your learning progress.',
  },
  '/register': {
    title: 'Create Your Free Account — Knowledge Universe',
    description: 'Join Knowledge Universe free: Grade 1–12 digital library, AI tutor, adaptive quizzes, and study analytics in one place.',
  },
  '/quiz': {
    title: 'Adaptive Quizzes for Grade 1–12 — Knowledge Universe',
    description: 'Practise with adaptive quizzes that adjust to your level, give instant feedback, and track your score, streaks, and mastery.',
  },
  '/ai-tutor': {
    title: 'MargeOS AI Teacher Engine V2 — Knowledge Universe',
    description: 'Interactive AI tutor that builds lessons with concept cards, worked examples, formula derivations, quick checks, and flashcards.',
  },
  '/galaxy': {
    title: '3D Galaxy Explorer — Learn by Subject',
    description: 'Explore school subjects as planets in an interactive 3D galaxy and jump straight into lessons, books, and quizzes.',
  },
  '/worlds': {
    title: 'Learning Worlds — Themed Study Journeys',
    description: 'Travel through themed learning worlds that turn each subject into a guided journey of lessons, challenges, and rewards.',
  },
  '/guilds': {
    title: 'Study Guilds — Learn Together',
    description: 'Join a study guild, share notes with classmates, set group goals, and climb the guild leaderboards together.',
  },
  '/battles': {
    title: 'Quiz Battles — Compete Live',
    description: 'Challenge other students to live quiz battles, earn XP for every correct answer, and rise up the rankings.',
  },
  '/rooms': {
    title: 'Study Rooms — Focused Group Sessions',
    description: 'Join virtual study rooms with timers and presence so you can stay focused alongside other students in real time.',
  },
  '/pathways': {
    title: 'Learning Pathways — Your Study Roadmap',
    description: 'Follow step-by-step learning pathways that sequence topics, books, and quizzes toward each of your study goals.',
  },
  '/classroom': {
    title: 'Classroom Mode for Teachers',
    description: 'Run lessons with classroom mode: share materials, launch quizzes, and follow student progress live during class.',
  },
  '/creator': {
    title: 'Creator Hub — Build Learning Content',
    description: 'Create, publish, and share your own lessons, quizzes, and study materials with the Knowledge Universe creator tools.',
  },
  '/creator/workspace': {
    title: 'Creator Workspace — Knowledge Universe',
    description: 'Build and edit your learning projects in the creator workspace with AI assistance, drafts, and version history.',
  },
  '/creator/generator': {
    title: 'AI Content Generator for Teachers',
    description: 'Generate lesson outlines, quizzes, and worksheets from any topic or PDF with the Knowledge Universe AI generator.',
  },
  '/creator/academy': {
    title: 'Creator Academy — Learn to Build Courses',
    description: 'Short guided modules that teach you how to design engaging digital lessons and assessments for K–12 students.',
  },
  '/creator/projects': {
    title: 'My Creator Projects — Knowledge Universe',
    description: 'Manage every course, lesson, and quiz project you are building, from first draft to published material.',
  },
  '/creator/marketplace': {
    title: 'Creator Marketplace — Share Learning Material',
    description: 'Discover and publish community-made lessons, quizzes, and study packs for Grade 1–12 subjects.',
  },
  '/creator/lab': {
    title: 'Creator Lab — Experiment with Ideas',
    description: 'Prototype new interactive learning formats and test them with AI feedback before publishing to students.',
  },
  '/creator/collab': {
    title: 'Creator Collaboration — Build as a Team',
    description: 'Invite co-authors, split work, and review changes together while building lessons and assessments.',
  },
  '/creator/roadmap': {
    title: 'Creator Roadmap — What Is Coming Next',
    description: 'See which creator tools and learning features are planned, in progress, and recently shipped.',
  },
  '/settings': {
    title: 'Settings — Knowledge Universe',
    description: 'Manage your profile, language, theme, notifications, and offline download preferences.',
    noindex: true,
  },
  '/analytics': {
    title: 'Study Analytics — Knowledge Universe',
    description: 'Review your study time, books read, quiz scores, and daily streaks over time.',
    noindex: true,
  },
  '/communication': {
    title: 'Communication Hub — Knowledge Universe',
    description: 'Real-time messaging, channels, and student collaboration.',
  },
  '/margeos': {
    title: 'MargeOS Workspace — Knowledge Universe',
    description: 'The MargeOS developer workspace for building and orchestrating learning agents.',
    noindex: true,
  },
  '/logout': { title: 'Signing Out — Knowledge Universe', description: 'Signing you out of Knowledge Universe.', noindex: true },
  '/admin': { title: 'Admin — Knowledge Universe', description: 'Administration area for managing content, navigation, and users.', noindex: true },
  '/admin-login': { title: 'Admin Sign In — Knowledge Universe', description: 'Administrator sign-in for Knowledge Universe.', noindex: true },
  '/admin-access': { title: 'Admin Access — Knowledge Universe', description: 'Request or verify administrator access.', noindex: true },
  '/reset-password': { title: 'Reset Your Password — Knowledge Universe', description: 'Choose a new password for your Knowledge Universe account.', noindex: true },
};

export default function RouteSEO() {
  const { pathname } = useLocation();
  const key = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const meta = routeMeta[key] ?? (key.startsWith('/creator/workspace/') ? routeMeta['/creator/workspace'] : undefined);
  if (!meta) return null;
  return <SEO title={meta.title} description={meta.description} path={key} noindex={meta.noindex} />;
}
