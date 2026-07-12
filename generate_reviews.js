const fs = require('fs');

const maleNames = ["عبدالله", "محمد", "فيصل", "سعود", "فهد", "خالد", "سلمان", "نايف", "عبدالرحمن", "نواف", "سعد", "تركي", "وليد", "طارق", "بدر", "ماجد", "عمر", "علي", "صالح", "يزيد", "بسام", "طلال", "مشعل", "ياسر", "فارس", "زياد", "رائد", "مهند", "احمد", "انس", "حسن", "حسين"];
const femaleNames = ["نورة", "سارة", "شهد", "ريما", "العنود", "ليان", "لمى", "رهف", "روان", "رغد", "هيفاء", "مها", "عبير", "امل", "حنان", "ريم", "منيرة", "نوف", "غادة", "ديمة", "يارا", "جنى", "لين", "لجين", "امجاد", "اسماء", "اشواق", "بشاير", "تهاني", "نجود"];
const lastNames = ["العتيبي", "المطيري", "القحطاني", "الدوسري", "العنزي", "الشمري", "الحربي", "السبيعي", "الغامدي", "الزهراني", "الشهراني", "الجهني", "المالكي", "الرويلي", "العسيري", "الحويطي", "الخالدي", "التميمي", "اليامي", "البقمي", "السالم", "الاحمد", "النصار", "الفهد", "الجابر", "السعد"];

const brands = ["الأوس", "الاوس", "الأوس الماسية", "الاوس الماسيه", "منصتكم", "المنصة", "الموقع"];

const praises = [
  "يعطيكم الف عافية", "مره شكرا", "عمل جبار", "والله شغل مرتب", "ابداع صراحة", 
  "بيض الله وجيهكم", "احسن محاكي جربته", "التجربة اسطورية", "ما قصرتوا والله",
  "شغل متعوب عليه", "احترافية عالية", "من افضل المنصات", "شكرا من القلب",
  "رهيبين", "فخامة", "شيء يفتح النفس", "ما شاء الله تبارك الله"
];

const specifics = [
  "الواجهة والتصميم رهيب يفك الازمة.", "كسرتوا رهبة الاختبار عندي.", "التوقيت جدا دقيق نفس الحقيقي.",
  "شرح الاخطاء ميزة خرافية فادتني كثير.", "الاسئلة متطابقة بشكل يخوف!", "أحسن شيء انه مجاني بالكامل.",
  "سهولة الاستخدام مو طبيعية.", "اختصرتوا علي وقت طويل في البحث.", "النتيجة الفورية ريحتني.",
  "الديزاين رايق والالوان مريحة للعين.", "حسيت اني في قاعة الاختبار فعلا.", "التحديثات حقتكم اول باول.",
  "سهل تراجع اخطائك وتتعلم منها.", "التجربة سلسة ومفيش اي تقطيع.", "الاسئلة موزعة صح زي قياس.",
  "حبيت اني اقدر اعيد المحاكي اكثر من مره.", "افضل مصدر تذاكر منه.", "شكرا لانكم سهلتوا علينا."
];

const questions = [
  "بس بسأل هل فيه نسخة للايباد؟", "كيف اقدر اشترك في الدورة كاملة؟", "متى بتنزلون محاكي التحصيلي؟",
  "هل الاسئلة تتحدث باستمرار؟", "كيف احمل الشهادة؟", "يعطيكم العافية بس وين احصل الملخصات؟",
  "هل فيه تطبيق للجوال؟", "هل اقدر اراجع اسئلتي بعدين؟", "فيه خصم للي يجيب درجة كاملة؟"
];

const emojis = ["🔥", "🤍", "🙏", "👏", "😍", "✨", "💯", "👌", "💡", "💪", "😎", "🌟", ""];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateReview() {
  const isMale = Math.random() > 0.5;
  const firstName = randomChoice(isMale ? maleNames : femaleNames);
  const lastName = randomChoice(lastNames);
  const name = `${firstName} ${lastName}`;
  
  const type = Math.random();
  let text = "";
  
  if (type < 0.3) {
    text = `${randomChoice(praises)} ${randomChoice(brands)}، ${randomChoice(specifics)} ${randomChoice(emojis)}`;
  } else if (type < 0.6) {
    text = `${randomChoice(specifics)} ${randomChoice(praises)} ${randomChoice(emojis)}`;
  } else if (type < 0.8) {
    text = `${randomChoice(praises)} ${randomChoice(emojis)}`;
  } else if (type < 0.9) {
    text = `${randomChoice(praises)} ${randomChoice(emojis)} ${randomChoice(questions)}`;
  } else {
    text = `${randomChoice(specifics)} ${randomChoice(emojis)}`;
  }

  text = text.replace(/\s+/g, ' ').trim();
  
  const stars = Math.random() > 0.1 ? 5 : 4;
  
  return { name, stars, text };
}

// Ensure first few are specific good ones to match the original style
const reviews = [
  { name: "ريماس فاتح", stars: 5, text: "والله تجربة رهيبة! الجو نفس قاعة الاختبار بالضبط، ساعدني أكسر رهبة اليوم الأول 🔥" },
  { name: "سلمى شلبي", stars: 5, text: "بعد ما تدربت دخلت الاختبار وانا واثقة، الأجزاء والوقت كل شيء كان مألوف. مشكورين الأوس الماسية 💙" },
  { name: "بدر الناصر", stars: 5, text: "ميزة مراجعة الأخطاء خرافية. عرفت نقاط ضعفي في Grammar وركزت عليها." },
  { name: "خالد العمري", stars: 5, text: "مجاناً وبجودة عالية؟ مش معقول. أحسن إنتاج شفته على منصة تعليمية عربية 👏" },
  { name: "منيرة السبيعي", stars: 5, text: "قدرت أحدد وقت كل سؤال بدقة بسبب المحاكي. النتيجة: درجة عالية فوق ما توقعت!" },
  { name: "عبدالرحمن المري", stars: 5, text: "كنت خايف من رهبة الوقت، بس محاكي الاوس كسر هالحاجز، شكراً لكم." }
];

for (let i = 0; i < 210; i++) {
  const rev = generateReview();
  if (!reviews.find(r => r.name === rev.name && r.text === rev.text)) {
    reviews.push(rev);
  }
}

const fileContent = `export const REVIEWS = ${JSON.stringify(reviews, null, 2)};\n`;

fs.writeFileSync('f:/TKHSAS/app/simulator/[courseId]/reviews.ts', fileContent);
console.log('Reviews generated successfully!');
