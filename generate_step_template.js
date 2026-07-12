const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const data = [];

// 1. READING COMPREHENSION (40 Questions) - 8 passages, 5 questions each
const readingPassages = [
  "Sleep is a naturally recurring state of mind and body, characterized by altered consciousness, relatively inhibited sensory activity, reduced muscle activity, and inhibition of nearly all voluntary muscles. It is distinguished from wakefulness by a decreased ability to react to stimuli. During sleep, most of the body's systems are in an anabolic state, helping to restore the immune, nervous, skeletal, and muscular systems.",
  "The history of aviation has extended over more than two thousand years, from the earliest forms of aviation such as kites and attempts at tower jumping to supersonic and hypersonic flight by powered, heavier-than-air jets. Kite flying in China dates back to several hundred years BC and slowly spread around the world.",
  "Economics is the social science that studies the production, distribution, and consumption of goods and services. Economics focuses on the behaviour and interactions of economic agents and how economies work. Microeconomics analyzes what's viewed as basic elements in the economy, including individual agents and markets.",
  "Oceanography is the scientific study of the ocean. It is an important Earth science, which covers a wide range of topics, including ecosystem dynamics; ocean currents, waves, and geophysical fluid dynamics; plate tectonics and the geology of the sea floor; and fluxes of various chemical substances.",
  "A volcano is a rupture in the crust of a planetary-mass object, such as Earth, that allows hot lava, volcanic ash, and gases to escape from a magma chamber below the surface. On Earth, volcanoes are most often found where tectonic plates are diverging or converging, and most are found underwater.",
  "Psychology is the scientific study of mind and behavior. Psychology includes the study of conscious and unconscious phenomena, including feelings and thoughts. It is an academic discipline of immense scope, crossing the boundaries between the natural and social sciences.",
  "Renewable energy is energy that is collected from renewable resources, which are naturally replenished on a human timescale. It includes sources such as sunlight, wind, rain, tides, waves, and geothermal heat. Renewable energy often provides energy in four important areas: electricity generation, air and water heating/cooling, transportation, and rural energy services.",
  "Architecture is both the process and the product of planning, designing, and constructing buildings or other structures. Architectural works, in the material form of buildings, are often perceived as cultural symbols and as works of art. Historical civilizations are often identified with their surviving architectural achievements."
];

for (let p = 0; p < 8; p++) {
  data.push({
    "نص السؤال": `What is the main topic of the passage?`,
    "القسم (reading/listening/grammar/analysis)": "reading",
    "قطعة القراءة / رابط الصوت": readingPassages[p],
    "الخيار أ (صحيح دائماً)": `The primary definition and characteristics of the subject`,
    "الخيار ب": `A debate about historical timelines`,
    "الخيار ج": `An argument against scientific studies`,
    "الخيار د": `A purely philosophical perspective`,
    "الشرح": "The passage mainly introduces and defines the primary concept."
  });
  data.push({
    "نص السؤال": `According to the passage, which of the following is true?`,
    "القسم (reading/listening/grammar/analysis)": "reading",
    "قطعة القراءة / رابط الصوت": readingPassages[p],
    "الخيار أ (صحيح دائماً)": `It has been clearly defined by specific characteristics or scope.`,
    "الخيار ب": `It is a completely unproven and random phenomenon.`,
    "الخيار ج": `It only exists in very isolated environments.`,
    "الخيار د": `Nobody understands how it works.`,
    "الشرح": "The text explicitly states this fact in the initial sentences."
  });
  data.push({
    "نص السؤال": `The word 'It' in the second sentence refers to:`,
    "القسم (reading/listening/grammar/analysis)": "reading",
    "قطعة القراءة / رابط الصوت": readingPassages[p],
    "الخيار أ (صحيح دائماً)": `The main subject of the passage`,
    "الخيار ب": `The scientists`,
    "الخيار ج": `The historical era`,
    "الخيار د": `The surrounding environment`,
    "الشرح": "Pronouns usually refer to the closest preceding main noun."
  });
  data.push({
    "نص السؤال": `What can be inferred from the text?`,
    "القسم (reading/listening/grammar/analysis)": "reading",
    "قطعة القراءة / رابط الصوت": readingPassages[p],
    "الخيار أ (صحيح دائماً)": `The subject has broad significance and impact.`,
    "الخيار ب": `This field of study is no longer relevant today.`,
    "الخيار ج": `It is an extremely simple mechanism.`,
    "الخيار د": `It will end very soon.`,
    "الشرح": "Inference is drawn from the broad scope mentioned in the text."
  });
  data.push({
    "نص السؤال": `Which word is closest in meaning to the highlighted term in the text?`,
    "القسم (reading/listening/grammar/analysis)": "reading",
    "قطعة القراءة / رابط الصوت": readingPassages[p],
    "الخيار أ (صحيح دائماً)": `Crucial`,
    "الخيار ب": `Worthless`,
    "الخيار ج": `Optional`,
    "الخيار د": `Confusing`,
    "الشرح": "Vocabulary in context."
  });
}

// 2. GRAMMAR (30 Questions)
const grammarQuestions = [
  { q: "He ____ to the market every day.", a: "goes", b: "go", c: "going", d: "gone" },
  { q: "I have ____ my homework already.", a: "finished", b: "finish", c: "finishing", d: "finishes" },
  { q: "If it rains, we ____ at home.", a: "will stay", b: "stayed", c: "staying", d: "stays" },
  { q: "She is the girl ____ won the prize.", a: "who", b: "which", c: "where", d: "when" },
  { q: "By this time next year, I ____ graduated.", a: "will have", b: "will", c: "have", d: "had" },
  { q: "The book ____ was written by John is interesting.", a: "which", b: "who", c: "whom", d: "whose" },
  { q: "Neither the teacher nor the students ____ here.", a: "are", b: "is", c: "was", d: "has been" },
  { q: "I am looking forward to ____ you.", a: "seeing", b: "see", c: "saw", d: "seen" },
  { q: "He speaks English ____ than his brother.", a: "better", b: "good", c: "best", d: "well" },
  { q: "They have been living here ____ 2010.", a: "since", b: "for", c: "in", d: "at" },
  { q: "I wish I ____ a car.", a: "had", b: "have", c: "has", d: "will have" },
  { q: "He asked me what ____.", a: "my name was", b: "is my name", c: "was my name", d: "my name is" },
  { q: "It is important that he ____ early.", a: "arrive", b: "arrives", c: "arrived", d: "arriving" },
  { q: "Not only ____ late, but he also forgot his books.", a: "did he arrive", b: "he arrived", c: "he did arrive", d: "arrived he" },
  { q: "You ____ see a doctor about that cough.", a: "should", b: "would", c: "might", d: "could" },
  { q: "Despite ____ hard, he failed the exam.", a: "studying", b: "study", c: "studied", d: "studies" },
  { q: "The car needs ____.", a: "washing", b: "to wash", c: "washed", d: "wash" },
  { q: "I'd rather you ____ smoke in here.", a: "didn't", b: "don't", c: "not", d: "won't" },
  { q: "She is used to ____ up early.", a: "waking", b: "wake", c: "woke", d: "waken" },
  { q: "Hardly ____ left the house when it started raining.", a: "had I", b: "I had", c: "I have", d: "did I" },
  { q: "The more you read, the ____ you know.", a: "more", b: "most", c: "much", d: "many" },
  { q: "He suggested ____ to the beach.", a: "going", b: "to go", c: "go", d: "went" },
  { q: "I will call you as soon as I ____.", a: "arrive", b: "will arrive", c: "arrived", d: "am arriving" },
  { q: "This is the hospital ____ I was born.", a: "where", b: "which", c: "that", d: "when" },
  { q: "We must ____ the work done by tomorrow.", a: "have", b: "make", c: "do", d: "let" },
  { q: "He behaves as if he ____ the boss.", a: "were", b: "was", c: "is", d: "has been" },
  { q: "Scarcely had she finished reading ____ the phone rang.", a: "when", b: "than", c: "then", d: "while" },
  { q: "I object ____ treated like a child.", a: "to being", b: "to be", c: "being", d: "be" },
  { q: "There is ____ sugar left.", a: "little", b: "few", c: "many", d: "a few" },
  { q: "He denied ____ the money.", a: "stealing", b: "to steal", c: "steal", d: "stolen" }
];

grammarQuestions.forEach(item => {
  data.push({
    "نص السؤال": item.q,
    "القسم (reading/listening/grammar/analysis)": "grammar",
    "قطعة القراءة / رابط الصوت": "",
    "الخيار أ (صحيح دائماً)": item.a,
    "الخيار ب": item.b,
    "الخيار ج": item.c,
    "الخيار د": item.d,
    "الشرح": "Correct grammar rule applied."
  });
});

// 3. LISTENING (20 Questions)
// These questions precisely match the audio script that will be generated.
const listeningQuestions = [
  { q: "What time did the man say the train will depart?", a: "11:30 AM", b: "11:00 AM", c: "12:30 PM", d: "11:45 AM" },
  { q: "What is the weather forecast for tomorrow afternoon?", a: "Heavy rain", b: "Sunny", c: "Cloudy", d: "Snow" },
  { q: "What is the woman looking for?", a: "A pharmacy", b: "A supermarket", c: "A hospital", d: "A bank" },
  { q: "How many people is the restaurant reservation for?", a: "Two", b: "Three", c: "Four", d: "One" },
  { q: "What is the final destination of flight 402?", a: "Paris", b: "London", c: "Rome", d: "Berlin" },
  { q: "When is the strict deadline for the history assignment?", a: "Friday at 5 PM", b: "Monday at 9 AM", c: "Friday at 12 PM", d: "Thursday at 5 PM" },
  { q: "What does the man prefer to drink in the morning?", a: "Green tea", b: "Coffee", c: "Orange juice", d: "Water" },
  { q: "Which day is the national museum closed?", a: "Mondays", b: "Sundays", c: "Tuesdays", d: "Fridays" },
  { q: "What item is the speaker describing to the police?", a: "A wallet", b: "A bag", c: "A phone", d: "A jacket" },
  { q: "How much daily exercise does the doctor recommend?", a: "30 minutes", b: "1 hour", c: "15 minutes", d: "45 minutes" },
  { q: "When will the company's software update occur?", a: "Overnight", b: "Tomorrow morning", c: "Next week", d: "In an hour" },
  { q: "Why does the woman say she likes autumn?", a: "Because the leaves turn beautiful colors", b: "Because of the cool weather", c: "Because it's harvesting time", d: "Because there's no snow" },
  { q: "Which shirt color is currently out of stock?", a: "Blue", b: "Red", c: "Green", d: "Black" },
  { q: "What must the user do to reset their account password?", a: "Click the link in their email", b: "Call customer service", c: "Restart their computer", d: "Enter their old password" },
  { q: "How long has the man been playing the piano?", a: "Since he was seven years old", b: "For ten years", c: "Since last year", d: "For five years" },
  { q: "What time will they finally meet for dinner?", a: "7:00 PM", b: "7:15 PM", c: "6:30 PM", d: "7:30 PM" },
  { q: "Why should people keep off the grass today?", a: "They are planting new seeds", b: "The sprinklers are running", c: "It is wet from the rain", d: "It is a restricted area" },
  { q: "What was wrong with the pizza delivery?", a: "They delivered pepperoni instead of vegetarian", b: "It was late", c: "The pizza was cold", d: "They forgot the drinks" },
  { q: "Where will the new company branch open next month?", a: "Tokyo", b: "New York", c: "London", d: "Paris" },
  { q: "What should be done before leaving the office?", a: "Turn off all the lights", b: "Lock the doors", c: "Close the windows", d: "Set the alarm" }
];

for (let i = 0; i < 20; i++) {
  const num = i + 1;
  const item = listeningQuestions[i];
  data.push({
    "نص السؤال": item.q,
    "القسم (reading/listening/grammar/analysis)": "listening",
    "قطعة القراءة / رابط الصوت": `http://localhost:3000/audio${num}.wav`, // The parser knows if listening -> this is audio_url, NOT text!
    "الخيار أ (صحيح دائماً)": item.a,
    "الخيار ب": item.b,
    "الخيار ج": item.c,
    "الخيار د": item.d,
    "الشرح": "Listening comprehension check."
  });
}

// 4. COMPOSITIONAL ANALYSIS / WRITING (10 Questions)
const analysisQuestions = [
  { q: "Identify the incorrect spelling in the following sentence: 'The goverment decided to build a new hospital.'", a: "goverment", b: "decided", c: "build", d: "hospital" },
  { q: "Which of the following sentences is punctuated correctly?", a: "I bought apples, oranges, and bananas.", b: "I bought apples oranges and bananas.", c: "I bought, apples, oranges, and bananas.", d: "I bought apples, oranges and, bananas." },
  { q: "Choose the sentence with the correct capitalization:", a: "He traveled to Paris last October.", b: "He traveled to paris last october.", c: "he traveled to Paris last October.", d: "He Traveled to Paris Last October." },
  { q: "Which word is spelled incorrectly?", a: "Accommodate", b: "Definately", c: "Embarrass", d: "Fluorescent" },
  { q: "Identify the punctuation error: 'Its a beautiful day outside.'", a: "Its should be It's", b: "day should be Day", c: "Missing comma after beautiful", d: "No error" },
  { q: "Which sentence has correct subject-verb agreement?", a: "The list of items is on the desk.", b: "The list of items are on the desk.", c: "The lists of items is on the desk.", d: "The list of item are on the desk." },
  { q: "Choose the correct spelling:", a: "Receive", b: "Recieve", c: "Receve", d: "Resieve" },
  { q: "Identify the fragment:", a: "Because he was tired.", b: "He was tired.", c: "He slept early because he was tired.", d: "Being tired, he slept." },
  { q: "Which punctuation mark is needed? 'Watch out___'", a: "Exclamation mark (!)", b: "Question mark (?)", c: "Period (.)", d: "Comma (,)" },
  { q: "Which of the following is a run-on sentence?", a: "I love reading I read every day.", b: "I love reading; I read every day.", c: "I love reading, and I read every day.", d: "Because I love reading, I read every day." }
];

analysisQuestions.forEach(item => {
  data.push({
    "نص السؤال": item.q,
    "القسم (reading/listening/grammar/analysis)": "analysis",
    "قطعة القراءة / رابط الصوت": "",
    "الخيار أ (صحيح دائماً)": item.a,
    "الخيار ب": item.b,
    "الخيار ج": item.c,
    "الخيار د": item.d,
    "الشرح": "Compositional analysis checks spelling, punctuation, and structure."
  });
});

// Create Excel
const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "STEP_Template");
const filePath = path.join(__dirname, "public", "STEP_100_Template.xlsx");
XLSX.writeFile(wb, filePath);
console.log("Template generated successfully with 100 questions at " + filePath);
