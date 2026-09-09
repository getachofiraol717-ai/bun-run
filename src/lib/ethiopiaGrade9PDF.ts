import jsPDF from 'jspdf';

export interface Grade9Subject {
  title: string;
  code: string;
  description: string;
  themeColor: [number, number, number];
  accentColor: [number, number, number];
  chapters: Array<{
    number: number;
    title: string;
    topics: string[];
    summary?: string;
    sampleFormulasOrPoints?: string[];
    sampleQuestions?: string[];
  }>;
}

export const ETHIOPIA_GRADE_9_CURRICULUM_DATA: Grade9Subject[] = [
  {
    title: "Grade 9 Mathematics - New Curriculum",
    code: "MATH-G9-ETH",
    description: "Official Ministry of Education (MoE) Ethiopia Grade 9 Mathematics Textbook Curriculum.",
    themeColor: [8, 145, 178], // Cyan #0891b2
    accentColor: [6, 182, 212],
    chapters: [
      {
        number: 1,
        title: "Further on Sets and Real Numbers",
        topics: ["Properties of Real Numbers", "Subsets & Venn Diagrams", "Intervals and Number Line Representation", "Absolute Value and Inequalities"],
        summary: "Covers the axiomatic foundation of real numbers, bounded intervals, subset relations, and solving absolute value inequalities |x - a| < d.",
        sampleFormulasOrPoints: ["|x| < a <=> -a < x < a", "A ∪ B = {x : x ∈ A or x ∈ B}", "A ∩ B = {x : x ∈ A and x ∈ B}"],
        sampleQuestions: ["Prove that the square root of 2 is irrational.", "Find the solution set: |2x - 5| ≤ 7."]
      },
      {
        number: 2,
        title: "Linear Equations and Inequalities in Two Variables",
        topics: ["Cartesian Coordinate System", "Graphing Linear Equations", "System of Linear Equations", "Applications in Real-life Scenarios"],
        summary: "Study lines on the xy-plane, slopes m = (y2-y1)/(x2-x1), standard form Ax + By = C, elimination and substitution methods.",
        sampleFormulasOrPoints: ["Slope m = (y2 - y1) / (x2 - x1)", "Point-Slope Form: y - y1 = m(x - x1)", "Standard Form: Ax + By = C"],
        sampleQuestions: ["Solve the simultaneous equations: 2x + 3y = 12 and x - y = 1.", "Determine the slope of the line passing through (2, 4) and (6, 12)."]
      },
      {
        number: 3,
        title: "Quadratic Functions and Equations",
        topics: ["Definition of Quadratic Function", "Completing the Square & Quadratic Formula", "Parabola Graphs and Vertex Form", "Word Problems and Applications"],
        summary: "Analysis of second-degree polynomials y = ax^2 + bx + c. Discriminant D = b^2 - 4ac determines the number and nature of roots.",
        sampleFormulasOrPoints: ["Quadratic Formula: x = (-b ± √(b² - 4ac)) / (2a)", "Vertex coordinates: (-b/2a, f(-b/2a))", "Axis of symmetry: x = -b / (2a)"],
        sampleQuestions: ["Solve 3x² - 5x + 2 = 0 using the quadratic formula.", "Find the maximum height of a projectile given h(t) = -5t² + 20t + 2."]
      },
      {
        number: 4,
        title: "Similar Figures and Geometry",
        topics: ["Ratio and Proportion", "Similar Triangles and Theorems", "Perimeter and Area Ratios of Similar Figures", "Practical Measurement"],
        summary: "Fundamental geometric proportionality theorems (AA, SAS, SSS similarity). Area ratio is equal to the square of scale factor k^2.",
        sampleFormulasOrPoints: ["Scale Factor k = a1 / a2", "Area Ratio: A1 / A2 = k²", "Volume Ratio: V1 / V2 = k³"],
        sampleQuestions: ["Two similar triangles have sides in ratio 3:5. If the area of the smaller is 36 cm², find the area of the larger.", "Apply Thales theorem to find unknown length x in triangle ABC."]
      },
      {
        number: 5,
        title: "Introduction to Trigonometry",
        topics: ["Trigonometric Ratios (Sin, Cos, Tan)", "Values of Special Angles (30°, 45°, 60°)", "Right-Angled Triangle Applications", "Angles of Elevation and Depression"],
        summary: "Definitions of sin θ = opp/hyp, cos θ = adj/hyp, tan θ = opp/adj in right triangles. Pythagorean trigonometric identity sin²θ + cos²θ = 1.",
        sampleFormulasOrPoints: ["sin θ = Opposite / Hypotenuse", "cos θ = Adjacent / Hypotenuse", "tan θ = Opposite / Adjacent", "sin²θ + cos²θ = 1"],
        sampleQuestions: ["A ladder 10m long leans against a wall at an angle of 60° with the ground. How high up the wall does it reach?", "Evaluate sin(30°) · cos(60°) + cos(30°) · sin(60°)."]
      },
      {
        number: 6,
        title: "Statistics and Probability",
        topics: ["Data Collection & Frequency Distributions", "Mean, Median, and Mode for Grouped Data", "Probability Concepts & Sample Space", "Simple Events Analysis"],
        summary: "Measures of central tendency, histograms, cumulative frequency polygons (ogives), and classical definition of probability P(E) = n(E)/n(S).",
        sampleFormulasOrPoints: ["Mean x̄ = Σ(f·x) / Σf", "Probability P(E) = n(E) / n(S)", "Complement Rule: P(E') = 1 - P(E)"],
        sampleQuestions: ["Calculate the mean and median for the grouped examination score distribution.", "A bag has 4 red and 6 blue marbles. Find the probability of drawing 2 blue marbles with replacement."]
      }
    ]
  },
  {
    title: "Grade 9 Physics - New Curriculum",
    code: "PHYS-G9-ETH",
    description: "Ethiopian Ministry of Education Grade 9 Physics Syllabus and Fundamentals.",
    themeColor: [109, 40, 217], // Purple #6d28d9
    accentColor: [147, 51, 234],
    chapters: [
      {
        number: 1,
        title: "Physics and Human Society",
        topics: ["Branches of Physics", "Measurement & SI Units", "Precision, Accuracy and Significant Figures", "Scientific Methods"],
        summary: "The nature of scientific inquiry, base SI quantities (kg, m, s, A, K, mol, cd), derived units, and instrumental uncertainty.",
        sampleFormulasOrPoints: ["Density ρ = m / V", "Percent Error = (|Experimental - True| / True) × 100%"],
        sampleQuestions: ["Convert 72 km/h into SI base units (m/s).", "State the 7 fundamental SI physical quantities and their standard units."]
      },
      {
        number: 2,
        title: "Motion in One Dimension",
        topics: ["Distance and Displacement", "Speed and Velocity", "Acceleration and Motion Equations", "Graphical Analysis of Motion"],
        summary: "Kinematics equations for uniformly accelerated rectilinear motion, free fall under Earth's gravity g = 9.8 m/s².",
        sampleFormulasOrPoints: ["v = u + at", "s = ut + ½at²", "v² = u² + 2as", "Average speed = Total distance / Total time"],
        sampleQuestions: ["A vehicle accelerates from 10 m/s to 30 m/s in 5 seconds. Find acceleration and distance traveled.", "A ball is dropped from a cliff 45m high. How long does it take to hit the ground? (g = 10 m/s²)"]
      },
      {
        number: 3,
        title: "Force and Newton's Laws of Motion",
        topics: ["Concept of Force and Types of Forces", "Newton's First, Second, and Third Laws", "Frictional Force & Coefficient of Friction", "Momentum and Impulse"],
        summary: "Inertia, dynamic equilibrium, F_net = m·a, action-reaction pairs, static vs kinetic friction, and law of conservation of linear momentum.",
        sampleFormulasOrPoints: ["F_net = m · a", "Weight W = m · g", "Friction f = μ · N", "Momentum p = m · v", "Impulse J = F · Δt = Δp"],
        sampleQuestions: ["A 1200 kg car experiences a net braking force of 3600 N. Calculate its deceleration.", "State Newton's Third Law and give two practical applications in aviation and rocketry."]
      },
      {
        number: 4,
        title: "Work, Energy, and Power",
        topics: ["Mechanical Work Done by a Force", "Kinetic Energy and Potential Energy", "Law of Conservation of Energy", "Power and Efficiency"],
        summary: "Work W = F·d·cos(θ), kinetic energy Ek = 1/2 mv², gravitational potential energy Ep = mgh, power P = W/t in Watts.",
        sampleFormulasOrPoints: ["W = F · d · cos(θ)", "Ek = ½ m v²", "Ep = m g h", "Power P = W / t = F · v", "Efficiency η = (Useful Output / Total Input) × 100%"],
        sampleQuestions: ["Calculate the work done in lifting a 50 kg mass to a height of 8 meters.", "A motor consumes 2000W of electrical power and delivers 1600W of mechanical power. Find its efficiency."]
      },
      {
        number: 5,
        title: "Simple Machines",
        topics: ["Types of Simple Machines", "Mechanical Advantage (MA) and Velocity Ratio (VR)", "Efficiency of Machines", "Applications in Daily Life"],
        summary: "Levers, pulleys, inclined planes, wheel & axle, screw jacks, and gear systems in engineering and daily life.",
        sampleFormulasOrPoints: ["MA = Load / Effort = L / E", "VR = Distance moved by effort / Distance moved by load", "Efficiency η = MA / VR"],
        sampleQuestions: ["A pulley system has a VR of 4 and an efficiency of 75%. Calculate the MA and effort needed to lift 600N.", "Explain why the efficiency of a practical machine is always less than 100%."]
      },
      {
        number: 6,
        title: "Fluid Statics & Thermal Physics",
        topics: ["Density & Fluid Pressure", "Pascal's Principle & Archimedes' Principle", "Temperature & Heat Transfer", "Thermal Expansion"],
        summary: "Hydrostatic pressure P = ρgh, hydraulic lift mechanisms, buoyant force Fb = ρ_fluid·V_displaced·g, conduction, convection, and radiation.",
        sampleFormulasOrPoints: ["Pressure P = F / A", "Hydrostatic P = ρ · g · h", "Pascal's Law: F1/A1 = F2/A2", "Heat Q = m · c · ΔT"],
        sampleQuestions: ["Calculate the water pressure at a depth of 25m in Lake Tana (ρ = 1000 kg/m³, g = 9.8 m/s²).", "State Archimedes' Principle and explain how an iron ship floats in water."]
      }
    ]
  },
  {
    title: "Grade 9 Chemistry - New Curriculum",
    code: "CHEM-G9-ETH",
    description: "Fundamental Principles of Chemistry for Ethiopian Grade 9 High School Students.",
    themeColor: [13, 148, 136], // Teal #0d9488
    accentColor: [20, 184, 166],
    chapters: [
      {
        number: 1,
        title: "Structure of the Atom",
        topics: ["Subatomic Particles (Protons, Neutrons, Electrons)", "Atomic Number & Mass Number", "Isotopes & Atomic Mass", "Bohr's Atomic Model & Electron Configuration"],
        summary: "Rutherford nuclear model, quantum energy levels, orbital electron distributions (2, 8, 8, 18), and isotopic relative atomic mass calculations.",
        sampleFormulasOrPoints: ["Mass Number A = Z + N", "Relative Atomic Mass = Σ(Isotope Mass × % Abundance) / 100", "Electron Capacity: 2n² per shell"],
        sampleQuestions: ["Chlorine has isotopes Cl-35 (75%) and Cl-37 (25%). Calculate its relative atomic mass.", "Write the electron configuration of Calcium (Z = 20) and Sulfur (Z = 16)."]
      },
      {
        number: 2,
        title: "Periodic Classification of Elements",
        topics: ["Mendeleev & Modern Periodic Law", "Groups and Periods", "Periodic Trends: Atomic Radius, Electronegativity, Ionization Energy", "Metals, Non-metals, and Metalloids"],
        summary: "Arrangement by increasing atomic number Z. Group trends down columns vs period trends across rows.",
        sampleFormulasOrPoints: ["Ionization Energy increases across period, decreases down group", "Atomic radius decreases across period, increases down group", "Electronegativity peaks at Fluorine (3.98)"],
        sampleQuestions: ["Explain why noble gases are chemically unreactive.", "Compare the reactivity of Alkali Metals (Group 1) as you go down the group from Lithium to Francium."]
      },
      {
        number: 3,
        title: "Chemical Bonding",
        topics: ["Ionic Bonding & Lattice Structures", "Covalent Bonding & Molecular Geometry", "Metallic Bonding", "Intermolecular Forces"],
        summary: "Octet rule, electron transfer vs electron sharing, Lewis dot symbols, single/double/triple covalent bonds, hydrogen bonding.",
        sampleFormulasOrPoints: ["Ionic: ΔEN > 1.7", "Polar Covalent: 0.4 < ΔEN ≤ 1.7", "Nonpolar Covalent: ΔEN ≤ 0.4"],
        sampleQuestions: ["Draw Lewis electron dot structures for H2O, NH3, and CO2.", "Contrast the melting points and electrical conductivity of NaCl and C6H12O6."]
      },
      {
        number: 4,
        title: "Chemical Reactions and Stoichiometry",
        topics: ["Types of Chemical Reactions", "Balancing Chemical Equations", "The Mole Concept and Avogadro's Number", "Limiting Reactants and Percent Yield"],
        summary: "Synthesis, decomposition, single & double displacement, combustion. Stoichiometric mole-to-mole and mass-to-mass conversions.",
        sampleFormulasOrPoints: ["1 Mole = 6.022 × 10²³ particles", "Moles n = Mass (g) / Molar Mass (g/mol)", "Percent Yield = (Actual Yield / Theoretical Yield) × 100%"],
        sampleQuestions: ["Balance the equation: C3H8 + O2 -> CO2 + H2O.", "Calculate the mass of CO2 produced when 44g of propane is completely burned."]
      }
    ]
  },
  {
    title: "Grade 9 Biology - New Curriculum",
    code: "BIO-G9-ETH",
    description: "Ethiopian Ministry of Education Grade 9 Biology Textbook Curriculum.",
    themeColor: [5, 150, 105], // Emerald #059669
    accentColor: [16, 185, 129],
    chapters: [
      {
        number: 1,
        title: "Introduction to Biology and Cell Biology",
        topics: ["Biological Methods & Microscopy", "Cell Theory & Structure", "Prokaryotic vs Eukaryotic Cells", "Plant vs Animal Cells"],
        summary: "Cell organelles: Nucleus, Mitochondria (ATP cellular respiration), Chloroplasts (photosynthesis), Ribosomes (protein synthesis), and cell membrane fluid mosaic model.",
        sampleFormulasOrPoints: ["Cell Theory: Schleiden, Schwann & Virchow", "Total Magnification = Eyepiece × Objective", "Surface Area to Volume Ratio limit on cell size"],
        sampleQuestions: ["List 4 structural differences between plant and animal cells.", "Describe the function of the Golgi apparatus and Endoplasmic Reticulum."]
      },
      {
        number: 2,
        title: "Human Biology and Organ Systems",
        topics: ["Digestive System & Nutrition", "Circulatory & Respiratory Systems", "Excretory & Nervous Systems", "Health and Common Diseases"],
        summary: "Human anatomy, enzyme action (amylase, pepsin), pulmonary vs systemic blood circulation, nephron kidney filtration, and homeostasis.",
        sampleFormulasOrPoints: ["Enzymatic Digestion: Starch + Amylase -> Maltose", "Circulation: Heart (4 chambers) -> Aorta -> Body -> Vena Cava"],
        sampleQuestions: ["Trace the path of blood through the human heart starting from the right atrium.", "Explain the digestion and absorption of proteins in the human stomach and small intestine."]
      },
      {
        number: 3,
        title: "Plant Anatomy and Photosynthesis",
        topics: ["Plant Tissues: Xylem and Phloem", "Mechanism of Photosynthesis (Light & Dark Reactions)", "Transpiration and Water Transport", "Plant Hormones"],
        summary: "Light-dependent ATP/NADPH synthesis in thylakoids, Calvin cycle in stroma, stomata transpiration pull, auxins and gibberellins.",
        sampleFormulasOrPoints: ["Photosynthesis: 6CO2 + 6H2O + Light -> C6H12O6 + 6O2", "Transpiration Pull driven by cohesive-adhesive forces in xylem"],
        sampleQuestions: ["Describe how stomata open and close in response to guard cell turgor pressure.", "Explain the difference between xylem (water transport) and phloem (translocation of sugars)."]
      },
      {
        number: 4,
        title: "Ecology, Ethiopian Biodiversity & Conservation",
        topics: ["Ecosystems & Energy Flow (Trophic Levels)", "Biogeochemical Cycles (Carbon & Nitrogen)", "Endemic Wildlife of Ethiopia", "Conservation and Environmental Protection"],
        summary: "Food webs, 10% energy transfer rule, conservation of endemic species (Walia Ibex, Gelada Baboon, Ethiopian Wolf, Mountain Nyala) in national parks.",
        sampleFormulasOrPoints: ["Trophic 10% Energy Rule: E_next = 0.10 × E_current", "Protected Areas: Simien Mountains, Bale Mountains, Nechisar National Parks"],
        sampleQuestions: ["Name 4 endemic wildlife species of Ethiopia and their primary habitats.", "Construct a food web for the Ethiopian Afroalpine ecosystem and identify primary producers, consumers, and decomposers."]
      }
    ]
  },
  {
    title: "Grade 9 English - New Curriculum",
    code: "ENG-G9-ETH",
    description: "Ethiopian Ministry of Education Grade 9 English Student Textbook.",
    themeColor: [217, 119, 6], // Amber #d97706
    accentColor: [245, 158, 11],
    chapters: [
      {
        number: 1,
        title: "Living in a Community",
        topics: ["Descriptive Writing", "Present and Past Simple in Context", "Vocabulary of Cultural Heritage & Hospitality", "Listening for Specific Information"],
        summary: "Developing oral communication, reading comprehension of local cultural narratives, and structuring topic sentences with supporting details.",
        sampleFormulasOrPoints: ["Paragraph Structure: Topic Sentence + Supporting Details + Concluding Sentence", "Subject-Verb Agreement Rules"],
        sampleQuestions: ["Write a 150-word descriptive paragraph about traditional Ethiopian community gatherings (Iddir / Equb).", "Correct the tense errors in the provided historical narrative."]
      },
      {
        number: 2,
        title: "Science, Technology and Modern Inventions",
        topics: ["Expository & Cause-and-Effect Essays", "Passive Voice in Scientific Reporting", "Technical Vocabulary", "Summarizing and Paraphrasing"],
        summary: "Formal register, passive transformations (Object + be + V3), transition words (Furthermore, Consequently, In contrast).",
        sampleFormulasOrPoints: ["Active: Scientists discover new vaccine -> Passive: A new vaccine is discovered by scientists", "Cause/Effect Signal Words: As a result, Due to, Therefore"],
        sampleQuestions: ["Convert the laboratory experiment notes into formal passive voice.", "Write a 5-sentence summary of the renewable energy reading passage."]
      },
      {
        number: 3,
        title: "Environmental Protection & Climate Action",
        topics: ["Persuasive Writing & Debates", "Modal Verbs (Must, Should, Ought to)", "Conditionals (Zero, First, Second)", "Public Speaking Skills"],
        summary: "Rhetorical strategies (Ethos, Pathos, Logos), real and hypothetical conditions: If + present, will + verb; If + past, would + verb.",
        sampleFormulasOrPoints: ["First Conditional: If it rains, the crops will grow.", "Second Conditional: If we planted more trees, we would reduce soil erosion."],
        sampleQuestions: ["Write an open letter to school students advocating for the Green Legacy tree planting initiative.", "Complete the conditional sentences with correct verb forms."]
      }
    ]
  },
  {
    title: "Grade 9 Afan Oromo - New Curriculum",
    code: "AFAN-G9-ETH",
    description: "Kitaaba Barataa Afaan Oromoo Kutaa 9ffaa - Caaslugaa fi Og-barruu.",
    themeColor: [194, 65, 12], // Orange #c2410c
    accentColor: [234, 88, 12],
    chapters: [
      {
        number: 1,
        title: "Aadaa fi Seenaa Oromoo (Culture and Heritage)",
        topics: ["Sirna Gadaa fi Caasaa Isaa", "Jecha fi Hima Qajeelaa", "Og-afaan: Mammaaksa, Hiibboo fi Weedduu", "Dubbisuu fi Hubannoo"],
        summary: "Qo'annoo Sirna Gadaa, sadarkaa gadootaa, faayidaa aadaa fi seenaa dhaloota haaraaf dabarsuu.",
        sampleFormulasOrPoints: ["Caasaa Sirna Gadaa: Dabballee, Gaammee, Kuusaa, Raaba Doorii, Gadaa", "Mammaaksa fi Hiika Isaanii"],
        sampleQuestions: ["Sadarkaalee Sirna Gadaa shananiifi hojii isaanii ibsaa.", "Mammaaksota Afaan Oromoo sadii hiika isaanii wajjin barreessaa."]
      },
      {
        number: 2,
        title: "Caasluga fi Qubeeffama Qajeelaa (Grammar and Orthography)",
        topics: ["Gosoota Sagalee: Dubbifamootaa fi Dubbachiiftota", "Dhedheerinna fi Jabbina Sagalee", "Qubeeffama fi Mallattoolee Qubee", "Hima Salphaa fi Hima Xaxamaa"],
        summary: "Seera qubeefaama Qubee Afaan Oromoo, dubbachiiftuu gabaabduu fi dheertuu, jabeessituu fi laafistuu.",
        sampleFormulasOrPoints: ["Dubbachiiftuu: a, e, i, o, u (Gabaabaa) | aa, ee, ii, oo, uu (Dheeraa)", "Qubee Dachaa: ch, dh, ny, ph, sh, ts"],
        sampleQuestions: ["Jijjiirama hiikaa jechoota dheerinnaa fi jabina qaban fakkeenyaan mul'isaa (fk. mana vs maana, lafa vs laffa).", "Hima salphaa fi hima xaxamaa adda baasaa."]
      }
    ]
  }
];

// Generate High-Resolution Master Curriculum Guide PDF
export function generateEthiopiaGrade9PDF(): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Page 1: COVER PAGE
  // Deep Gradient Header Box
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative Accent Waves / Tech Lines
  doc.setDrawColor(6, 182, 212); // Neon Cyan
  doc.setLineWidth(1.5);
  doc.line(20, 20, pageWidth - 20, 20);
  doc.line(20, 24, pageWidth - 20, 24);

  // Top Badge Box
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth / 2 - 60, 32, 120, 12, 3, 3, 'F');
  doc.setTextColor(34, 211, 238);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA", pageWidth / 2, 40, { align: 'center' });

  // Ministry of Education Banner
  doc.setTextColor(248, 250, 252);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("MINISTRY OF EDUCATION (MoE)", pageWidth / 2, 54, { align: 'center' });

  // Seal / Emblem Art Circle
  doc.setFillColor(30, 58, 138);
  doc.circle(pageWidth / 2, 85, 24, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(2);
  doc.circle(pageWidth / 2, 85, 24, 'D');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(18);
  doc.text("★ MoE ★", pageWidth / 2, 88, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("COMPETENCY FRAMEWORK", pageWidth / 2, 96, { align: 'center' });

  // Title Box
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("GRADE 9 NEW CURRICULUM", pageWidth / 2, 125, { align: 'center' });

  doc.setTextColor(34, 211, 238);
  doc.setFontSize(16);
  doc.text("OFFICIAL TEXTBOOK & SYLLABUS GUIDE", pageWidth / 2, 135, { align: 'center' });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("Comprehensive Syllabus Breakdowns, Core Equations & National Standards", pageWidth / 2, 144, { align: 'center' });

  // Subject Badge Grid on Cover
  let coverGridY = 160;
  const subjectsShort = [
    { name: "Mathematics", col: [8, 145, 178] },
    { name: "Physics", col: [109, 40, 217] },
    { name: "Chemistry", col: [13, 148, 136] },
    { name: "Biology", col: [5, 150, 105] },
    { name: "English", col: [217, 119, 6] },
    { name: "Afan Oromo", col: [194, 65, 12] },
  ];

  subjectsShort.forEach((sub, i) => {
    const colIdx = i % 2;
    const rowIdx = Math.floor(i / 2);
    const boxX = colIdx === 0 ? 25 : pageWidth / 2 + 5;
    const boxY = coverGridY + rowIdx * 20;

    doc.setFillColor(30, 41, 59);
    doc.roundedRect(boxX, boxY, (pageWidth - 60) / 2, 14, 2, 2, 'F');
    doc.setDrawColor(sub.col[0], sub.col[1], sub.col[2]);
    doc.setLineWidth(1);
    doc.roundedRect(boxX, boxY, (pageWidth - 60) / 2, 14, 2, 2, 'D');

    doc.setFillColor(sub.col[0], sub.col[1], sub.col[2]);
    doc.circle(boxX + 8, boxY + 7, 3, 'F');

    doc.setTextColor(248, 250, 252);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grade 9 ${sub.name}`, boxX + 16, boxY + 9);
  });

  // Footer Metadata Box
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(20, pageHeight - 38, pageWidth - 40, 22, 3, 3, 'F');
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.8);
  doc.roundedRect(20, pageHeight - 38, pageWidth - 40, 22, 3, 3, 'D');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("KNOWLEDGE UNIVERSE DIGITAL ACADEMY", 26, pageHeight - 28);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text("Interactive 3D Reader · AI Study Companion · National Exam Questions", 26, pageHeight - 21);

  doc.setTextColor(34, 211, 238);
  doc.text("Academic Year 2025/2026", pageWidth - 26, pageHeight - 25, { align: 'right' });

  // PAGE 2 onwards: Content Pages
  doc.addPage();
  let y = 20;

  // Header Banner on Inner Pages
  const drawPageHeader = (title: string) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(0, 16, pageWidth, 16);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text("ETHIOPIAN GRADE 9 CURRICULUM · OFFICIAL STUDENT GUIDE", 14, 10);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(title, pageWidth - 14, 10, { align: 'right' });
  };

  drawPageHeader("Comprehensive Breakdown");

  y = 26;

  // Executive Overview
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text("1. Executive Overview & Curriculum Architecture", 14, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const introText = "This master guide outlines the national competency-based curriculum framework for Ethiopian Grade 9 high school students. It covers mathematics, physics, chemistry, biology, English, and regional languages in accordance with the Ministry of Education standards.";
  const splitIntro = doc.splitTextToSize(introText, pageWidth - 28);
  doc.text(splitIntro, 14, y);
  y += splitIntro.length * 5 + 8;

  // Render All Subjects
  ETHIOPIA_GRADE_9_CURRICULUM_DATA.forEach((subject) => {
    if (y > 230) {
      doc.addPage();
      drawPageHeader(subject.title);
      y = 24;
    }

    // Subject Header Ribbon
    doc.setFillColor(subject.themeColor[0], subject.themeColor[1], subject.themeColor[2]);
    doc.roundedRect(14, y, pageWidth - 28, 12, 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${subject.title} [${subject.code}]`, 18, y + 8);
    y += 16;

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(subject.description, 18, y);
    y += 6;

    // Chapters
    subject.chapters.forEach((ch) => {
      if (y > 245) {
        doc.addPage();
        drawPageHeader(subject.title);
        y = 24;
      }

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9.5);
      doc.text(`• Chapter ${ch.number}: ${ch.title}`, 18, y);
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const topicsStr = `Key Topics: ${ch.topics.join(' · ')}`;
      const splitTopics = doc.splitTextToSize(topicsStr, pageWidth - 40);
      doc.text(splitTopics, 22, y);
      y += splitTopics.length * 4 + 1.5;

      if (ch.sampleFormulasOrPoints && ch.sampleFormulasOrPoints.length > 0) {
        doc.setTextColor(subject.themeColor[0], subject.themeColor[1], subject.themeColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(`Formulas / Key Rules: ${ch.sampleFormulasOrPoints.join('  |  ')}`, 22, y);
        y += 4.5;
      }

      y += 2;
    });

    y += 4;
  });

  return doc.output('blob');
}

// Generate Dedicated Subject Textbook PDF with cover, chapters, and practice questions
export function generateSubjectBookPDF(subjectTitle: string, grade = 9): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Find matching subject data or use generic
  const foundSubject = ETHIOPIA_GRADE_9_CURRICULUM_DATA.find(s =>
    s.title.toLowerCase().includes(subjectTitle.toLowerCase()) ||
    subjectTitle.toLowerCase().includes(s.title.split(' ')[2]?.toLowerCase() || '')
  ) || ETHIOPIA_GRADE_9_CURRICULUM_DATA[0];

  const themeCol = foundSubject.themeColor;
  const accentCol = foundSubject.accentColor;

  // PAGE 1: DEDICATED SUBJECT COVER
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top header banner
  doc.setFillColor(themeCol[0], themeCol[1], themeCol[2]);
  doc.rect(0, 0, pageWidth, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text("FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA · MINISTRY OF EDUCATION", pageWidth / 2, 11, { align: 'center' });

  // Large Grade Badge
  doc.setFillColor(themeCol[0], themeCol[1], themeCol[2]);
  doc.circle(pageWidth / 2, 60, 26, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2);
  doc.circle(pageWidth / 2, 60, 26, 'D');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(`GRADE ${grade}`, pageWidth / 2, 59, { align: 'center' });
  doc.setFontSize(9);
  doc.text("NEW CURRICULUM", pageWidth / 2, 68, { align: 'center' });

  // Main Subject Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text(foundSubject.title.replace(' - New Curriculum', '').toUpperCase(), pageWidth / 2, 105, { align: 'center' });

  doc.setTextColor(accentCol[0], accentCol[1], accentCol[2]);
  doc.setFontSize(14);
  doc.text("STUDENT TEXTBOOK & PRACTICE COMPANION", pageWidth / 2, 117, { align: 'center' });

  // Vector Box Decoration
  doc.setDrawColor(themeCol[0], themeCol[1], themeCol[2]);
  doc.setLineWidth(1);
  doc.line(30, 126, pageWidth - 30, 126);

  // Table of Contents Preview Box
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(25, 136, pageWidth - 50, 95, 4, 4, 'F');
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(25, 136, pageWidth - 50, 95, 4, 4, 'D');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text("CHAPTERS INCLUDED IN THIS TEXTBOOK:", 32, 148);

  let tocY = 158;
  foundSubject.chapters.forEach((ch) => {
    doc.setTextColor(248, 250, 252);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Chapter ${ch.number}: ${ch.title}`, 32, tocY);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`[${ch.topics.slice(0, 2).join(', ')}...]`, pageWidth - 32, tocY, { align: 'right' });
    tocY += 11;
  });

  // Cover Footer
  doc.setFillColor(20, 30, 48);
  doc.rect(0, pageHeight - 30, pageWidth, 30, 'F');
  doc.setDrawColor(themeCol[0], themeCol[1], themeCol[2]);
  doc.setLineWidth(1.5);
  doc.line(0, pageHeight - 30, pageWidth, pageHeight - 30);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("Knowledge Universe Digital Library Edition", 20, pageHeight - 17);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text("Includes National Curriculum Standards, Worked Examples & Practice Quizzes", 20, pageHeight - 10);

  doc.setTextColor(accentCol[0], accentCol[1], accentCol[2]);
  doc.text("Official MoE Syllabus Aligned", pageWidth - 20, pageHeight - 14, { align: 'right' });

  // PAGE 2+: CHAPTER DEEP-DIVES
  foundSubject.chapters.forEach((ch) => {
    doc.addPage();
    let cy = 22;

    // Running Header
    doc.setFillColor(241, 245, 249);
    doc.rect(0, 0, pageWidth, 14, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(0, 14, pageWidth, 14);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`ETHIOPIAN GRADE ${grade} ${foundSubject.title.replace(' - New Curriculum', '').toUpperCase()}`, 14, 9);
    doc.text(`CHAPTER ${ch.number}`, pageWidth - 14, 9, { align: 'right' });

    // Chapter Header Banner
    doc.setFillColor(themeCol[0], themeCol[1], themeCol[2]);
    doc.roundedRect(14, cy, pageWidth - 28, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Chapter ${ch.number}: ${ch.title}`, 20, cy + 11);
    cy += 24;

    // Section 1: Overview & Core Concept
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("1. Fundamental Principles & Concepts", 14, cy);
    cy += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const sumText = ch.summary || `This chapter provides in-depth exploration of ${ch.title} aligned with national curriculum outcomes.`;
    const splitSum = doc.splitTextToSize(sumText, pageWidth - 28);
    doc.text(splitSum, 14, cy);
    cy += splitSum.length * 5 + 6;

    // Section 2: Syllabus Topics
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("2. Key Curriculum Topics", 14, cy);
    cy += 6;

    ch.topics.forEach((topic) => {
      doc.setFillColor(themeCol[0], themeCol[1], themeCol[2]);
      doc.circle(18, cy - 1.5, 1.5, 'F');
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(topic, 24, cy);
      cy += 5.5;
    });
    cy += 4;

    // Section 3: Formulas / Core Points
    if (ch.sampleFormulasOrPoints && ch.sampleFormulasOrPoints.length > 0) {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, cy, pageWidth - 28, 22 + ch.sampleFormulasOrPoints.length * 6, 2, 2, 'F');
      doc.setDrawColor(themeCol[0], themeCol[1], themeCol[2]);
      doc.roundedRect(14, cy, pageWidth - 28, 22 + ch.sampleFormulasOrPoints.length * 6, 2, 2, 'D');

      doc.setTextColor(themeCol[0], themeCol[1], themeCol[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("Key Equations & Theoretical Laws:", 20, cy + 7);

      let fy = cy + 14;
      ch.sampleFormulasOrPoints.forEach((f) => {
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`▸  ${f}`, 22, fy);
        fy += 6;
      });

      cy += 26 + ch.sampleFormulasOrPoints.length * 6;
    }

    // Section 4: Practice Problems
    if (ch.sampleQuestions && ch.sampleQuestions.length > 0) {
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("3. Practice & National Exam Questions", 14, cy);
      cy += 6;

      ch.sampleQuestions.forEach((q, qIdx) => {
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`Q${qIdx + 1}:`, 16, cy);

        doc.setFont('helvetica', 'normal');
        const splitQ = doc.splitTextToSize(q, pageWidth - 42);
        doc.text(splitQ, 26, cy);
        cy += splitQ.length * 5 + 3;
      });
    }
  });

  return doc.output('blob');
}

// Download Master Guide
export function downloadEthiopiaGrade9PDF() {
  const blob = generateEthiopiaGrade9PDF();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Ethiopian_Grade_9_New_Curriculum_Books_Guide.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download Specific Book Subject
export function downloadSubjectBook(subjectTitle: string, grade = 9) {
  const blob = generateSubjectBookPDF(subjectTitle, grade);
  const safeName = subjectTitle.replace(/[^a-zA-Z0-9]/g, '_');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Ethiopian_Grade_${grade}_${safeName}_Textbook.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
