"use client";

import { useMemo, useState } from "react";
import { Calendar, Clock, ExternalLink, Globe, MapPin, Sparkles, Users } from "lucide-react";
import clsx from "clsx";
import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { useToast } from "@/components/ui/toast";
import type { UpcomingEvent } from "@/lib/types";
import styles from "./events.module.css";
import { useT } from "@/lib/i18n/use-t";

const UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    id: "ev-1",
    title: "Ivy League & Top 30 US Universities Fair - Central Asia",
    organizer: "US Education Group & Meridian Guide",
    date: "2026-09-28",
    time: "18:00 - 21:00 UTC+5",
    format: "virtual",
    location: "Zoom Virtual Auditorium",
    category: "fair",
    link: "https://admissions.fair.org",
    description: "Connect with admissions deans from Harvard, Princeton, Columbia, and Dartmouth. Dedicated Q&A on financial aid for Central Asian applicants.",
    attendeeCount: 1420,
  },
  {
    id: "ev-2",
    title: "Astana IT University International Hackathon 2026",
    organizer: "Astana IT University & Tech Hub",
    date: "2026-10-05",
    time: "09:00 - 19:00",
    format: "in_person",
    location: "EXPO C1 Building, Astana, Kazakhstan",
    category: "hackathon",
    link: "https://hackathon.astanait.edu.kz",
    description: "48-hour build sprint focusing on AI applications in education, healthcare, and renewable energy. Direct internship awards for winners.",
    attendeeCount: 480,
  },
  {
    id: "ev-3",
    title: "MIT CSAIL & Stanford CS Masterclass: Writing Research Statements",
    organizer: "Meridian Senior Advisory Board",
    date: "2026-10-12",
    time: "19:00 - 20:30 UTC+5",
    format: "virtual",
    location: "Interactive Stream & Discord Lab",
    category: "masterclass",
    link: "https://meridian.guide/masterclass",
    description: "Learn how high school applicants craft cold outreach messages and publish preprints that catch the attention of top computer science faculty.",
    attendeeCount: 890,
  },
  {
    id: "ev-4",
    title: "Almaty Regional STEM & Olympiad Collegiate Showcase",
    organizer: "Daryn & Almaty Education Directorate",
    date: "2026-10-20",
    time: "11:00 - 16:00",
    format: "in_person",
    location: "Palace of Students, Almaty, Kazakhstan",
    category: "fair",
    link: "https://stemfair.kz",
    description: "Meet international university delegates, test preparation coaches, and international scholarship alumni from NIS and Bilim-Innovation.",
    attendeeCount: 2200,
  },
  {
    id: "ev-5",
    title: "DAAD & European Full-Tuition Scholarship Webinar",
    organizer: "DAAD Information Centre Almaty",
    date: "2026-10-29",
    time: "17:00 - 18:30 UTC+5",
    format: "virtual",
    location: "Webinar Jam & Live Translation",
    category: "webinar",
    link: "https://daad.de/webinar",
    description: "Step-by-step application walkthrough for German and European government full-ride scholarships for undergraduate and graduate studies.",
    attendeeCount: 640,
  },
];

type CategoryFilter = "all" | UpcomingEvent["category"];
type FormatFilter = "all" | UpcomingEvent["format"];

export default function EventsPage() {
  const t = useT();
  const { notify } = useToast();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("all");

  const filteredEvents = useMemo(() => {
    return UPCOMING_EVENTS.filter((e) => {
      const matchCat = categoryFilter === "all" || e.category === categoryFilter;
      const matchFmt = formatFilter === "all" || e.format === formatFilter;
      return matchCat && matchFmt;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [categoryFilter, formatFilter]);

  const handleAddToCalendar = (event: UpcomingEvent) => {
    notify({
      tone: "success",
      title: t("Added to Calendar"),
      body: t("{title} on {date} has been added to your calendar reminders.", {
        title: event.title,
        date: event.date,
      }),
    });
  };

  const formatMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", { month: "short" });
  };

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getDate();
  };

  return (
    <Page>
      <PageHeader
        eyebrow={t("Upcoming Opportunities")}
        title={t("University Fairs, Hackathons & Masterclasses")}
        description={t("Live admissions info sessions, hackathons, and scholarship workshops sorted chronologically. Participate to strengthen your extracurricular profile and connect with university representatives.")}
      />

      <Reveal>
        <div className={styles.filtersBar}>
          <div className={styles.categoriesGroup}>
            {(["all", "fair", "hackathon", "masterclass", "webinar"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                className={clsx(styles.filterBtn, categoryFilter === cat && styles.filterBtnActive)}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === "all" ? t("All Events") : t(cat.charAt(0).toUpperCase() + cat.slice(1) + "s")}
              </button>
            ))}
          </div>

          <div className={styles.formatToggle}>
            <button
              type="button"
              className={clsx(styles.formatBtn, formatFilter === "all" && styles.formatBtnActive)}
              onClick={() => setFormatFilter("all")}
            >
              {t("All Formats")}
            </button>
            <button
              type="button"
              className={clsx(styles.formatBtn, formatFilter === "virtual" && styles.formatBtnActive)}
              onClick={() => setFormatFilter("virtual")}
            >
              {t("Virtual")}
            </button>
            <button
              type="button"
              className={clsx(styles.formatBtn, formatFilter === "in_person" && styles.formatBtnActive)}
              onClick={() => setFormatFilter("in_person")}
            >
              {t("In-Person")}
            </button>
          </div>
        </div>
      </Reveal>

      <div className={styles.grid}>
        {filteredEvents.map((event) => (
          <Reveal key={event.id}>
            <article className={styles.card}>
              <header className={styles.cardHead}>
                <div className={styles.dateBadge}>
                  <span className={styles.dateDay}>{formatDay(event.date)}</span>
                  <span className={styles.dateMonth}>{formatMonth(event.date)}</span>
                </div>
                <div className={styles.badgesGroup}>
                  <span className={styles.categoryTag}>{event.category}</span>
                  <span className={styles.formatTag}>
                    {event.format === "virtual" ? <Globe size={11} /> : <MapPin size={11} />}
                    <span>{event.format === "virtual" ? t("Virtual") : t("In-Person")}</span>
                  </span>
                </div>
              </header>

              <div>
                <h3 className={styles.eventTitle}>{event.title}</h3>
                <p className={styles.organizer}>{event.organizer}</p>
              </div>

              <p className={styles.eventDesc}>{event.description}</p>

              <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <Clock size={12} />
                  <span>{event.time}</span>
                </div>
                <div className={styles.metaItem}>
                  <MapPin size={12} />
                  <span>{event.location}</span>
                </div>
                <div className={styles.metaItem}>
                  <Users size={12} />
                  <span>{t("{count} students registered", { count: event.attendeeCount })}</span>
                </div>
              </div>

              <footer className={styles.cardFoot}>
                <button
                  type="button"
                  className={styles.calendarBtn}
                  onClick={() => handleAddToCalendar(event)}
                >
                  <Calendar size={13} />
                  <span>{t("Add to Calendar")}</span>
                </button>
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.registerLink}
                >
                  <span>{t("Event Details")}</span>
                  <ExternalLink size={12} />
                </a>
              </footer>
            </article>
          </Reveal>
        ))}
      </div>
    </Page>
  );
}
