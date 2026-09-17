import type { Locale } from "@/lib/types";

export interface Translations {
  nav: {
    home: string;
    diagnostics: string;
    matches: string;
    explore: string;
    compare: string;
    scholarships: string;
    professors: string;
    roadmap: string;
    applications: string;
    mentor: string;
    calendar: string;
    interview: string;
    documents: string;
    calculator: string;
    essays: string;
    ecoMode: string;
    ecoModeOn: string;
  };
  common: {
    appName: string;
    byTeam: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    upload: string;
    verified: string;
    missing: string;
    needsTranslation: string;
    close: string;
    search: string;
    filter: string;
    next: string;
    back: string;
    done: string;
    days: string;
    status: string;
    category: string;
    action: string;
    viewAll: string;
  };
  dashboard: {
    goodMorning: string;
    goodAfternoon: string;
    goodEvening: string;
    ecoBannerTitle: string;
    ecoBannerText: string;
    archetypeTitle: string;
    archetypePrompt: string;
    upcomingDeadlines: string;
    noUpcomingDeadlines: string;
    recommendedActivities: string;
    activityEnginePrompt: string;
    quickStats: string;
  };
  recommender: {
    title: string;
    subtitle: string;
    fieldLabel: string;
    addToRoadmap: string;
    addedToRoadmap: string;
    xpReward: string;
    impact: string;
    hoursWeek: string;
  };
  calendar: {
    title: string;
    subtitle: string;
    filterAll: string;
    filterDeadlines: string;
    filterExams: string;
    filterScholarships: string;
    upcomingAlert: string;
    noEvents: string;
  };
  interview: {
    title: string;
    subtitle: string;
    startCamera: string;
    stopCamera: string;
    startRecording: string;
    stopRecording: string;
    analyzing: string;
    questionSelector: string;
    cadenceScore: string;
    clarityScore: string;
    nervousnessDetector: string;
    stressLow: string;
    stressMedium: string;
    stressElevated: string;
    feedbackTitle: string;
    rubricScore: string;
    strengths: string;
    improvements: string;
  };
  documents: {
    title: string;
    subtitle: string;
    complianceScore: string;
    readyForVisa: string;
    dropPrompt: string;
    familyIncome: string;
    tax: string;
    insurance: string;
    bankStatements: string;
    passports: string;
    allFiles: string;
  };
  diplomaModal: {
    title: string;
    heading: string;
    body: string;
    boostText: string;
    topUniversity: string;
    claimReward: string;
    uploadDiploma: string;
  };
  calculator: {
    title: string;
    subtitle: string;
    selectUniversity: string;
    customUniversity: string;
    tuitionFees: string;
    housing: string;
    insurance: string;
    visaFees: string;
    flights: string;
    livingExpenses: string;
    totalAnnualCost: string;
    familyBudget: string;
    outOfPocketGap: string;
    coveredSurplus: string;
    currency: string;
  };
  mentor: {
    title: string;
    subtitle: string;
    ventModeTitle: string;
    ventModeActive: string;
    normalMode: string;
    typePlaceholder: string;
    send: string;
    stressDetected: string;
    switchSupportMode: string;
  };
  ecoMode: {
    bannerTitle: string;
    bannerQuote: string;
    bannerDescription: string;
    breathingTitle: string;
    inhale: string;
    hold: string;
    exhale: string;
  };
}

export const translations: Record<Locale, Translations> = {
  en: {
    nav: {
      home: "Home",
      diagnostics: "Diagnostics",
      matches: "Matches",
      explore: "Explore",
      compare: "Compare",
      scholarships: "Scholarships",
      professors: "Professors",
      roadmap: "Roadmap",
      applications: "Applications",
      mentor: "Mentor",
      calendar: "Calendar",
      interview: "Interview AI",
      documents: "Vault",
      calculator: "Cost Calculator",
      essays: "Essays",
      ecoMode: "Eco Mode",
      ecoModeOn: "Eco Mode On",
    },
    common: {
      appName: "Meridian Guide",
      byTeam: "by Flaxyss",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      upload: "Upload File",
      verified: "Verified",
      missing: "Missing",
      needsTranslation: "Needs Translation",
      close: "Close",
      search: "Search",
      filter: "Filter",
      next: "Next",
      back: "Back",
      done: "Done",
      days: "days",
      status: "Status",
      category: "Category",
      action: "Action",
      viewAll: "View All",
    },
    dashboard: {
      goodMorning: "Good morning",
      goodAfternoon: "Good afternoon",
      goodEvening: "Good evening",
      ecoBannerTitle: "Eco-Mode Active — Breathing Room Mode",
      ecoBannerText: "Take a deep breath. Success is a marathon, not a sprint. Heavy metrics are subdued.",
      archetypeTitle: "Student Psychographic Archetype",
      archetypePrompt: "Discover your student archetype to tailor admissions matching.",
      upcomingDeadlines: "Urgent Milestones",
      noUpcomingDeadlines: "No immediate deadlines in the next 30 days.",
      recommendedActivities: "Targeted Extracurricular Boosters",
      activityEnginePrompt: "Curated for your selected major to fill strategic admission gaps.",
      quickStats: "Progress Overview",
    },
    recommender: {
      title: "Major-Specific Extracurricular Engine",
      subtitle: "Targeted activities and competitions tailored to strengthen your target major.",
      fieldLabel: "Target Field of Study",
      addToRoadmap: "1-Click Add to Roadmap",
      addedToRoadmap: "Added to Roadmap",
      xpReward: "XP Reward",
      impact: "Impact Tier",
      hoursWeek: "hrs/week",
    },
    calendar: {
      title: "Deadlines & Milestones Calendar",
      subtitle: "Synchronized tracking for application cutoffs, standard exams, and scholarship windows.",
      filterAll: "All Events",
      filterDeadlines: "Deadlines",
      filterExams: "Standard Exams",
      filterScholarships: "Scholarships",
      upcomingAlert: "Crucial upcoming milestone in",
      noEvents: "No scheduled events matching this filter.",
    },
    interview: {
      title: "AI Video Interview Simulator",
      subtitle: "Live camera practice with real-time delivery speed, clarity, and simulated nervousness detection.",
      startCamera: "Enable Camera & Mic",
      stopCamera: "Turn Off Camera",
      startRecording: "Start Response",
      stopRecording: "Finish & Analyze",
      analyzing: "Analyzing response with Gemini AI...",
      questionSelector: "Select Question",
      cadenceScore: "Speech Pace (WPM)",
      clarityScore: "Audio Clarity",
      nervousnessDetector: "Poise & Stress Level",
      stressLow: "Calm & Composed",
      stressMedium: "Slight Tension",
      stressElevated: "Elevated Nervousness",
      feedbackTitle: "Gemini AI Qualitative Assessment",
      rubricScore: "Overall Interview Score",
      strengths: "Demonstrated Strengths",
      improvements: "Actionable Refinements",
    },
    documents: {
      title: "Financial & Legal Document Vault",
      subtitle: "Automated document categorization, compliance verification, and visa readiness tracking.",
      complianceScore: "Visa & Aid Readiness Score",
      readyForVisa: "Complete all required documents to achieve full visa filing clearance.",
      dropPrompt: "Drag and drop or browse documents to categorize",
      familyIncome: "Family Income",
      tax: "Tax Payers Documents",
      insurance: "Health & Medical Insurance",
      bankStatements: "Bank Statements",
      passports: "Passports & Identification",
      allFiles: "All Vault Files",
    },
    diplomaModal: {
      title: "Achievement Confirmed",
      heading: "Admission Probability Boosted!",
      body: "Your new certificate has been verified by the portfolio engine.",
      boostText: "Your admission probability to your top choice just increased by",
      topUniversity: "Top Match University",
      claimReward: "Claim XP & Continue",
      uploadDiploma: "Upload Diploma / Award",
    },
    calculator: {
      title: "True Cost of Attendance Calculator",
      subtitle: "Comprehensive out-of-pocket financial forecasting including living, flights, visa, and insurance.",
      selectUniversity: "Select University to Populate",
      customUniversity: "Custom / Generic Calculation",
      tuitionFees: "Tuition & Mandatory Fees",
      housing: "Housing & Campus Dorms",
      insurance: "Health & Medical Insurance",
      visaFees: "Visa & SEVIS Fees",
      flights: "Annual Air Travel",
      livingExpenses: "Living Expenses & Food",
      totalAnnualCost: "Total Estimated Annual Cost",
      familyBudget: "Your Annual Family Budget",
      outOfPocketGap: "Estimated Financial Gap",
      coveredSurplus: "Fully Covered by Budget",
      currency: "Currency",
    },
    mentor: {
      title: "AI Admissions Mentor & Psychologist",
      subtitle: "Context-aware application strategist and compassionate mental health counselor.",
      ventModeTitle: "Mental Health Support Mode (Vent & Decompress)",
      ventModeActive: "Support Mode Active",
      normalMode: "Admissions Strategy Mode",
      typePlaceholder: "Ask about your roadmap, essays, or share how you're feeling...",
      send: "Send",
      stressDetected: "Admissions can feel intense. Would you like to switch to Support & Vent Mode?",
      switchSupportMode: "Switch to Support Mode",
    },
    ecoMode: {
      bannerTitle: "Burnout Eco-Mode Active",
      bannerQuote: "Breathe in deeply. You are on track.",
      bannerDescription: "Visual distractions are softened and your tasks are focused strictly on today's single most critical step.",
      breathingTitle: "Calming Box Breathing Exercise",
      inhale: "Inhale (4s)",
      hold: "Hold (4s)",
      exhale: "Exhale (4s)",
    },
  },
  kk: {
    nav: {
      home: "Басты бет",
      diagnostics: "Диагностика",
      matches: "Сәйкестіктер",
      explore: "Университеттер",
      compare: "Салыстыру",
      scholarships: "Шәкіртақылар",
      professors: "Профессорлар",
      roadmap: "Жол картасы",
      applications: "Өтінімдер",
      mentor: "Тәлімгер",
      calendar: "Күнтізбе",
      interview: "Сұхбат AI",
      documents: "Құжаттар қоймасы",
      calculator: "Шығын есептегіші",
      essays: "Эссе",
      ecoMode: "Эко-режим",
      ecoModeOn: "Эко-режим қосулы",
    },
    common: {
      appName: "Meridian Guide",
      byTeam: "Flaxyss тобынан",
      save: "Сақтау",
      cancel: "Бас тарту",
      delete: "Жою",
      edit: "Өңдеу",
      add: "Қосу",
      upload: "Файлды жүктеу",
      verified: "Расталған",
      missing: "Жоқ",
      needsTranslation: "Аударма қажет",
      close: "Жабу",
      search: "Іздеу",
      filter: "Сүзгі",
      next: "Келесі",
      back: "Артқа",
      done: "Дайын",
      days: "күн",
      status: "Мәртебесі",
      category: "Санаты",
      action: "Әрекет",
      viewAll: "Барлығын көру",
    },
    dashboard: {
      goodMorning: "Қайырлы таң",
      goodAfternoon: "Қайырлы күн",
      goodEvening: "Қайырлы кеш",
      ecoBannerTitle: "Эко-режим белсенді — Тыныштық режимі",
      ecoBannerText: "Терең тыныс алыңыз. Жетістік — бұл марафон. Артық жүктеме басылды.",
      archetypeTitle: "Студенттің психологиялық архетипі",
      archetypePrompt: "Түсу мүмкіндігін арттыру үшін жеке архетипіңізді анықтаңыз.",
      upcomingDeadlines: "Маңызды мерзімдер",
      noUpcomingDeadlines: "Алдағы 30 күнде шұғыл мерзімдер жоқ.",
      recommendedActivities: "Таңдалған мамандық белсенділіктері",
      activityEnginePrompt: "Сіздің мамандығыңызға қажетті маңызды портфолио бос орындарын толтыру.",
      quickStats: "Жалпы прогресс",
    },
    recommender: {
      title: "Мамандық бойынша сыныптан тыс іс-шаралар",
      subtitle: "Таңдаған мамандығыңызға бейімделген жарыстар, ғылыми зерттеулер мен жобалар.",
      fieldLabel: "Мамандық бағыты",
      addToRoadmap: "1 басумен Жол картасына қосу",
      addedToRoadmap: "Жол картасына қосылды",
      xpReward: "XP Ұпайы",
      impact: "Әсер деңгейі",
      hoursWeek: "сағ/апта",
    },
    calendar: {
      title: "Мерзімдер мен емтихандар күнтізбесі",
      subtitle: "Өтінім мерзімдерін, халықаралық емтихандарды және гранттарды бір жерде бақылаңыз.",
      filterAll: "Барлық оқиғалар",
      filterDeadlines: "Дедлайндар",
      filterExams: "Емтихандар",
      filterScholarships: "Шәкіртақылар",
      upcomingAlert: "Жақындап қалған маңызды мерзім:",
      noEvents: "Бұл сүзгі бойынша оқиғалар табылмады.",
    },
    interview: {
      title: "AI Бейне-сұхбат симуляторы",
      subtitle: "Камера арқылы нақты уақытта сөйлеу жылдамдығын, анықтығын және толқу деңгейін тексеру.",
      startCamera: "Камера мен микрофонды қосу",
      stopCamera: "Камераны өшіру",
      startRecording: "Жауапты бастау",
      stopRecording: "Аяқтау және талдау",
      analyzing: "Gemini AI жауапты бағалауда...",
      questionSelector: "Сұрақты таңдаңыз",
      cadenceScore: "Сөйлеу қарқыны (WPM)",
      clarityScore: "Дыбыс анықтығы",
      nervousnessDetector: "Салмақтылық және толқу деңгейі",
      stressLow: "Өте салмақты және сенімді",
      stressMedium: "Аздаған қобалжу",
      stressElevated: "Жоғары қобалжу деңгейі",
      feedbackTitle: "Gemini AI сапалық бағалауы",
      rubricScore: "Жалпы сұхбат ұпайы",
      strengths: "Күшті жақтары",
      improvements: "Жақсартуға арналған кеңестер",
    },
    documents: {
      title: "Қаржылық және заңды құжаттар қоймасы",
      subtitle: "Құжаттарды автоматты сұрыптау, визалық талаптарға сәйкестігін тексеру.",
      complianceScore: "Виза және грант дайындығы",
      readyForVisa: "Виза алуға өтінім беру үшін барлық міндетті құжаттарды жүктеңіз.",
      dropPrompt: "Құжаттарды осында тасымалдаңыз немесе таңдаңыз",
      familyIncome: "Отбасы кірісі",
      tax: "Салық құжаттары",
      insurance: "Медициналық сақтандыру",
      bankStatements: "Банк үзінділері",
      passports: "Төлқұжат және куәліктер",
      allFiles: "Барлық құжаттар",
    },
    diplomaModal: {
      title: "Жетістік расталды",
      heading: "Түсу ықтималдығы артты!",
      body: "Жаңа сертификатыңыз жүйе тарапынан тексерілді.",
      boostText: "Таңдаулы университетіңізге түсу мүмкіндігі мына мөлшерге артты:",
      topUniversity: "Басты сәйкес университет",
      claimReward: "XP алып, жалғастыру",
      uploadDiploma: "Диплом / Марапатты жүктеу",
    },
    calculator: {
      title: "Оқудың нақты құнын есептегіш",
      subtitle: "Тұру, виза, сақтандыру және ұшу шығындарын толық есептеу.",
      selectUniversity: "Университетті таңдау",
      customUniversity: "Жеке есептеу",
      tuitionFees: "Оқу ақысы және жарналар",
      housing: "Жатақхана және тұру",
      insurance: "Медициналық сақтандыру",
      visaFees: "Виза және SEVIS алымдары",
      flights: "Жылдық ұшу билеттері",
      livingExpenses: "Күнделікті тамақ пен шығындар",
      totalAnnualCost: "Жылдық жалпы шығын",
      familyBudget: "Отбасының жылдық бюджеті",
      outOfPocketGap: "Қосымша қажетті қаражат",
      coveredSurplus: "Бюджет толық жетеді",
      currency: "Валюта",
    },
    mentor: {
      title: "AI Тәлімгер және Психолог",
      subtitle: "Қабылдау стратегиясы бойынша кеңесші және қолдаушы маман.",
      ventModeTitle: "Психологиялық қолдау режимі (Сырласу және демалу)",
      ventModeActive: "Қолдау режимі қосулы",
      normalMode: "Қабылдау стратегиясы режимі",
      typePlaceholder: "Өз сезімдеріңізбен бөлісіңіз немесе сұрақ қойыңыз...",
      send: "Жіберу",
      stressDetected: "Шаршаңқы сезінесіз бе? Психологиялық қолдау режиміне ауысқыңыз келе ме?",
      switchSupportMode: "Қолдау режиміне ауысу",
    },
    ecoMode: {
      bannerTitle: "Күйіп кетуге қарсы Эко-режим",
      bannerQuote: "Терең тыныс алыңыз. Барлығы ойдағыдай өтуде.",
      bannerDescription: "Артық визуалды шу алынып тасталды. Тек бүгінгі ең маңызды 1-2 тапсырмаға назар аударыңыз.",
      breathingTitle: "Тыныс алу жаттығуы",
      inhale: "Тыныс алу (4с)",
      hold: "Ұстап тұру (4с)",
      exhale: "Шығару (4с)",
    },
  },
  ru: {
    nav: {
      home: "Главная",
      diagnostics: "Диагностика",
      matches: "Подбор",
      explore: "Университеты",
      compare: "Сравнение",
      scholarships: "Стипендии",
      professors: "Профессора",
      roadmap: "Дорожная карта",
      applications: "Заявки",
      mentor: "Ментор",
      calendar: "Календарь",
      interview: "Интервью AI",
      documents: "Сейф документов",
      calculator: "Калькулятор затрат",
      essays: "Эссе",
      ecoMode: "Эко-режим",
      ecoModeOn: "Эко-режим включен",
    },
    common: {
      appName: "Meridian Guide",
      byTeam: "от команды Flaxyss",
      save: "Сохранить",
      cancel: "Отмена",
      delete: "Удалить",
      edit: "Редактировать",
      add: "Добавить",
      upload: "Загрузить файл",
      verified: "Подтверждено",
      missing: "Отсутствует",
      needsTranslation: "Требует перевода",
      close: "Закрыть",
      search: "Поиск",
      filter: "Фильтр",
      next: "Далее",
      back: "Назад",
      done: "Готово",
      days: "дней",
      status: "Статус",
      category: "Категория",
      action: "Действие",
      viewAll: "Посмотреть все",
    },
    dashboard: {
      goodMorning: "Доброе утро",
      goodAfternoon: "Добрый день",
      goodEvening: "Добрый вечер",
      ecoBannerTitle: "Эко-режим активен — Режим спокойствия",
      ecoBannerText: "Сделайте глубокий вдох. Поступление — это марафон, а не спринт. Нагрузка снижена.",
      archetypeTitle: "Психографический архетип студента",
      archetypePrompt: "Пройдите короткий тест для точной персонализации шансов поступления.",
      upcomingDeadlines: "Ближайшие дедлайны",
      noUpcomingDeadlines: "В ближайшие 30 дней срочных дедлайнов нет.",
      recommendedActivities: "Рекомендованные активности по специальности",
      activityEnginePrompt: "Специально подобранные проекты и олимпиады для закрытия пробелов в портфолио.",
      quickStats: "Обзор прогресса",
    },
    recommender: {
      title: "Генератор активностей по специальности",
      subtitle: "Целевые олимпиады, проекты и исследования, усиливающие выбранную специальность.",
      fieldLabel: "Целевое направление",
      addToRoadmap: "В 1 клик в Дорожную карту",
      addedToRoadmap: "Добавлено в роадмап",
      xpReward: "Награда XP",
      impact: "Уровень влияния",
      hoursWeek: "ч/нед",
    },
    calendar: {
      title: "Календарь дедлайнов и событий",
      subtitle: "Синхронизированный трекер сроков подачи заявок, сдачи тестов и окон подачи на стипендии.",
      filterAll: "Все события",
      filterDeadlines: "Дедлайны",
      filterExams: "Экзамены",
      filterScholarships: "Стипендии",
      upcomingAlert: "Важное приближающееся событие через",
      noEvents: "Нет событий, соответствующих выбранному фильтру.",
    },
    interview: {
      title: "AI Симулятор видео-интервью",
      subtitle: "Практика перед камерой с анализом темпа речи, чистоты звука и детекцией уровня волнения.",
      startCamera: "Включить камеру и микрофон",
      stopCamera: "Отключить камеру",
      startRecording: "Начать ответ",
      stopRecording: "Завершить и оценить",
      analyzing: "Gemini AI анализирует ваш ответ...",
      questionSelector: "Выберите вопрос",
      cadenceScore: "Темп речи (WPM)",
      clarityScore: "Четкость аудио",
      nervousnessDetector: "Спокойствие и детекция стресса",
      stressLow: "Уверенно и спокойно",
      stressMedium: "Легкое волнение",
      stressElevated: "Повышенный стресс",
      feedbackTitle: "Качественный разбор от Gemini AI",
      rubricScore: "Общий балл за интервью",
      strengths: "Сильные стороны",
      improvements: "Зоны для доработки",
    },
    documents: {
      title: "Сейф финансовых и визовых документов",
      subtitle: "Автоматическая сортировка документов по папкам, валидация статуса и расчет готовности к визе.",
      complianceScore: "Готовность к визе и финпомощи",
      readyForVisa: "Загрузите недостающие документы для полной готовности к подаче на визу.",
      dropPrompt: "Перетащите файлы сюда или выберите на диске",
      familyIncome: "Доходы семьи",
      tax: "Налоговые декларации",
      insurance: "Медицинская страховка",
      bankStatements: "Банковские выписки",
      passports: "Паспорта и удостоверения",
      allFiles: "Все документы",
    },
    diplomaModal: {
      title: "Достижение подтверждено",
      heading: "Шанс поступления увеличен!",
      body: "Ваш новый диплом успешно проверен алгоритмом оценки портфолио.",
      boostText: "Ваша вероятность поступления в топовый университет только что выросла на",
      topUniversity: "Целевой университет",
      claimReward: "Забрать XP и продолжить",
      uploadDiploma: "Загрузить диплом / грамоту",
    },
    calculator: {
      title: "Калькулятор реальной стоимости обучения",
      subtitle: "Полный расчет расходов: обучение, проживание, медицинская страховка, виза и авиабилеты.",
      selectUniversity: "Выбрать университет для автозаполнения",
      customUniversity: "Свой расчет",
      tuitionFees: "Обучение и обязательные сборы",
      housing: "Проживание и кампус",
      insurance: "Медицинская страховка",
      visaFees: "Визовые и консульские сборы",
      flights: "Ежегодные перелеты",
      livingExpenses: "Расходы на жизнь и питание",
      totalAnnualCost: "Общая расчетная стоимость в год",
      familyBudget: "Годовой бюджет семьи",
      outOfPocketGap: "Разница (необходимая сумма)",
      coveredSurplus: "Полностью покрыто бюджетом",
      currency: "Валюта",
    },
    mentor: {
      title: "AI Ментор и Психолог",
      subtitle: "Стратег по поступлению и чуткий консультант по ментальному здоровью.",
      ventModeTitle: "Режим психологической поддержки (Выговориться)",
      ventModeActive: "Режим поддержки активен",
      normalMode: "Режим стратегии поступления",
      typePlaceholder: "Задайте вопрос по стратегии или поделитесь тем, что вас беспокоит...",
      send: "Отправить",
      stressDetected: "Поступление может вызывать стресс. Хотите переключиться в Режим поддержки?",
      switchSupportMode: "Перейти в Режим поддержки",
    },
    ecoMode: {
      bannerTitle: "Эко-режим против выгорания",
      bannerQuote: "Дышите спокойно. Вы двигаетесь вперед.",
      bannerDescription: "Визуальный шум приглушен. Сосредоточьтесь только на 1-2 ключевых задачах на сегодня.",
      breathingTitle: "Успокаивающее дыхательное упражнение",
      inhale: "Вдох (4 сек)",
      hold: "Задержка (4 сек)",
      exhale: "Выдох (4 сек)",
    },
  },
};
