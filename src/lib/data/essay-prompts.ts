export interface EssayStandardPrompt {
  id: string;
  category: "Common App" | "UC System PIQ" | "Supplemental Archetypes";
  title: string;
  prompt: string;
  wordLimit: number;
}

export const STANDARD_ESSAY_PROMPTS: EssayStandardPrompt[] = [
  {
    id: "common-app-1",
    category: "Common App",
    title: "Meaningful Background or Identity",
    prompt: "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.",
    wordLimit: 650,
  },
  {
    id: "common-app-2",
    category: "Common App",
    title: "Obstacles, Lessons & Resilience",
    prompt: "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?",
    wordLimit: 650,
  },
  {
    id: "common-app-3",
    category: "Common App",
    title: "Challenging a Belief or Idea",
    prompt: "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?",
    wordLimit: 650,
  },
  {
    id: "common-app-4",
    category: "Common App",
    title: "A Problem Solved or to Solve",
    prompt: "Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?",
    wordLimit: 650,
  },
  {
    id: "common-app-5",
    category: "Common App",
    title: "Accomplishment & Personal Growth",
    prompt: "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.",
    wordLimit: 650,
  },
  {
    id: "common-app-6",
    category: "Common App",
    title: "Captivating Topic or Concept",
    prompt: "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?",
    wordLimit: 650,
  },
  {
    id: "common-app-7",
    category: "Common App",
    title: "Topic of Your Choice",
    prompt: "Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design.",
    wordLimit: 650,
  },
  {
    id: "uc-piq-1",
    category: "UC System PIQ",
    title: "Leadership Experience",
    prompt: "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time.",
    wordLimit: 350,
  },
  {
    id: "uc-piq-2",
    category: "UC System PIQ",
    title: "Creative Side & Expression",
    prompt: "Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.",
    wordLimit: 350,
  },
  {
    id: "uc-piq-3",
    category: "UC System PIQ",
    title: "Greatest Talent or Skill",
    prompt: "What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?",
    wordLimit: 350,
  },
  {
    id: "uc-piq-4",
    category: "UC System PIQ",
    title: "Educational Barrier or Opportunity",
    prompt: "Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.",
    wordLimit: 350,
  },
  {
    id: "uc-piq-5",
    category: "UC System PIQ",
    title: "Significant Challenge",
    prompt: "Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?",
    wordLimit: 350,
  },
  {
    id: "uc-piq-6",
    category: "UC System PIQ",
    title: "Academic Subject Inspiration",
    prompt: "Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom.",
    wordLimit: 350,
  },
  {
    id: "uc-piq-7",
    category: "UC System PIQ",
    title: "Community Improvement",
    prompt: "What have you done to make your school or your community a better place?",
    wordLimit: 350,
  },
  {
    id: "uc-piq-8",
    category: "UC System PIQ",
    title: "What Sets You Apart",
    prompt: "Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admission to the University of California?",
    wordLimit: 350,
  },
  {
    id: "supp-why-us",
    category: "Supplemental Archetypes",
    title: "Why This University?",
    prompt: "What specific academic, research, or cultural opportunities at our institution align with your intellectual goals, and how will you contribute to our community?",
    wordLimit: 250,
  },
  {
    id: "supp-activity",
    category: "Supplemental Archetypes",
    title: "Extracurricular Deep-Dive",
    prompt: "Briefly elaborate on an extracurricular activity or work experience that has meaningfully shaped your character or intellectual pursuits.",
    wordLimit: 150,
  },
  {
    id: "supp-community",
    category: "Supplemental Archetypes",
    title: "Community & Diversity Contribution",
    prompt: "Everyone belongs to many different communities and/or groups defined by geography, religion, ethnicity, income, interest, or other common bonds. Describe one community to which you belong and how you have shaped each other.",
    wordLimit: 300,
  },
];
