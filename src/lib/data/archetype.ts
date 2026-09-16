import type { ArchetypeId, StudentProfile } from "@/lib/types";

export interface ArchetypeDefinition {
  id: ArchetypeId;
  title: string;
  badge: string;
  tagline: string;
  description: string;
  traits: string[];
  recommendedExtracurriculars: string[];
  complementaryExtracurriculars: string[];
  idealCampusVibe: string;
}

export const ARCHETYPES: Record<ArchetypeId, ArchetypeDefinition> = {
  innovator: {
    id: "innovator",
    title: "The Innovator",
    badge: "🚀 Product & Venture Specialist",
    tagline: "Driven by high-impact problem solving, venture creation, and tech-forward initiatives.",
    description: "You thrive on turning abstract ideas into scalable solutions. You learn best by building, testing, and leading fast-paced interdisciplinary projects.",
    traits: ["Entrepreneurship", "Rapid Prototyping", "Risk Taking", "System Architecture"],
    recommendedExtracurriculars: [
      "Launch a student startup or open-source developer project",
      "Lead a Hackathon organizing team or build hackathon prototypes",
      "Pitch in regional venture competitions and incubator demo days"
    ],
    complementaryExtracurriculars: [
      "Join a public speaking/Debate club to hone pitch storytelling",
      "Participate in team endurance sports to build resilience and group rapport"
    ],
    idealCampusVibe: "High-energy innovation hubs with incubator labs and venture funding opportunities."
  },
  researcher: {
    id: "researcher",
    title: "The Researcher",
    badge: "🔬 Deep Domain Scholar",
    tagline: "Fascinated by empirical truth, advanced methodologies, and published discoveries.",
    description: "You possess remarkable intellectual curiosity and patience for complex systems. You love dissecting primary literature and validating hypotheses.",
    traits: ["Empirical Rigor", "Data Analysis", "Academic Writing", "Methodical Focus"],
    recommendedExtracurriculars: [
      "Conduct independent research under university faculty mentorship",
      "Publish a paper in a peer-reviewed high school science journal",
      "Present findings at national STEM olympiads or symposiums"
    ],
    complementaryExtracurriculars: [
      "Lead a community tutoring outreach initiative for younger students",
      "Join a team sport or intramural league to balance intense solo study sessions"
    ],
    idealCampusVibe: "Tier-1 research institutions with world-class faculty laboratories and library archives."
  },
  community_builder: {
    id: "community_builder",
    title: "The Community Builder",
    badge: "🤝 Social Impact Catalyst",
    tagline: "Dedicated to advocacy, grassroots organization, and empowering marginalized voices.",
    description: "Your superpower is empathy and mobilization. You connect people, foster inclusivity, and build initiatives that leave a lasting social legacy.",
    traits: ["Empathetic Leadership", "Grassroots Mobilization", "Policy & Advocacy", "Cross-Cultural Communication"],
    recommendedExtracurriculars: [
      "Found an educational outreach NGO or local community service network",
      "Organize civic advocacy campaigns or climate policy summits",
      "Serve as Student Body President or Lead Regional Youth Delegate"
    ],
    complementaryExtracurriculars: [
      "Take an advanced coding or statistics course to quantitatively measure social impact",
      "Engage in individual mindfulness or competitive chess for tactical focus"
    ],
    idealCampusVibe: "Vibrant campuses with active student government, social justice centers, and civic engagement grants."
  },
  strategist: {
    id: "strategist",
    title: "The Strategist",
    badge: "📊 Tactical Systems Leader",
    tagline: "Master of optimization, competitive dynamics, and long-range execution.",
    description: "You look at challenges as strategic chess games. You excel at decision analysis, resource allocation, and leading teams to concrete victories.",
    traits: ["Strategic Planning", "Negotiation", "Financial Modeling", "Competitive Execution"],
    recommendedExtracurriculars: [
      "Lead Model United Nations (MUN) delegations or Debate societies",
      "Win international Economics or Business Case Competitions",
      "Manage student investment funds or micro-finance initiatives"
    ],
    complementaryExtracurriculars: [
      "Volunteer at creative arts workshops to cultivate intuitive empathy",
      "Engage in outdoor wilderness expeditions to practice adaptability under pressure"
    ],
    idealCampusVibe: "Global business hubs with strong alumni networks, case study traditions, and recruiting networks."
  },
  creative_visionary: {
    id: "creative_visionary",
    title: "The Creative Visionary",
    badge: "🎨 Interdisciplinary Artist & Designer",
    tagline: "Blending aesthetics, storytelling, and human-centered design to redefine culture.",
    description: "You see the world through a lens of possibilities, visual narrative, and human emotion. You bridge technology, philosophy, and creative arts.",
    traits: ["Design Thinking", "Narrative Storytelling", "Visual Aesthetics", "Unconventional Problem Solving"],
    recommendedExtracurriculars: [
      "Produce an original multimedia film, literary magazine, or design portfolio",
      "Direct interactive UI/UX experiences or game development initiatives",
      "Expose art installations highlighting contemporary societal questions"
    ],
    complementaryExtracurriculars: [
      "Study introductory accounting or project management to structure creative ventures",
      "Participate in group robotics competitions to merge design with functional mechanics"
    ],
    idealCampusVibe: "Interdisciplinary campuses offering studio access, media labs, and collaborative maker spaces."
  }
};

export interface QuizQuestion {
  id: number;
  question: string;
  subtitle: string;
  options: {
    label: string;
    detail: string;
    archetypeWeights: Record<ArchetypeId, number>;
  }[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "When faced with a complex real-world challenge, what is your immediate instinct?",
    subtitle: "Select the response that best reflects your natural problem-solving posture.",
    options: [
      {
        label: "Build a rapid working prototype or software solution",
        detail: "Test ideas in the wild and iterate based on real feedback.",
        archetypeWeights: { innovator: 3, strategist: 1, researcher: 0, community_builder: 0, creative_visionary: 1 }
      },
      {
        label: "Dive into literature and analyze foundational data",
        detail: "Understand underlying mechanics and search for empirical proof.",
        archetypeWeights: { researcher: 3, strategist: 1, innovator: 0, community_builder: 0, creative_visionary: 0 }
      },
      {
        label: "Rally people together to debate and organize collective action",
        detail: "Bring stakeholders to the table to build momentum and consensus.",
        archetypeWeights: { community_builder: 3, strategist: 1, innovator: 1, researcher: 0, creative_visionary: 0 }
      },
      {
        label: "Map out a multi-phase strategic execution roadmap",
        detail: "Identify leverage points, risk metrics, and long-term positioning.",
        archetypeWeights: { strategist: 3, innovator: 1, researcher: 1, community_builder: 0, creative_visionary: 0 }
      },
      {
        label: "Craft a compelling visual or narrative experience",
        detail: "Reframe the story to inspire emotional connection and fresh perspectives.",
        archetypeWeights: { creative_visionary: 3, innovator: 1, community_builder: 1, researcher: 0, strategist: 0 }
      }
    ]
  },
  {
    id: 2,
    question: "What environment fuels your highest productivity and creativity?",
    subtitle: "Think about where you feel most energized during major projects.",
    options: [
      {
        label: "A high-intensity incubator studio with whiteboards & demo days",
        detail: "Surrounded by builders moving fast and shipping prototypes.",
        archetypeWeights: { innovator: 3, creative_visionary: 1, strategist: 1, researcher: 0, community_builder: 0 }
      },
      {
        label: "A quiet, state-of-the-art laboratory or academic archive",
        detail: "Deep focus with precise tools, journals, and analytical equipment.",
        archetypeWeights: { researcher: 3, strategist: 1, innovator: 0, community_builder: 0, creative_visionary: 0 }
      },
      {
        label: "A bustling community hall or active town hall debate",
        detail: "Direct interaction with diverse community members and advocates.",
        archetypeWeights: { community_builder: 3, creative_visionary: 1, innovator: 0, researcher: 0, strategist: 1 }
      },
      {
        label: "A boardroom or strategic command center",
        detail: "Analyzing charts, competitive positions, and decision matrices.",
        archetypeWeights: { strategist: 3, innovator: 1, researcher: 1, community_builder: 0, creative_visionary: 0 }
      },
      {
        label: "A design studio or open maker-space with multi-media tools",
        detail: "Surrounded by color swatches, digital tablets, and creative freedom.",
        archetypeWeights: { creative_visionary: 3, innovator: 1, researcher: 0, community_builder: 1, strategist: 0 }
      }
    ]
  },
  {
    id: 3,
    question: "How do you define the success of an extracurricular project?",
    subtitle: "What outcome brings you the deepest sense of fulfillment?",
    options: [
      {
        label: "Launching a product used by real people or raising seed funds",
        detail: "Proof of market traction and practical real-world utility.",
        archetypeWeights: { innovator: 3, strategist: 2, researcher: 0, community_builder: 0, creative_visionary: 0 }
      },
      {
        label: "Uncovering a novel insight or publishing a verified discovery",
        detail: "Expanding the boundary of human knowledge in a domain.",
        archetypeWeights: { researcher: 3, creative_visionary: 1, innovator: 0, community_builder: 0, strategist: 1 }
      },
      {
        label: "Directly improving lives and establishing enduring community programs",
        detail: "Measurable positive social impact on human beings.",
        archetypeWeights: { community_builder: 3, innovator: 1, researcher: 0, strategist: 1, creative_visionary: 0 }
      },
      {
        label: "Winning a prestigious national competition or leading a top team",
        detail: "Achieving top-tier ranking through tactical discipline.",
        archetypeWeights: { strategist: 3, innovator: 1, researcher: 1, community_builder: 0, creative_visionary: 0 }
      },
      {
        label: "Evoking strong emotion and aesthetic recognition through original art",
        detail: "Creating work that inspires admiration and changes mindsets.",
        archetypeWeights: { creative_visionary: 3, community_builder: 1, innovator: 1, researcher: 0, strategist: 0 }
      }
    ]
  },
  {
    id: 4,
    question: "Which role do you naturally assume in group endeavors?",
    subtitle: "Consider how your peers typically look to you during team assignments.",
    options: [
      {
        label: "The CTO / Product Architect who builds the core mechanism",
        detail: "Focusing on execution speed, tech architecture, and functionality.",
        archetypeWeights: { innovator: 3, researcher: 1, strategist: 1, community_builder: 0, creative_visionary: 0 }
      },
      {
        label: "The Chief Analyst who verifies facts and checks methodologies",
        detail: "Ensuring accuracy, logic, and depth behind every assertion.",
        archetypeWeights: { researcher: 3, strategist: 2, innovator: 0, community_builder: 0, creative_visionary: 0 }
      },
      {
        label: "The Team Leader who motivates everyone and manages harmony",
        detail: "Keeping morale high and ensuring every voice is heard.",
        archetypeWeights: { community_builder: 3, strategist: 1, innovator: 0, researcher: 0, creative_visionary: 1 }
      },
      {
        label: "The Chief Strategist who assigns tasks and manages deadlines",
        detail: "Maintaining high-level vision, efficiency, and competitive edge.",
        archetypeWeights: { strategist: 3, innovator: 1, community_builder: 1, researcher: 0, creative_visionary: 0 }
      },
      {
        label: "The Creative Director who designs presentation & narrative aesthetic",
        detail: "Ensuring visual brilliance and captivating storytelling.",
        archetypeWeights: { creative_visionary: 3, innovator: 1, community_builder: 1, researcher: 0, strategist: 0 }
      }
    ]
  },
  {
    id: 5,
    question: "What type of university course excites you the most?",
    subtitle: "Imagine looking through a university syllabus catalog.",
    options: [
      {
        label: "Venture Creation & Tech Product Accelerator",
        detail: "Hands-on venture building with seed capital and industry mentors.",
        archetypeWeights: { innovator: 3, strategist: 1, creative_visionary: 1, researcher: 0, community_builder: 0 }
      },
      {
        label: "Advanced Computational Research Methods & Seminar",
        detail: "Rigorous empirical inquiry and graduate-level thesis preparation.",
        archetypeWeights: { researcher: 3, strategist: 1, innovator: 0, community_builder: 0, creative_visionary: 0 }
      },
      {
        label: "Global Social Policy, Ethics & Community Leadership",
        detail: "Studying systemic change, human rights, and advocacy frameworks.",
        archetypeWeights: { community_builder: 3, strategist: 1, creative_visionary: 1, researcher: 0, innovator: 0 }
      },
      {
        label: "Game Theory, Financial Engineering & Strategic Negotiation",
        detail: "Quantitative decision dynamics and organizational leadership.",
        archetypeWeights: { strategist: 3, innovator: 1, researcher: 1, community_builder: 0, creative_visionary: 0 }
      },
      {
        label: "Interdisciplinary Digital Media, UX & Cultural Studies",
        detail: "Exploring human-computer interaction, fine arts, and modern media.",
        archetypeWeights: { creative_visionary: 3, innovator: 1, community_builder: 1, researcher: 0, strategist: 0 }
      }
    ]
  }
];

export function calculateArchetype(answers: Record<number, number>): ArchetypeId {
  const scores: Record<ArchetypeId, number> = {
    innovator: 0,
    researcher: 0,
    community_builder: 0,
    strategist: 0,
    creative_visionary: 0
  };

  QUIZ_QUESTIONS.forEach((q) => {
    const selectedOptionIndex = answers[q.id];
    if (selectedOptionIndex !== undefined && q.options[selectedOptionIndex]) {
      const option = q.options[selectedOptionIndex];
      Object.entries(option.archetypeWeights).forEach(([key, weight]) => {
        scores[key as ArchetypeId] += weight;
      });
    }
  });

  let topArchetype: ArchetypeId = "innovator";
  let maxScore = -1;

  Object.entries(scores).forEach(([id, score]) => {
    if (score > maxScore) {
      maxScore = score;
      topArchetype = id as ArchetypeId;
    }
  });

  return topArchetype;
}

export function getArchetypeSuggestions(profile: StudentProfile): {
  archetype: ArchetypeDefinition | null;
  primaryActivities: string[];
  complementaryActivities: string[];
} {
  if (!profile.archetype || !ARCHETYPES[profile.archetype]) {
    return {
      archetype: null,
      primaryActivities: [],
      complementaryActivities: []
    };
  }

  const def = ARCHETYPES[profile.archetype];
  return {
    archetype: def,
    primaryActivities: def.recommendedExtracurriculars,
    complementaryActivities: def.complementaryExtracurriculars
  };
}
