"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Mail, MessageSquare, Sparkles } from "lucide-react";
import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { DataTag } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Meter } from "@/components/ui/progress";
import { SourceNote } from "@/components/ui/source-note";
import { ProfessorEmailModal } from "@/components/professors/professor-email-modal";
import { professors, researchAreas } from "@/lib/data/professors";
import { getUniversity } from "@/lib/data/universities";
import { interestAreas, matchProfessors } from "@/lib/engine/discovery";
import { useApp } from "@/lib/store/app-store";
import type { Professor } from "@/lib/types";
import styles from "./professors.module.css";
import { useT } from "@/lib/i18n/use-t";

export default function ProfessorsPage() {
  const t = useT();
  const { profile } = useApp();
  const [query, setQuery] = useState("");
  const [activeModalProf, setActiveModalProf] = useState<{ prof: Professor; uniName: string } | null>(null);

  const results = useMemo(() => matchProfessors(profile, query, professors), [profile, query]);
  const interests = useMemo(() => interestAreas(profile), [profile]);

  return (
    <Page>
      <PageHeader
        eyebrow={t("Professor discovery")}
        title={t("Find people doing the research you care about")}
        description={t("Research fit compares each professor's areas with your fields, interests and projects. Reach out directly using our AI Cold Email Assistant.")}
      />

      <Reveal>
        <div className={`glass ${styles.search}`}>
          <Icon name="search" className={styles.icon} />
          <input
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search by research area, name or department — e.g. computer vision")}
            aria-label={t("Search professors")}
            list="research-areas"
          />
          <datalist id="research-areas">
            {researchAreas.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>
        <div className={styles.areas}>
          <span className="faint">{t("Your interest areas:")}</span>
          {interests.length ? (
            interests.slice(0, 8).map((a) => (
              <button key={a} type="button" className={styles.area} onClick={() => setQuery(a)}>
                {a}
              </button>
            ))
          ) : (
            <span className="faint">{t("Add fields and interests to your profile to rank by fit.")}</span>
          )}
        </div>
      </Reveal>

      <div className={styles.grid}>
        {results.map(({ professor, fit, matchedAreas }) => {
          const university = getUniversity(professor.universitySlug);
          return (
            <Reveal key={professor.id}>
              <article className={`glass ${styles.card}`}>
                <header className={styles.head}>
                  <div>
                    <h2 className={styles.name}>{professor.name}</h2>
                    <p className="muted">{t(professor.department)}</p>
                    {university && (
                      <Link href={`/universities/${university.slug}`} className={styles.uni}>
                        {university.name}
                      </Link>
                    )}
                    <div className={styles.emailRow}>
                      <Mail size={12} />
                      <span>{professor.email}</span>
                    </div>
                  </div>
                  <div className={styles.fit}>
                    <span className="tabular">{fit}%</span>
                    <span className="faint">{t("fit")}</span>
                  </div>
                </header>

                <Meter value={fit} tone="green" label={t("Research fit {fit}%", { fit: fit })} />

                <ul className={styles.tags}>
                  {professor.areas.map((a) => (
                    <li key={a} className={matchedAreas.includes(a) ? styles.tagMatch : undefined}>
                      {t(a)}
                    </li>
                  ))}
                </ul>

                <div className={styles.outreachRow}>
                  <button
                    type="button"
                    className={styles.draftBtn}
                    onClick={() => setActiveModalProf({ prof: professor, uniName: university?.name || "Global University" })}
                  >
                    <Sparkles size={13} />
                    <span>{t("Draft Cold Message")}</span>
                  </button>
                  <Link
                    href={`/messages?recipientId=${professor.id}&recipientName=${encodeURIComponent(
                      professor.name
                    )}&recipientRole=professor&recipientAffiliation=${encodeURIComponent(
                      university?.name || professor.department
                    )}`}
                    className={styles.chatBtn}
                    title={t("Chat with Professor")}
                  >
                    <MessageSquare size={13} />
                  </Link>
                </div>

                <footer className={styles.footer}>
                  <a href={professor.publicationsNote} target="_blank" rel="noreferrer" className={styles.pubs}>
                    {t("Publications on DBLP")} <Icon name="external" size={13} />
                  </a>
                  <DataTag kind="rules" label={t("Fit score")} />
                </footer>
                <SourceNote data={{ ...professor.profile, status: "needs_verification" }} compact />
              </article>
            </Reveal>
          );
        })}
      </div>
      {results.length === 0 && <p className="muted">{t("No professors in the catalog match “{query}”.", { query })}</p>}

      {activeModalProf && (
        <ProfessorEmailModal
          professor={activeModalProf.prof}
          universityName={activeModalProf.uniName}
          profile={profile}
          isOpen={true}
          onClose={() => setActiveModalProf(null)}
        />
      )}
    </Page>
  );
}
