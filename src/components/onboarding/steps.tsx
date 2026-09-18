"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChipGroup, NumberField, RangeField, Segmented, SelectField, TextArea, TextField, Toggle } from "@/components/ui/fields";
import { Icon } from "@/components/ui/icon";
import { countries, regions } from "@/lib/data/universities";
import { fieldOptions } from "@/lib/engine/search";
import type { Activity, ActivityCategory, ActivityLevel, GradingSystem, StudentProfile } from "@/lib/types";
import styles from "./steps.module.css";
import { useT } from "@/lib/i18n/use-t";
import { msg } from "@/lib/i18n/catalog";

export interface StepProps {
  profile: StudentProfile;
  update: (patch: Partial<StudentProfile>) => void;
}

const homeCountries = [msg("Kazakhstan"), msg("Uzbekistan"), msg("Kyrgyzstan"), msg("Russia"), msg("Turkey"), msg("India"), msg("China"), msg("Vietnam"), msg("Indonesia"), msg("Nigeria"), msg("Brazil"), msg("United States"), msg("United Kingdom"), msg("Germany"), msg("Other")];

export function BasicInfoStep({ profile, update }: StepProps) {
  const t = useT();
  return (
    <div className={styles.grid}>
      <TextField label={t("Full name")} value={profile.fullName} onChange={(fullName) => update({ fullName })} placeholder={t("How should your mentor address you?")} className={styles.span2} />
      <SelectField label={t("Country of citizenship")} value={profile.country} onChange={(country) => update({ country })} options={[{ value: "", label: t("Select a country") }, ...homeCountries.map((c) => ({ value: c, label: c }))]} />
      <TextField label={t("School")} value={profile.school} onChange={(school) => update({ school })} placeholder={t("School name and city")} />
      <NumberField label={t("Current grade")} value={profile.grade} min={8} max={13} onChange={(grade) => update({ grade: grade ?? 11 })} />
      <NumberField label={t("Graduation year")} value={profile.graduationYear} min={2024} max={2035} onChange={(graduationYear) => update({ graduationYear: graduationYear ?? new Date().getFullYear() + 1 })} />
      <NumberField label={t("Age")} value={profile.age} min={12} max={25} onChange={(age) => update({ age: age ?? 17 })} />
    </div>
  );
}

const gradingOptions: { value: GradingSystem; label: string }[] = [
  { value: "gpa4", label: msg("GPA (4.0)") },
  { value: "five_point", label: "5-point" },
  { value: "percent", label: msg("Percent") },
  { value: "ib", label: "IB" },
  { value: "alevel", label: "A-Level" },
];

export function AcademicStep({ profile, update }: StepProps) {
  const t = useT();
  const gpaConfig = {
    gpa4: { label: "GPA", max: 4, step: 0.01, hint: t("Unweighted, on a 4.0 scale") },
    five_point: { label: t("Average grade"), max: 5, step: 0.01, hint: t("Common in Kazakhstan, Russia and Central Asia") },
    percent: { label: t("Average percentage"), max: 100, step: 0.1, hint: t("Overall average across subjects") },
    ib: null,
    alevel: null,
  }[profile.gradingSystem];

  return (
    <div className={styles.stack}>
      <Segmented label={t("Grading system")} value={profile.gradingSystem} options={gradingOptions} onChange={(gradingSystem) => update({ gradingSystem })} />
      <div className={styles.grid}>
        {gpaConfig && <NumberField label={gpaConfig.label} hint={gpaConfig.hint} value={profile.gpa} max={gpaConfig.max} min={0} step={gpaConfig.step} onChange={(gpa) => update({ gpa })} />}
        <NumberField label={t("IB predicted or final")} hint={t("Out of 45")} value={profile.ib} min={0} max={45} onChange={(ib) => update({ ib })} />
        <TextField label={t("A-Level grades")} hint={t("e.g. A*AA")} value={profile.aLevels} onChange={(aLevels) => update({ aLevels })} placeholder={t("A*AA")} />
        <NumberField label={t("SAT")} hint={t("Total out of 1600")} value={profile.sat} min={400} max={1600} step={10} onChange={(sat) => update({ sat })} />
        <NumberField label={t("ACT")} hint={t("Composite out of 36")} value={profile.act} min={1} max={36} onChange={(act) => update({ act })} />
        <TextField label={t("AP courses")} hint={t("Subjects and scores, if any")} value={profile.apCourses} onChange={(apCourses) => update({ apCourses })} placeholder={t("Calculus BC (5), Physics C (4)")} />
      </div>
    </div>
  );
}

export function EnglishStep({ profile, update }: StepProps) {
  const t = useT();
  return (
    <div className={styles.stack}>
      <p className={styles.note}>{t("Add any test you have taken. Leave the others empty — we convert between them automatically.")}</p>
      <div className={styles.grid3}>
        <NumberField label={t("IELTS Academic")} hint="0–9" value={profile.ielts} min={0} max={9} step={0.5} onChange={(ielts) => update({ ielts })} />
        <NumberField label={t("TOEFL iBT")} hint="0–120" value={profile.toefl} min={0} max={120} onChange={(toefl) => update({ toefl })} />
        <NumberField label={t("Duolingo English Test")} hint="10–160" value={profile.duolingo} min={10} max={160} step={5} onChange={(duolingo) => update({ duolingo })} />
      </div>
    </div>
  );
}

export function InterestsStep({ profile, update }: StepProps) {
  const t = useT();
  return (
    <div className={styles.stack}>
      <ChipGroup label={t("Fields you want to study")} hint={t("Choose up to three")} options={fieldOptions} selected={profile.fields} onChange={(fields) => update({ fields: fields.slice(-3) })} />
      <TextArea label={t("What specifically excites you?")} hint={t("Topics, problems or questions — this powers professor matching")} value={profile.interestsNote} onChange={(interestsNote) => update({ interestsNote })} placeholder={t("e.g. computer vision for medical imaging, climate modelling, fintech for small businesses")} />
    </div>
  );
}

const categories: ActivityCategory[] = [msg("Competition"), msg("Olympiad"), msg("Research"), msg("Project"), msg("Startup"), msg("Leadership"), msg("Volunteering"), msg("Internship"), msg("Sports"), msg("Club"), msg("Award")];
const levels: { value: ActivityLevel; label: string }[] = [
  { value: "school", label: msg("School") },
  { value: "city", label: msg("City") },
  { value: "national", label: msg("National") },
  { value: "international", label: msg("International") },
];

function blankActivity(): Activity {
  return { id: `act-${Date.now().toString(36)}`, category: "Project", title: "", role: "", level: "school", impact: "", evidence: "", link: "", hoursPerWeek: 3 };
}

export function ActivitiesStep({ profile, update }: StepProps) {
  const t = useT();
  const setActivity = (id: string, patch: Partial<Activity>) => update({ activities: profile.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)) });

  return (
    <div className={styles.stack}>
      <AnimatePresence initial={false}>
        {profile.activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className={styles.activity}
          >
            <div className={styles.activityHeader}>
              <span className="eyebrow">{t("Activity {index}", { index: index + 1 })}</span>
              <button type="button" className={styles.remove} onClick={() => update({ activities: profile.activities.filter((a) => a.id !== activity.id) })}>
                
                {t("Remove")}
              </button>
            </div>
            <div className={styles.grid}>
              <SelectField label={t("Category")} value={activity.category} options={categories.map((c) => ({ value: c, label: c }))} onChange={(category) => setActivity(activity.id, { category })} />
              <SelectField label={t("Level")} value={activity.level} options={levels} onChange={(level) => setActivity(activity.id, { level })} />
              <TextField label={t("Title")} value={activity.title} onChange={(title) => setActivity(activity.id, { title })} placeholder={t("International Olympiad in Informatics")} />
              <TextField label={t("Your role")} value={activity.role} onChange={(role) => setActivity(activity.id, { role })} placeholder={t("Founder, captain, participant…")} />
              <TextArea label={t("Impact")} value={activity.impact} onChange={(impact) => setActivity(activity.id, { impact })} placeholder={t("What changed because of you? Use numbers where you can.")} className={styles.span2} />
              <TextField label={t("Evidence")} value={activity.evidence} onChange={(evidence) => setActivity(activity.id, { evidence })} placeholder={t("Certificate, article, repository")} />
              <TextField label={t("Link")} type="url" value={activity.link} onChange={(link) => setActivity(activity.id, { link })} placeholder={t("https://")} />
              <NumberField label={t("Hours per week")} value={activity.hoursPerWeek} min={0} max={40} onChange={(hoursPerWeek) => setActivity(activity.id, { hoursPerWeek: hoursPerWeek ?? 0 })} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <Button type="button" variant="ghost" onClick={() => update({ activities: [...profile.activities, blankActivity()] })}>
        <Icon name="plus" size={16} />
        {t("Add activity")}
      </Button>
      {profile.activities.length === 0 && <p className={styles.note}>{t("Competitions, olympiads, research, projects, startups, leadership, volunteering, internships, sports, clubs and awards all count.")}</p>}
    </div>
  );
}

const usd = (value: number) => (value >= 100000 ? "$100k+" : `$${Math.round(value / 1000)}k`);

export function FinancialStep({ profile, update }: StepProps) {
  const t = useT();
  return (
    <div className={styles.stack}>
      <RangeField label={t("Annual family budget for tuition and living")} value={profile.annualBudgetUsd} min={0} max={100000} step={1000} format={usd} onChange={(annualBudgetUsd) => update({ annualBudgetUsd })} />
      <div className={styles.grid}>
        <RangeField label={t("Preferred tuition — minimum")} value={profile.tuitionRange[0]} min={0} max={80000} step={1000} format={usd} onChange={(min) => update({ tuitionRange: [Math.min(min, profile.tuitionRange[1]), profile.tuitionRange[1]] })} />
        <RangeField label={t("Preferred tuition — maximum")} value={profile.tuitionRange[1]} min={0} max={80000} step={1000} format={usd} onChange={(max) => update({ tuitionRange: [profile.tuitionRange[0], Math.max(max, profile.tuitionRange[0])] })} />
      </div>
      <Toggle label={t("I will need need-based financial aid")} hint={t("Some universities meet full need for international students")} checked={profile.needsAid} onChange={(needsAid) => update({ needsAid })} />
      <Toggle label={t("A scholarship is required for me to enrol")} checked={profile.scholarshipRequired} onChange={(scholarshipRequired) => update({ scholarshipRequired })} />
    </div>
  );
}

export function PreferencesStep({ profile, update }: StepProps) {
  const t = useT();
  return (
    <div className={styles.stack}>
      <ChipGroup label={t("Countries")} options={countries} selected={profile.preferredCountries} onChange={(preferredCountries) => update({ preferredCountries })} />
      <ChipGroup label={t("Regions")} options={regions} selected={profile.preferredRegions} onChange={(preferredRegions) => update({ preferredRegions })} />
      <Segmented
        label={t("Campus")}
        value={profile.campusType}
        options={[
          { value: "any", label: t("Any") },
          { value: "urban", label: t("Urban") },
          { value: "suburban", label: t("Suburban") },
          { value: "rural", label: t("Rural") },
        ]}
        onChange={(campusType) => update({ campusType })}
      />
      <div className={styles.grid}>
        <Segmented
          label={t("Institution")}
          value={profile.institutionType}
          options={[
            { value: "any", label: t("Any") },
            { value: "public", label: t("Public") },
            { value: "private", label: t("Private") },
          ]}
          onChange={(institutionType) => update({ institutionType })}
        />
        <Segmented
          label={t("Size")}
          value={profile.size}
          options={[
            { value: "any", label: t("Any") },
            { value: "small", label: t("Small") },
            { value: "medium", label: t("Medium") },
            { value: "large", label: t("Large") },
          ]}
          onChange={(size) => update({ size })}
        />
      </div>
    </div>
  );
}

export function CareerStep({ profile, update }: StepProps) {
  const t = useT();
  return (
    <div className={styles.stack}>
      <TextArea label={t("Where do you see yourself after university?")} value={profile.careerGoal} onChange={(careerGoal) => update({ careerGoal })} placeholder={t("e.g. Machine learning engineer at a healthcare company, founding a startup, working in public policy")} />
      <Segmented
        label={t("Graduate school")}
        value={profile.gradSchool}
        options={[
          { value: "phd", label: "PhD" },
          { value: "masters", label: "Master's" },
          { value: "undecided", label: t("Undecided") },
          { value: "none", label: t("Not planning") },
        ]}
        onChange={(gradSchool) => update({ gradSchool })}
      />
    </div>
  );
}

export function TotemStep({ profile, update }: StepProps) {
  const t = useT();
  const options = [
    {
      id: "alikhan" as const,
      name: "Alikhan",
      title: t("The Ambitious Pioneer"),
      image: "/totems/alikhan.png",
      desc: t("Driven, tech-focused, and optimistic about building global-impact solutions."),
    },
    {
      id: "zhanbolat" as const,
      name: "Zhanbolat",
      title: t("The Royal Scholar"),
      image: "/totems/zhanbolat.png",
      desc: t("Strategic, analytical, and relentless in academic excellence."),
    },
    {
      id: "aizere" as const,
      name: "Aizere",
      title: t("The Creative Luminary"),
      image: "/totems/aizere.png",
      desc: t("Charismatic, expressive, and passionate about community and storytelling."),
    },
    {
      id: "nurali" as const,
      name: "Nurali",
      title: t("The Determined Leader"),
      image: "/totems/nurali.png",
      desc: t("Disciplined, articulate, and dedicated to leadership and debate."),
    },
  ];

  return (
    <div className={styles.stack}>
      <p className={styles.note}>
        {t("Select an animated companion that will accompany you through your application journey, celebrating streaks and milestone accomplishments.")}
      </p>
      <div className={styles.totemGrid}>
        {options.map((item) => {
          const active = (profile.chosenTotem || "alikhan") === item.id;
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => update({ chosenTotem: item.id })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") update({ chosenTotem: item.id });
              }}
              className={`${styles.totemCard} ${active ? styles.totemCardActive : ""}`}
            >
              <Image src={item.image} alt={item.name} width={90} height={90} className={styles.totemAvatar} />
              <h3 className={styles.totemName}>{item.name}</h3>
              <span className={styles.totemTitle}>{item.title}</span>
              <p className={styles.totemDesc}>{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

