"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChipGroup, NumberField, RangeField, Segmented, SelectField, TextArea, TextField, Toggle } from "@/components/ui/fields";
import { Icon } from "@/components/ui/icon";
import { countries, regions } from "@/lib/data/universities";
import { fieldOptions } from "@/lib/engine/search";
import type { Activity, ActivityCategory, ActivityLevel, GradingSystem, StudentProfile } from "@/lib/types";
import styles from "./steps.module.css";

export interface StepProps {
  profile: StudentProfile;
  update: (patch: Partial<StudentProfile>) => void;
}

const homeCountries = ["Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Russia", "Turkey", "India", "China", "Vietnam", "Indonesia", "Nigeria", "Brazil", "United States", "United Kingdom", "Germany", "Other"];

export function BasicInfoStep({ profile, update }: StepProps) {
  return (
    <div className={styles.grid}>
      <TextField label="Full name" value={profile.fullName} onChange={(fullName) => update({ fullName })} placeholder="How should your mentor address you?" className={styles.span2} />
      <SelectField label="Country of citizenship" value={profile.country} onChange={(country) => update({ country })} options={[{ value: "", label: "Select a country" }, ...homeCountries.map((c) => ({ value: c, label: c }))]} />
      <TextField label="School" value={profile.school} onChange={(school) => update({ school })} placeholder="School name and city" />
      <NumberField label="Current grade" value={profile.grade} min={8} max={13} onChange={(grade) => update({ grade: grade ?? 11 })} />
      <NumberField label="Graduation year" value={profile.graduationYear} min={2024} max={2035} onChange={(graduationYear) => update({ graduationYear: graduationYear ?? new Date().getFullYear() + 1 })} />
      <NumberField label="Age" value={profile.age} min={12} max={25} onChange={(age) => update({ age: age ?? 17 })} />
    </div>
  );
}

const gradingOptions: { value: GradingSystem; label: string }[] = [
  { value: "gpa4", label: "GPA (4.0)" },
  { value: "five_point", label: "5-point" },
  { value: "percent", label: "Percent" },
  { value: "ib", label: "IB" },
  { value: "alevel", label: "A-Level" },
];

export function AcademicStep({ profile, update }: StepProps) {
  const gpaConfig = {
    gpa4: { label: "GPA", max: 4, step: 0.01, hint: "Unweighted, on a 4.0 scale" },
    five_point: { label: "Average grade", max: 5, step: 0.01, hint: "Common in Kazakhstan, Russia and Central Asia" },
    percent: { label: "Average percentage", max: 100, step: 0.1, hint: "Overall average across subjects" },
    ib: null,
    alevel: null,
  }[profile.gradingSystem];

  return (
    <div className={styles.stack}>
      <Segmented label="Grading system" value={profile.gradingSystem} options={gradingOptions} onChange={(gradingSystem) => update({ gradingSystem })} />
      <div className={styles.grid}>
        {gpaConfig && <NumberField label={gpaConfig.label} hint={gpaConfig.hint} value={profile.gpa} max={gpaConfig.max} min={0} step={gpaConfig.step} onChange={(gpa) => update({ gpa })} />}
        <NumberField label="IB predicted or final" hint="Out of 45" value={profile.ib} min={0} max={45} onChange={(ib) => update({ ib })} />
        <TextField label="A-Level grades" hint="e.g. A*AA" value={profile.aLevels} onChange={(aLevels) => update({ aLevels })} placeholder="A*AA" />
        <NumberField label="SAT" hint="Total out of 1600" value={profile.sat} min={400} max={1600} step={10} onChange={(sat) => update({ sat })} />
        <NumberField label="ACT" hint="Composite out of 36" value={profile.act} min={1} max={36} onChange={(act) => update({ act })} />
        <TextField label="AP courses" hint="Subjects and scores, if any" value={profile.apCourses} onChange={(apCourses) => update({ apCourses })} placeholder="Calculus BC (5), Physics C (4)" />
      </div>
    </div>
  );
}

export function EnglishStep({ profile, update }: StepProps) {
  return (
    <div className={styles.stack}>
      <p className={styles.note}>Add any test you have taken. Leave the others empty — we convert between them automatically.</p>
      <div className={styles.grid3}>
        <NumberField label="IELTS Academic" hint="0–9" value={profile.ielts} min={0} max={9} step={0.5} onChange={(ielts) => update({ ielts })} />
        <NumberField label="TOEFL iBT" hint="0–120" value={profile.toefl} min={0} max={120} onChange={(toefl) => update({ toefl })} />
        <NumberField label="Duolingo English Test" hint="10–160" value={profile.duolingo} min={10} max={160} step={5} onChange={(duolingo) => update({ duolingo })} />
      </div>
    </div>
  );
}

export function InterestsStep({ profile, update }: StepProps) {
  return (
    <div className={styles.stack}>
      <ChipGroup label="Fields you want to study" hint="Choose up to three" options={fieldOptions} selected={profile.fields} onChange={(fields) => update({ fields: fields.slice(-3) })} />
      <TextArea label="What specifically excites you?" hint="Topics, problems or questions — this powers professor matching" value={profile.interestsNote} onChange={(interestsNote) => update({ interestsNote })} placeholder="e.g. computer vision for medical imaging, climate modelling, fintech for small businesses" />
    </div>
  );
}

const categories: ActivityCategory[] = ["Competition", "Olympiad", "Research", "Project", "Startup", "Leadership", "Volunteering", "Internship", "Sports", "Club", "Award"];
const levels: { value: ActivityLevel; label: string }[] = [
  { value: "school", label: "School" },
  { value: "city", label: "City" },
  { value: "national", label: "National" },
  { value: "international", label: "International" },
];

function blankActivity(): Activity {
  return { id: `act-${Date.now().toString(36)}`, category: "Project", title: "", role: "", level: "school", impact: "", evidence: "", link: "", hoursPerWeek: 3 };
}

export function ActivitiesStep({ profile, update }: StepProps) {
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
              <span className="eyebrow">Activity {index + 1}</span>
              <button type="button" className={styles.remove} onClick={() => update({ activities: profile.activities.filter((a) => a.id !== activity.id) })}>
                Remove
              </button>
            </div>
            <div className={styles.grid}>
              <SelectField label="Category" value={activity.category} options={categories.map((c) => ({ value: c, label: c }))} onChange={(category) => setActivity(activity.id, { category })} />
              <SelectField label="Level" value={activity.level} options={levels} onChange={(level) => setActivity(activity.id, { level })} />
              <TextField label="Title" value={activity.title} onChange={(title) => setActivity(activity.id, { title })} placeholder="International Olympiad in Informatics" />
              <TextField label="Your role" value={activity.role} onChange={(role) => setActivity(activity.id, { role })} placeholder="Founder, captain, participant…" />
              <TextArea label="Impact" value={activity.impact} onChange={(impact) => setActivity(activity.id, { impact })} placeholder="What changed because of you? Use numbers where you can." className={styles.span2} />
              <TextField label="Evidence" value={activity.evidence} onChange={(evidence) => setActivity(activity.id, { evidence })} placeholder="Certificate, article, repository" />
              <TextField label="Link" type="url" value={activity.link} onChange={(link) => setActivity(activity.id, { link })} placeholder="https://" />
              <NumberField label="Hours per week" value={activity.hoursPerWeek} min={0} max={40} onChange={(hoursPerWeek) => setActivity(activity.id, { hoursPerWeek: hoursPerWeek ?? 0 })} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <Button type="button" variant="ghost" onClick={() => update({ activities: [...profile.activities, blankActivity()] })}>
        <Icon name="plus" size={16} />
        Add activity
      </Button>
      {profile.activities.length === 0 && <p className={styles.note}>Competitions, olympiads, research, projects, startups, leadership, volunteering, internships, sports, clubs and awards all count.</p>}
    </div>
  );
}

const usd = (value: number) => (value >= 100000 ? "$100k+" : `$${Math.round(value / 1000)}k`);

export function FinancialStep({ profile, update }: StepProps) {
  return (
    <div className={styles.stack}>
      <RangeField label="Annual family budget for tuition and living" value={profile.annualBudgetUsd} min={0} max={100000} step={1000} format={usd} onChange={(annualBudgetUsd) => update({ annualBudgetUsd })} />
      <div className={styles.grid}>
        <RangeField label="Preferred tuition — minimum" value={profile.tuitionRange[0]} min={0} max={80000} step={1000} format={usd} onChange={(min) => update({ tuitionRange: [Math.min(min, profile.tuitionRange[1]), profile.tuitionRange[1]] })} />
        <RangeField label="Preferred tuition — maximum" value={profile.tuitionRange[1]} min={0} max={80000} step={1000} format={usd} onChange={(max) => update({ tuitionRange: [profile.tuitionRange[0], Math.max(max, profile.tuitionRange[0])] })} />
      </div>
      <Toggle label="I will need need-based financial aid" hint="Some universities meet full need for international students" checked={profile.needsAid} onChange={(needsAid) => update({ needsAid })} />
      <Toggle label="A scholarship is required for me to enrol" checked={profile.scholarshipRequired} onChange={(scholarshipRequired) => update({ scholarshipRequired })} />
    </div>
  );
}

export function PreferencesStep({ profile, update }: StepProps) {
  return (
    <div className={styles.stack}>
      <ChipGroup label="Countries" options={countries} selected={profile.preferredCountries} onChange={(preferredCountries) => update({ preferredCountries })} />
      <ChipGroup label="Regions" options={regions} selected={profile.preferredRegions} onChange={(preferredRegions) => update({ preferredRegions })} />
      <Segmented
        label="Campus"
        value={profile.campusType}
        options={[
          { value: "any", label: "Any" },
          { value: "urban", label: "Urban" },
          { value: "suburban", label: "Suburban" },
          { value: "rural", label: "Rural" },
        ]}
        onChange={(campusType) => update({ campusType })}
      />
      <div className={styles.grid}>
        <Segmented
          label="Institution"
          value={profile.institutionType}
          options={[
            { value: "any", label: "Any" },
            { value: "public", label: "Public" },
            { value: "private", label: "Private" },
          ]}
          onChange={(institutionType) => update({ institutionType })}
        />
        <Segmented
          label="Size"
          value={profile.size}
          options={[
            { value: "any", label: "Any" },
            { value: "small", label: "Small" },
            { value: "medium", label: "Medium" },
            { value: "large", label: "Large" },
          ]}
          onChange={(size) => update({ size })}
        />
      </div>
    </div>
  );
}

export function CareerStep({ profile, update }: StepProps) {
  return (
    <div className={styles.stack}>
      <TextArea label="Where do you see yourself after university?" value={profile.careerGoal} onChange={(careerGoal) => update({ careerGoal })} placeholder="e.g. Machine learning engineer at a healthcare company, founding a startup, working in public policy" />
      <Segmented
        label="Graduate school"
        value={profile.gradSchool}
        options={[
          { value: "phd", label: "PhD" },
          { value: "masters", label: "Master's" },
          { value: "undecided", label: "Undecided" },
          { value: "none", label: "Not planning" },
        ]}
        onChange={(gradSchool) => update({ gradSchool })}
      />
    </div>
  );
}
