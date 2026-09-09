// High-Fidelity Thematic Cover Images & Vectors for Ethiopian Curriculum & General Textbooks

export interface BookCoverMeta {
  subject: string;
  title: string;
  grade?: number;
  badge?: string;
  primaryColor: string;
  accentColor: string;
  gradientBg: string;
  svgIcon: string;
  vectorArt: string;
}

// Generate SVG Data URI for any book cover
export function generateBookCoverSvg(options: {
  title: string;
  subject: string;
  grade?: number | string;
  edition?: string;
  badge?: string;
  theme?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'blue' | 'rose' | 'orange' | 'teal';
}): string {
  const { title, subject, grade = 9, edition = 'New Curriculum', badge = 'MoE Official' } = options;

  const colorThemes = {
    cyan: {
      gradStart: '#083344',
      gradMid: '#0e7490',
      gradEnd: '#06b6d4',
      accent: '#22d3ee',
      glow: 'rgba(34, 211, 238, 0.4)',
      iconPath: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    },
    purple: {
      gradStart: '#2e1065',
      gradMid: '#6b21a8',
      gradEnd: '#a855f7',
      accent: '#c084fc',
      glow: 'rgba(192, 132, 252, 0.4)',
      iconPath: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    },
    emerald: {
      gradStart: '#022c22',
      gradMid: '#065f46',
      gradEnd: '#10b981',
      accent: '#34d399',
      glow: 'rgba(52, 211, 153, 0.4)',
      iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
    },
    amber: {
      gradStart: '#451a03',
      gradMid: '#b45309',
      gradEnd: '#f59e0b',
      accent: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.4)',
      iconPath: 'M12 3v18m9-9H3',
    },
    blue: {
      gradStart: '#172554',
      gradMid: '#1d4ed8',
      gradEnd: '#3b82f6',
      accent: '#60a5fa',
      glow: 'rgba(96, 165, 250, 0.4)',
      iconPath: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z',
    },
    rose: {
      gradStart: '#4c0519',
      gradMid: '#be123c',
      gradEnd: '#f43f5e',
      accent: '#fb7185',
      glow: 'rgba(251, 113, 133, 0.4)',
      iconPath: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    },
    orange: {
      gradStart: '#431407',
      gradMid: '#c2410c',
      gradEnd: '#f97316',
      accent: '#fb923c',
      glow: 'rgba(251, 146, 60, 0.4)',
      iconPath: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    },
    teal: {
      gradStart: '#042f2e',
      gradMid: '#0f766e',
      gradEnd: '#14b8a6',
      accent: '#2dd4bf',
      glow: 'rgba(45, 212, 191, 0.4)',
      iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    }
  };

  // Determine theme by subject
  let selectedThemeKey: keyof typeof colorThemes = 'blue';
  const subLower = (subject || '').toLowerCase();
  const titleLower = (title || '').toLowerCase();

  if (subLower.includes('math') || titleLower.includes('math')) selectedThemeKey = 'cyan';
  else if (subLower.includes('physic') || titleLower.includes('physic')) selectedThemeKey = 'purple';
  else if (subLower.includes('chem') || titleLower.includes('chem')) selectedThemeKey = 'teal';
  else if (subLower.includes('bio') || titleLower.includes('bio')) selectedThemeKey = 'emerald';
  else if (subLower.includes('eng') || titleLower.includes('eng')) selectedThemeKey = 'amber';
  else if (subLower.includes('oromo') || titleLower.includes('oromo') || subLower.includes('afan')) selectedThemeKey = 'orange';
  else if (subLower.includes('guide') || subLower.includes('curriculum')) selectedThemeKey = 'blue';
  else if (subLower.includes('geo') || subLower.includes('earth')) selectedThemeKey = 'teal';
  else if (subLower.includes('hist') || subLower.includes('civic')) selectedThemeKey = 'rose';

  const theme = colorThemes[selectedThemeKey];

  // Specific Subject Vector Graphic Art
  let artIllustration = '';
  if (selectedThemeKey === 'cyan') {
    // Mathematics: Cartesian grid, Geometry shapes, Sin waves, Formulas
    artIllustration = `
      <g stroke="${theme.accent}" stroke-width="1.5" fill="none" opacity="0.8">
        <circle cx="200" cy="280" r="75" stroke-dasharray="4,4" />
        <polygon points="200,210 265,320 135,320" stroke="${theme.accent}" stroke-width="2" />
        <circle cx="200" cy="280" r="3" fill="${theme.accent}" />
        <path d="M110 370 Q155 330 200 370 T290 370" stroke="${theme.accent}" stroke-width="2.5" />
        <path d="M120 400 L280 400 M200 340 L200 460" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
      </g>
      <text x="200" y="275" fill="${theme.accent}" font-size="14" font-family="monospace" text-anchor="middle" font-weight="bold">f(x) = ax² + bx + c</text>
      <text x="200" y="445" fill="rgba(255,255,255,0.7)" font-size="11" font-family="sans-serif" text-anchor="middle">ΔABC ~ ΔDEF · π ≈ 3.14159</text>
    `;
  } else if (selectedThemeKey === 'purple') {
    // Physics: Orbital electron rings, Nucleus, Wave pulses, E=mc²
    artIllustration = `
      <g stroke="${theme.accent}" stroke-width="1.8" fill="none">
        <ellipse cx="200" cy="280" rx="85" ry="32" transform="rotate(-30 200 280)" opacity="0.85" />
        <ellipse cx="200" cy="280" rx="85" ry="32" transform="rotate(30 200 280)" opacity="0.85" />
        <ellipse cx="200" cy="280" rx="85" ry="32" transform="rotate(90 200 280)" opacity="0.85" />
        <circle cx="200" cy="280" r="14" fill="${theme.accent}" opacity="0.9" />
        <circle cx="260" cy="245" r="5" fill="#ffffff" />
        <circle cx="140" cy="315" r="5" fill="#ffffff" />
        <circle cx="200" cy="195" r="5" fill="#ffffff" />
      </g>
      <text x="200" y="380" fill="${theme.accent}" font-size="15" font-family="monospace" text-anchor="middle" font-weight="bold">F = m·a  ·  E = mc²</text>
      <text x="200" y="405" fill="rgba(255,255,255,0.7)" font-size="11" font-family="sans-serif" text-anchor="middle">v = u + at  ·  λ = h/p  ·  W = F·d</text>
    `;
  } else if (selectedThemeKey === 'teal') {
    // Chemistry: Benzene hexagonal ring, Flask, Bonds, Reaction
    artIllustration = `
      <g stroke="${theme.accent}" stroke-width="2" fill="none" opacity="0.9">
        <polygon points="200,225 245,250 245,300 200,325 155,300 155,250" />
        <circle cx="200" cy="275" r="24" stroke-dasharray="3,3" />
        <circle cx="200" cy="225" r="5" fill="${theme.accent}" />
        <circle cx="245" cy="250" r="5" fill="${theme.accent}" />
        <circle cx="245" cy="300" r="5" fill="${theme.accent}" />
        <circle cx="200" cy="325" r="5" fill="${theme.accent}" />
        <circle cx="155" cy="300" r="5" fill="${theme.accent}" />
        <circle cx="155" cy="250" r="5" fill="${theme.accent}" />
        <line x1="245" y1="250" x2="280" y2="230" stroke="${theme.accent}" />
        <line x1="155" y1="300" x2="120" y2="320" stroke="${theme.accent}" />
      </g>
      <text x="200" y="380" fill="${theme.accent}" font-size="14" font-family="monospace" text-anchor="middle" font-weight="bold">2H₂ + O₂ ➔ 2H₂O</text>
      <text x="200" y="405" fill="rgba(255,255,255,0.7)" font-size="11" font-family="sans-serif" text-anchor="middle">Avogadro: 6.022 × 10²³ mol⁻¹</text>
    `;
  } else if (selectedThemeKey === 'emerald') {
    // Biology: DNA Helix, Cell Organelles, Leaf Vein
    artIllustration = `
      <g stroke="${theme.accent}" stroke-width="2.2" fill="none" opacity="0.9">
        <path d="M150 220 C 180 250, 220 250, 250 220 C 220 280, 180 280, 150 340 C 180 370, 220 370, 250 340" />
        <path d="M250 220 C 220 250, 180 250, 150 220 C 180 280, 220 280, 250 340 C 220 370, 180 370, 150 340" stroke="#ffffff" stroke-width="1.8" />
        <line x1="170" y1="235" x2="230" y2="235" stroke="${theme.accent}" stroke-width="1.5" />
        <line x1="180" y1="280" x2="220" y2="280" stroke="${theme.accent}" stroke-width="1.5" />
        <line x1="170" y1="325" x2="230" y2="325" stroke="${theme.accent}" stroke-width="1.5" />
      </g>
      <text x="200" y="390" fill="${theme.accent}" font-size="14" font-family="monospace" text-anchor="middle" font-weight="bold">Adenine - Thymine  ·  Guanine - Cytosine</text>
      <text x="200" y="415" fill="rgba(255,255,255,0.7)" font-size="11" font-family="sans-serif" text-anchor="middle">Photosynthesis: 6CO₂ + 6H₂O ➔ C₆H₁₂O₆ + 6O₂</text>
    `;
  } else if (selectedThemeKey === 'amber') {
    // English: Open Book, Quill, Globe of Languages
    artIllustration = `
      <g stroke="${theme.accent}" stroke-width="2" fill="none" opacity="0.9">
        <path d="M140 310 C 170 290, 200 300, 200 300 C 200 300, 230 290, 260 310 L 260 240 C 230 220, 200 230, 200 230 C 200 230, 170 220, 140 240 Z" fill="rgba(251,191,36,0.15)" />
        <line x1="200" y1="230" x2="200" y2="300" stroke="${theme.accent}" stroke-width="2" />
        <path d="M220 220 Q 240 180 260 170 C 250 200 230 215 220 220 Z" fill="${theme.accent}" stroke="none" />
      </g>
      <text x="200" y="375" fill="${theme.accent}" font-size="14" font-family="serif" font-style="italic" text-anchor="middle" font-weight="bold">Grammar · Reading · Essays · Vocabulary</text>
      <text x="200" y="405" fill="rgba(255,255,255,0.7)" font-size="11" font-family="sans-serif" text-anchor="middle">Mastering Communication & Critical Thinking</text>
    `;
  } else if (selectedThemeKey === 'orange') {
    // Afan Oromo: Oda Tree Silhouette, Sun Rays & Cultural Heritage
    artIllustration = `
      <g stroke="${theme.accent}" stroke-width="2" fill="none" opacity="0.95">
        <circle cx="200" cy="270" r="60" stroke="${theme.accent}" stroke-width="1.5" stroke-dasharray="6,4" />
        <path d="M190 320 L195 270 Q170 250 150 240 Q180 235 195 250 Q200 220 200 215 Q205 235 220 245 Q235 240 250 245 Q230 255 205 270 L210 320 Z" fill="${theme.accent}" opacity="0.85" stroke="none" />
        <path d="M150 325 L250 325" stroke="${theme.accent}" stroke-width="3" />
      </g>
      <text x="200" y="375" fill="${theme.accent}" font-size="14" font-family="sans-serif" text-anchor="middle" font-weight="bold">Og-barruu · Caasluga · Dubbisuu</text>
      <text x="200" y="405" fill="rgba(255,255,255,0.8)" font-size="11" font-family="sans-serif" text-anchor="middle">Aadaa, Seenaa fi Beekumsa Oromoo</text>
    `;
  } else {
    // Curriculum Guide & Syllabus / Master
    artIllustration = `
      <g stroke="${theme.accent}" stroke-width="2" fill="none" opacity="0.9">
        <polygon points="200,195 235,220 220,260 180,260 165,220" stroke="${theme.accent}" stroke-width="2" fill="rgba(96,165,250,0.2)" />
        <circle cx="200" cy="235" r="18" fill="${theme.accent}" opacity="0.9" />
        <path d="M140 330 L260 330 M150 300 L250 300 M160 270 L240 270" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
      </g>
      <text x="200" y="375" fill="${theme.accent}" font-size="14" font-family="sans-serif" text-anchor="middle" font-weight="bold">FDRE Ministry of Education</text>
      <text x="200" y="405" fill="rgba(255,255,255,0.8)" font-size="11" font-family="sans-serif" text-anchor="middle">National Competency & Assessment Framework</text>
    `;
  }

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 580" width="100%" height="100%">
      <defs>
        <linearGradient id="bgGrad_${selectedThemeKey}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${theme.gradStart}" />
          <stop offset="60%" stop-color="${theme.gradMid}" />
          <stop offset="100%" stop-color="${theme.gradEnd}" />
        </linearGradient>
        <linearGradient id="overlayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.12)" />
          <stop offset="50%" stop-color="transparent" />
          <stop offset="100%" stop-color="rgba(0,0,0,0.65)" />
        </linearGradient>
        <filter id="glow_${selectedThemeKey}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Background with Radial Accents -->
      <rect width="400" height="580" rx="16" fill="url(#bgGrad_${selectedThemeKey})" />
      <rect width="400" height="580" rx="16" fill="url(#overlayGrad)" />

      <!-- Subtle Geometric Tech Grid Lines -->
      <g opacity="0.08" stroke="#ffffff" stroke-width="1">
        <line x1="0" y1="58" x2="400" y2="58" />
        <line x1="0" y1="116" x2="400" y2="116" />
        <line x1="0" y1="174" x2="400" y2="174" />
        <line x1="0" y1="232" x2="400" y2="232" />
        <line x1="0" y1="290" x2="400" y2="290" />
        <line x1="0" y1="348" x2="400" y2="348" />
        <line x1="0" y1="406" x2="400" y2="406" />
        <line x1="0" y1="464" x2="400" y2="464" />
        <line x1="0" y1="522" x2="400" y2="522" />
        <line x1="50" y1="0" x2="50" y2="580" />
        <line x1="100" y1="0" x2="100" y2="580" />
        <line x1="150" y1="0" x2="150" y2="580" />
        <line x1="200" y1="0" x2="200" y2="580" />
        <line x1="250" y1="0" x2="250" y2="580" />
        <line x1="300" y1="0" x2="300" y2="580" />
        <line x1="350" y1="0" x2="350" y2="580" />
      </g>

      <!-- Spine Accent Line -->
      <rect x="0" y="0" width="14" height="580" rx="4" fill="rgba(0,0,0,0.35)" />
      <line x1="14" y1="0" x2="14" y2="580" stroke="${theme.accent}" stroke-width="2" opacity="0.6" />

      <!-- Top Header Header Badge -->
      <rect x="34" y="24" width="332" height="42" rx="10" fill="rgba(0,0,0,0.4)" stroke="${theme.accent}" stroke-width="1" stroke-opacity="0.5" />
      <text x="50" y="44" fill="${theme.accent}" font-family="'Orbitron', sans-serif" font-size="11" font-weight="bold" letter-spacing="1">ETHIOPIAN CURRICULUM</text>
      <text x="50" y="58" fill="#ffffff" font-family="'Poppins', sans-serif" font-size="9" opacity="0.8">FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA · MOE</text>

      <!-- Grade Circle Badge -->
      <g transform="translate(325, 45)">
        <circle cx="0" cy="0" r="18" fill="${theme.accent}" filter="url(#glow_${selectedThemeKey})" />
        <circle cx="0" cy="0" r="16" fill="#0f172a" />
        <text x="0" y="4" fill="${theme.accent}" font-family="'Orbitron', sans-serif" font-size="11" font-weight="bold" text-anchor="middle">G-${grade}</text>
      </g>

      <!-- Main Subject Title Box -->
      <text x="200" y="112" fill="#ffffff" font-family="'Orbitron', 'Inter', sans-serif" font-size="22" font-weight="800" text-anchor="middle" letter-spacing="1.5">
        ${subject.toUpperCase()}
      </text>
      <text x="200" y="132" fill="${theme.accent}" font-family="'Poppins', sans-serif" font-size="12" font-weight="600" text-anchor="middle" letter-spacing="2">
        STUDENT TEXTBOOK · GRADE ${grade}
      </text>
      <line x1="100" y1="145" x2="300" y2="145" stroke="${theme.accent}" stroke-width="1.5" opacity="0.8" />

      <!-- Center Dynamic Illustration Art -->
      ${artIllustration}

      <!-- Bottom Card Metadata Container -->
      <rect x="30" y="475" width="340" height="75" rx="12" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
      
      <text x="46" y="500" fill="#ffffff" font-family="'Poppins', sans-serif" font-size="11" font-weight="bold">
        ${edition}
      </text>
      <text x="46" y="516" fill="rgba(255,255,255,0.65)" font-family="'Poppins', sans-serif" font-size="9.5">
        Interactive 3D Reader · AI Study Companion · PDF Download
      </text>
      <text x="46" y="534" fill="${theme.accent}" font-family="monospace" font-size="9">
        ✓ Official Competency Standards Aligned
      </text>

      <!-- Bottom Right Verified Pill -->
      <rect x="270" y="492" width="88" height="24" rx="12" fill="${theme.accent}" opacity="0.2" />
      <text x="314" y="508" fill="${theme.accent}" font-family="'Orbitron', sans-serif" font-size="9" font-weight="bold" text-anchor="middle">
        VERIFIED
      </text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

// Map of canonical book covers for all Ethiopian curriculum Grade 9 textbooks
export const ETHIOPIAN_GRADE_9_COVERS: Record<string, string> = {
  'ethiopia-g9-math-new-curriculum': generateBookCoverSvg({
    title: 'Ethiopian Grade 9 Mathematics',
    subject: 'Mathematics',
    grade: 9,
    theme: 'cyan',
    badge: 'MoE Official'
  }),
  'ethiopia-g9-physics-new-curriculum': generateBookCoverSvg({
    title: 'Ethiopian Grade 9 Physics',
    subject: 'Physics',
    grade: 9,
    theme: 'purple',
    badge: 'MoE Official'
  }),
  'ethiopia-g9-chemistry-new-curriculum': generateBookCoverSvg({
    title: 'Ethiopian Grade 9 Chemistry',
    subject: 'Chemistry',
    grade: 9,
    theme: 'teal',
    badge: 'MoE Official'
  }),
  'ethiopia-g9-biology-new-curriculum': generateBookCoverSvg({
    title: 'Ethiopian Grade 9 Biology',
    subject: 'Biology',
    grade: 9,
    theme: 'emerald',
    badge: 'MoE Official'
  }),
  'ethiopia-g9-english-new-curriculum': generateBookCoverSvg({
    title: 'Ethiopian Grade 9 English',
    subject: 'English',
    grade: 9,
    theme: 'amber',
    badge: 'MoE Official'
  }),
  'ethiopia-g9-afan-oromo-new-curriculum': generateBookCoverSvg({
    title: 'Ethiopian Grade 9 Afan Oromo',
    subject: 'Afan Oromo',
    grade: 9,
    theme: 'orange',
    badge: 'MoE Official'
  }),
  'ethiopia-g9-curriculum-guide-reference': generateBookCoverSvg({
    title: 'Ethiopian Grade 9 New Curriculum Official Guide',
    subject: 'Curriculum Guide',
    grade: 9,
    theme: 'blue',
    badge: 'MoE Official'
  })
};

// Safe getter function for any book cover
export function getBookCover(book: {
  id?: string;
  title?: string;
  subject?: string;
  grade?: number;
  cover_image_url?: string;
}): string {
  if (book.cover_image_url && book.cover_image_url.trim().length > 0 && !book.cover_image_url.includes('placeholder')) {
    return book.cover_image_url;
  }
  if (book.id && ETHIOPIAN_GRADE_9_COVERS[book.id]) {
    return ETHIOPIAN_GRADE_9_COVERS[book.id];
  }
  return generateBookCoverSvg({
    title: book.title || 'Textbook',
    subject: book.subject || 'General Study',
    grade: book.grade || 9,
  });
}
