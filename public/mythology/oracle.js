const form = document.querySelector("#oracle-form");
const results = document.querySelector("#oracle-results");

const zodiacStarts = [
  ["Aquarius", "01-20"], ["Pisces", "02-19"], ["Aries", "03-21"],
  ["Taurus", "04-20"], ["Gemini", "05-21"], ["Cancer", "06-21"],
  ["Leo", "07-23"], ["Virgo", "08-23"], ["Libra", "09-23"],
  ["Scorpio", "10-23"], ["Sagittarius", "11-22"], ["Capricorn", "12-22"],
];

const colors = {
  red: "Across different settings, red can suggest energy, courage, celebration, or warning. Which meaning fits your life is yours to decide.",
  orange: "Orange is often associated with warmth, creativity, and vitality. Treat that association as a prompt to notice what energizes you.",
  yellow: "Yellow can evoke sunlight, attention, or learning in different contexts. Consider what you would like to bring into clearer view.",
  green: "Green is often linked with growth, renewal, or the natural world. You might reflect on something you want to nurture.",
  blue: "Blue may suggest calm, distance, or depth depending on the culture and context. What kind of steadiness would help you now?",
  purple: "Purple has carried many associations, including ceremony, status, and imagination. Let it prompt a question about what feels meaningful to you.",
  white: "White can signify celebration, mourning, purity, or simplicity in different traditions. Its meaning is never universal; what does it mean to you?",
  black: "Black can suggest night, formality, protection, or grief in different settings. Consider what you are ready to acknowledge or set down.",
};

const hinduReflections = [
  "A dharma-inspired question for reflection: what responsibility or value feels worth honoring in the choices directly before you? This is a modern prompt, not a religious ruling or horoscope.",
  "Many Hindu philosophies explore action, intention, and duty in different ways. You might reflect on one thoughtful action you can take without controlling its outcome.",
  "Consider where patience, learning, or service could guide a next step. Hindu traditions are diverse; this reflection does not represent every school or community.",
  "A reflective prompt: what would balance effort with care for yourself and others today? This is not a prediction or a traditional Jyotish reading.",
];

const greekReflections = [
  ["Athena", "A symbolic Greek-myth lens: Athena can evoke craft, planning, and considered courage. Where might preparation help more than rushing?"],
  ["Hermes", "A symbolic Greek-myth lens: Hermes can evoke communication, travel, and adaptability. Is there a conversation or new route worth exploring?"],
  ["Demeter", "A symbolic Greek-myth lens: Demeter can evoke care, cycles, and renewal. What needs time and tending before it can grow?"],
  ["Hephaestus", "A symbolic Greek-myth lens: Hephaestus can evoke making, persistence, and ingenuity. What could you improve by building it step by step?"],
];

const egyptianReflections = [
  ["Ma'at", "A historical-symbolic lens: Ma'at is associated with truth, balance, and order. What would a fair and balanced choice look like here?"],
  ["Thoth", "A historical-symbolic lens: Thoth is associated with writing, knowledge, and measurement. What do you still need to learn before deciding?"],
  ["Bastet", "A historical-symbolic lens: Bastet has varied associations across Egyptian history. Consider what care, protection, or joy means in your own context."],
  ["Sekhmet", "A historical-symbolic lens: Sekhmet is associated with power and healing in some contexts. Where might strength be most useful when paired with restraint?"],
];

const alphabetPrompts = [
  "A-F: A playful modern prompt for curiosity and beginning - what small first step could you take?",
  "G-L: A playful modern prompt for growth and listening - what are you learning from the people around you?",
  "M-R: A playful modern prompt for making and reflection - what would you like to shape with care?",
  "S-Z: A playful modern prompt for steadiness and imagination - what possibility deserves a little more attention?",
];

function reduceNumber(value, preserveMaster = true) {
  let number = value;
  while (number > 9 && !(preserveMaster && [11, 22, 33].includes(number))) {
    number = String(number).split("").reduce((sum, digit) => sum + Number(digit), 0);
  }
  return number;
}

function sumDigits(value) {
  return String(value).replace(/\D/g, "").split("").reduce((sum, digit) => sum + Number(digit), 0);
}

function nameNumber(name) {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
  if (!letters) return null;
  const total = [...letters].reduce((sum, letter) => sum + ((letter.charCodeAt(0) - 65) % 9) + 1, 0);
  return reduceNumber(total);
}

function getSunSign(dateText) {
  if (!dateText) return null;
  const monthDay = dateText.slice(5);
  if (!/^\d{2}-\d{2}$/.test(monthDay)) return null;
  for (let index = zodiacStarts.length - 1; index >= 0; index -= 1) {
    if (monthDay >= zodiacStarts[index][1]) return zodiacStarts[index][0];
  }
  return "Capricorn";
}

function createCard(title, message) {
  const card = document.createElement("article");
  card.className = "reading-card";
  const heading = document.createElement("h4");
  heading.textContent = title;
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  card.append(heading, paragraph);
  return card;
}

function appendReading(title, message) {
  results.append(createCard(title, message));
}

function createReflection(event) {
  event.preventDefault();
  const values = new FormData(form);
  const name = String(values.get("name") || "").trim();
  const birthDate = String(values.get("birthDate") || "");
  const birthTime = String(values.get("birthTime") || "");
  const birthPlace = String(values.get("birthPlace") || "").trim();
  const color = String(values.get("color") || "");
  const date = birthDate ? new Date(`${birthDate}T00:00:00`) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date && Number.isNaN(date.getTime())) {
    form.elements.birthDate.setCustomValidity("Enter a valid date.");
    form.elements.birthDate.reportValidity();
    return;
  }
  if (date && date > today) {
    form.elements.birthDate.setCustomValidity("Please enter a date in the past.");
    form.elements.birthDate.reportValidity();
    return;
  }
  form.elements.birthDate.setCustomValidity("");

  results.replaceChildren();
  const greeting = document.createElement("h3");
  greeting.textContent = name ? `A reflection for ${name}` : "Your symbolic reflection";
  const explanation = document.createElement("p");
  explanation.textContent = "Take what feels useful and leave the rest. These are cultural and creative prompts, not statements about a fixed destiny.";
  results.append(greeting, explanation);

  const seed = date ? sumDigits(birthDate) : name ? nameNumber(name) : 0;
  const lifePath = date ? reduceNumber(seed) : null;
  if (lifePath !== null) {
    appendReading(
      `Numerology · ${lifePath}`,
      `In one popular modern numerology method, the digits of your birth date reduce to ${lifePath}. Numerology is a belief system, not a scientific measure; use this number as a prompt for what you want to focus on.`,
    );
  } else {
    appendReading("Numerology", "Add a birth date if you would like a simple digit-sum numerology prompt. This is one modern method, not a scientific measure.");
  }

  const personalNumber = nameNumber(name);
  if (personalNumber !== null) {
    appendReading(
      `Name number · ${personalNumber}`,
      `Using a common modern A=1 to I=9 repeating letter pattern, your entered name reduces to ${personalNumber}. This playful convention varies and has no predictive power.`,
    );
  }

  const sign = getSunSign(birthDate);
  if (sign) {
    appendReading(
      `Western zodiac · ${sign}`,
      `A simple date-based Western tropical sun-sign lookup gives ${sign}. Birth time and birthplace are not used to calculate a natal chart here; this is not Jyotish or a complete astrological chart.`,
    );
  } else {
    appendReading("Astrology", "A date-based Western sun-sign prompt is available if you choose to enter your birth date. No full birth chart is calculated.");
  }

  const index = seed % 4;
  appendReading("Hindu traditions · a reflective prompt", hinduReflections[index]);
  appendReading("Greek mythology · a symbolic lens", greekReflections[index][1]);
  appendReading("Ancient Egypt · a historical-symbolic lens", egyptianReflections[(seed + 1) % egyptianReflections.length][1]);

  if (color && colors[color]) {
    appendReading(`Color symbolism · ${color[0].toUpperCase()}${color.slice(1)}`, colors[color]);
  } else {
    appendReading("Color symbolism", "Choose a color if you would like a reflection on some of its cultural associations. Color meanings vary across cultures and are not universal.");
  }

  if (name) {
    const initial = name[0].toUpperCase();
    const initialIndex = initial.charCodeAt(0) - 65;
    if (initialIndex >= 0 && initialIndex <= 25) {
      const prompt = alphabetPrompts[Math.floor(initialIndex / 7)];
      appendReading(`A–Z name prompt · ${initial}`, `${prompt} This is a contemporary creative prompt, not an ancient or traditional alphabet system.`);
    }
  }

  const context = [];
  if (birthTime) context.push(`birth time ${birthTime}`);
  if (birthPlace) context.push(`birthplace ${birthPlace}`);
  if (context.length) {
    appendReading("Birth details", `You provided ${context.join(" and ")}. They are shown here only as context and are not used to calculate a chart.`);
  }

  appendReading(
    "A question for your next chapter",
    "What is one small, kind, practical choice you can make this week that reflects the person you want to become? Your future is shaped by many factors and your own choices—not determined by this reading.",
  );
  results.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

form.elements.birthDate.addEventListener("input", () => {
  form.elements.birthDate.setCustomValidity("");
});
form.addEventListener("submit", createReflection);
form.addEventListener("reset", () => {
  form.elements.birthDate.setCustomValidity("");
  results.replaceChildren();
});
