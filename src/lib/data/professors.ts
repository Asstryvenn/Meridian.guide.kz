import type { Professor } from "@/lib/types";
import { source } from "./sourcing";

function professor(
  id: string,
  name: string,
  email: string,
  universitySlug: string,
  department: string,
  areas: string[],
  directoryName: string,
  directoryUrl: string,
): Professor {
  return {
    id,
    name,
    email,
    universitySlug,
    department,
    areas,
    profile: source(directoryName, directoryUrl, "medium"),
    publicationsNote: `https://dblp.org/search?q=${encodeURIComponent(name)}`,
  };
}

export const professors: Professor[] = [
  professor("rus", "Daniela Rus", "rus@csail.mit.edu", "mit", "EECS · CSAIL", ["robotics", "autonomous systems", "machine learning"], "MIT CSAIL people", "https://www.csail.mit.edu/people"),
  professor("barzilay", "Regina Barzilay", "regina@csail.mit.edu", "mit", "EECS · CSAIL", ["machine learning", "natural language processing", "ai for medicine", "drug discovery"], "MIT CSAIL people", "https://www.csail.mit.edu/people"),
  professor("feifei", "Fei-Fei Li", "feifeili@cs.stanford.edu", "stanford", "Computer Science · HAI", ["computer vision", "human-centered ai", "cognitive neuroscience"], "Stanford CS faculty directory", "https://www.cs.stanford.edu/people/faculty"),
  professor("manning", "Christopher Manning", "manning@cs.stanford.edu", "stanford", "Computer Science · Linguistics", ["natural language processing", "deep learning", "linguistics"], "Stanford CS faculty directory", "https://www.cs.stanford.edu/people/faculty"),
  professor("hebert", "Martial Hebert", "hebert@ri.cmu.edu", "cmu", "Robotics Institute", ["computer vision", "robotics", "perception"], "CMU School of Computer Science directory", "https://www.cs.cmu.edu/directory"),
  professor("mitchell", "Tom Mitchell", "tom.mitchell@cs.cmu.edu", "cmu", "Machine Learning Department", ["machine learning", "cognitive neuroscience", "ai education"], "CMU School of Computer Science directory", "https://www.cs.cmu.edu/directory"),
  professor("forsyth", "David Forsyth", "daf@illinois.edu", "uiuc", "Siebel School of Computing and Data Science", ["computer vision", "graphics", "machine learning"], "Illinois CS faculty directory", "https://siebelschool.illinois.edu/about/people/all-faculty"),
  professor("hays", "James Hays", "hays@gatech.edu", "gatech", "School of Interactive Computing", ["computer vision", "robotics", "machine learning"], "Georgia Tech Interactive Computing people", "https://ic.gatech.edu/people/faculty"),
  professor("fidler", "Sanja Fidler", "fidler@cs.toronto.edu", "toronto", "Computer Science", ["computer vision", "3d vision", "machine learning"], "U of T Computer Science people", "https://web.cs.toronto.edu/people/faculty-directory"),
  professor("urtasun", "Raquel Urtasun", "urtasun@cs.toronto.edu", "toronto", "Computer Science", ["autonomous driving", "computer vision", "machine learning"], "U of T Computer Science people", "https://web.cs.toronto.edu/people/faculty-directory"),
  professor("schmidt", "Mark Schmidt", "schmidtm@cs.ubc.ca", "ubc", "Computer Science", ["machine learning", "optimization"], "UBC Computer Science people", "https://www.cs.ubc.ca/people/faculty"),
  professor("poupart", "Pascal Poupart", "ppoupart@uwaterloo.ca", "waterloo", "David R. Cheriton School of Computer Science", ["machine learning", "reinforcement learning", "natural language processing"], "Waterloo Cheriton School people", "https://cs.uwaterloo.ca/about/people"),
  professor("davison", "Andrew Davison", "a.davison@imperial.ac.uk", "imperial", "Department of Computing", ["computer vision", "slam", "robotics"], "Imperial Department of Computing people", "https://www.imperial.ac.uk/computing/people/"),
  professor("barber", "David Barber", "d.barber@ucl.ac.uk", "ucl", "Computer Science", ["machine learning", "probabilistic modelling"], "UCL Computer Science people", "https://www.ucl.ac.uk/computer-science/people"),
  professor("lapata", "Mirella Lapata", "mlap@inf.ed.ac.uk", "edinburgh", "School of Informatics", ["natural language processing", "machine learning"], "Edinburgh Informatics people", "https://www.ed.ac.uk/informatics/people"),
  professor("cremers", "Daniel Cremers", "cremers@tum.de", "tum", "School of Computation, Information and Technology", ["computer vision", "3d reconstruction", "machine learning"], "TUM Computer Vision Group", "https://cvg.cit.tum.de/members"),
  professor("krause", "Andreas Krause", "krausea@ethz.ch", "eth", "Computer Science", ["machine learning", "reinforcement learning", "optimization"], "ETH Computer Science faculty", "https://inf.ethz.ch/people/faculty.html"),
  professor("pollefeys", "Marc Pollefeys", "marc.pollefeys@inf.ethz.ch", "eth", "Computer Science", ["computer vision", "3d vision", "robotics", "mixed reality"], "ETH Computer Science faculty", "https://inf.ethz.ch/people/faculty.html"),
  professor("kankanhalli", "Mohan Kankanhalli", "mohan@comp.nus.edu.sg", "nus", "School of Computing", ["multimedia", "computer vision", "privacy"], "NUS School of Computing faculty", "https://www.comp.nus.edu.sg/about/faculty/"),
];

export const researchAreas = Array.from(new Set(professors.flatMap((p) => p.areas))).sort();
