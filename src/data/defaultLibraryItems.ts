import { ETHIOPIAN_GRADE_9_COVERS } from './bookCovers';

export interface LibraryContentItem {
  id: string;
  title: string;
  subject: string;
  grade: number;
  content_type: 'books' | 'vocabulary' | 'grammar' | 'reference' | 'videos';
  description: string;
  cover_image_url?: string;
  access_level: 'free' | 'premium';
  file_url?: string;
  created_at: string;
}

export const ETHIOPIA_GRADE_9_LIBRARY_ITEMS: LibraryContentItem[] = [
  {
    id: 'ethiopia-g9-math-new-curriculum',
    title: 'Ethiopian Grade 9 Mathematics - New Curriculum',
    subject: 'Mathematics',
    grade: 9,
    content_type: 'books',
    description: 'Official Ministry of Education (MoE) Grade 9 Mathematics Student Textbook covering Sets, Real Numbers, Quadratic Functions, Geometry, Trigonometry, and Statistics.',
    access_level: 'free',
    file_url: '/books/ethiopia-grade-9-math.pdf',
    cover_image_url: ETHIOPIAN_GRADE_9_COVERS['ethiopia-g9-math-new-curriculum'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'ethiopia-g9-physics-new-curriculum',
    title: 'Ethiopian Grade 9 Physics - New Curriculum',
    subject: 'Physics',
    grade: 9,
    content_type: 'books',
    description: 'Ministry of Education Grade 9 Physics Textbook covering Measurements, Motion, Forces, Newton Laws, Work, Energy, Power, Simple Machines, and Fluid Dynamics.',
    access_level: 'free',
    file_url: '/books/ethiopia-grade-9-physics.pdf',
    cover_image_url: ETHIOPIAN_GRADE_9_COVERS['ethiopia-g9-physics-new-curriculum'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'ethiopia-g9-chemistry-new-curriculum',
    title: 'Ethiopian Grade 9 Chemistry - New Curriculum',
    subject: 'Chemistry',
    grade: 9,
    content_type: 'books',
    description: 'Comprehensive Grade 9 Chemistry Textbook detailing Atomic Structure, Periodic Classification, Chemical Bonding, Stoichiometry, and States of Matter.',
    access_level: 'free',
    file_url: '/books/ethiopia-grade-9-chemistry.pdf',
    cover_image_url: ETHIOPIAN_GRADE_9_COVERS['ethiopia-g9-chemistry-new-curriculum'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'ethiopia-g9-biology-new-curriculum',
    title: 'Ethiopian Grade 9 Biology - New Curriculum',
    subject: 'Biology',
    grade: 9,
    content_type: 'books',
    description: 'MoE Grade 9 Biology Textbook detailing Cell Biology, Human Biology, Digestive System, Plants & Photosynthesis, Genetics, and Ethiopian Biodiversity & Ecology.',
    access_level: 'free',
    file_url: '/books/ethiopia-grade-9-biology.pdf',
    cover_image_url: ETHIOPIAN_GRADE_9_COVERS['ethiopia-g9-biology-new-curriculum'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'ethiopia-g9-english-new-curriculum',
    title: 'Ethiopian Grade 9 English - New Curriculum',
    subject: 'English',
    grade: 9,
    content_type: 'books',
    description: 'Grade 9 English Student Textbook focused on Listening, Speaking, Reading Comprehension, Descriptive & Persuasive Essay Writing, and Grammar in Context.',
    access_level: 'free',
    file_url: '/books/ethiopia-grade-9-english.pdf',
    cover_image_url: ETHIOPIAN_GRADE_9_COVERS['ethiopia-g9-english-new-curriculum'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'ethiopia-g9-afan-oromo-new-curriculum',
    title: 'Ethiopian Grade 9 Afan Oromo - New Curriculum',
    subject: 'Afan Oromo',
    grade: 9,
    content_type: 'books',
    description: 'Kitaaba Barataa Afaan Oromoo Kutaa 9ffaa: Caaslugaa, Og-barruu, Dubbisuu fi Barreeffama Seeraan Barachuu.',
    access_level: 'free',
    file_url: '/books/ethiopia-grade-9-afanoromo.pdf',
    cover_image_url: ETHIOPIAN_GRADE_9_COVERS['ethiopia-g9-afan-oromo-new-curriculum'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'ethiopia-g9-curriculum-guide-reference',
    title: 'Ethiopian Grade 9 New Curriculum Official Guide & Syllabus',
    subject: 'Curriculum Guide',
    grade: 9,
    content_type: 'reference',
    description: 'Official Ethiopian Ministry of Education Grade 9 Textbook Guide & Competency Framework Overview.',
    access_level: 'free',
    file_url: '/books/ethiopia-grade-9-guide.pdf',
    cover_image_url: ETHIOPIAN_GRADE_9_COVERS['ethiopia-g9-curriculum-guide-reference'],
    created_at: new Date().toISOString(),
  }
];
