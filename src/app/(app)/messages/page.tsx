"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Send, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import clsx from "clsx";
import { Page, PageHeader } from "@/components/layout/page";
import { useApp } from "@/lib/store/app-store";
import { getSupabase } from "@/lib/supabase/client";
import type { ChatMessage, ChatRole, Conversation } from "@/lib/types";
import styles from "./messages.module.css";
import { useT } from "@/lib/i18n/use-t";

const DEFAULT_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-mentor-sarah",
    recipientId: "sarah-admissions",
    recipientName: "Sarah Jenkins",
    recipientRole: "mentor",
    recipientAvatar: "S",
    recipientAffiliation: "Former Harvard Admissions Committee / Ivy Strategist",
    lastMessage: "Review your extracurricular spike before finalizing regular decision essays.",
    lastMessageAt: "10:30 AM",
    unreadCount: 1,
  },
  {
    id: "conv-alumni-dias",
    recipientId: "dias-mit",
    recipientName: "Dias Kenes",
    recipientRole: "alumni",
    recipientAvatar: "D",
    recipientAffiliation: "MIT EECS '27 · NIS Almaty Alum",
    lastMessage: "Happy to look over your research paper draft for CSAIL lab inquiries!",
    lastMessageAt: "Yesterday",
    unreadCount: 0,
  },
  {
    id: "conv-alumni-madina",
    recipientId: "madina-stanford",
    recipientName: "Madina Akhmetova",
    recipientRole: "alumni",
    recipientAvatar: "M",
    recipientAffiliation: "Stanford Bioengineering '26 · Bolashak & Need-Based Scholar",
    lastMessage: "Make sure you clearly explain your lab hours in the Common App activities section.",
    lastMessageAt: "2 days ago",
    unreadCount: 0,
  },
  {
    id: "conv-prof-feifei",
    recipientId: "feifei",
    recipientName: "Prof. Fei-Fei Li",
    recipientRole: "professor",
    recipientAvatar: "F",
    recipientAffiliation: "Stanford University · Computer Science & HAI",
    lastMessage: "Thank you for sharing your crop disease detection app repository.",
    lastMessageAt: "Sep 15",
    unreadCount: 0,
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  "conv-mentor-sarah": [
    {
      id: "m1",
      conversationId: "conv-mentor-sarah",
      senderId: "sarah-admissions",
      senderRole: "mentor",
      senderName: "Sarah Jenkins",
      content: "Hello! I reviewed your profile diagnostics. Your math and competition spike is impressive.",
      createdAt: "10:15 AM",
    },
    {
      id: "m2",
      conversationId: "conv-mentor-sarah",
      senderId: "sarah-admissions",
      senderRole: "mentor",
      senderName: "Sarah Jenkins",
      content: "Review your extracurricular spike before finalizing regular decision essays. Let me know if you need feedback on your personal statement.",
      createdAt: "10:30 AM",
    },
  ],
  "conv-alumni-dias": [
    {
      id: "m3",
      conversationId: "conv-alumni-dias",
      senderId: "dias-mit",
      senderRole: "alumni",
      senderName: "Dias Kenes",
      content: "Salem! Saw you're preparing for IOI and US college admissions from Kazakhstan. Feel free to ask about MIT life or dorm culture!",
      createdAt: "Yesterday",
    },
  ],
  "conv-alumni-madina": [
    {
      id: "m4",
      conversationId: "conv-alumni-madina",
      senderId: "madina-stanford",
      senderRole: "alumni",
      senderName: "Madina Akhmetova",
      content: "Make sure you clearly explain your lab hours in the Common App activities section.",
      createdAt: "2 days ago",
    },
  ],
  "conv-prof-feifei": [
    {
      id: "m5",
      conversationId: "conv-prof-feifei",
      senderId: "feifei",
      senderRole: "professor",
      senderName: "Prof. Fei-Fei Li",
      content: "Thank you for reaching out regarding our lab's vision research. We welcome enthusiastic prospective researchers.",
      createdAt: "Sep 15",
    },
  ],
};

export default function MessagesPage() {
  const t = useT();
  const { user, profile } = useApp();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>(DEFAULT_CONVERSATIONS);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [activeConvId, setActiveConvId] = useState<string>("conv-mentor-sarah");
  const [inputText, setInputText] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | ChatRole>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const qRecipientId = searchParams.get("recipientId");
    const qRecipientName = searchParams.get("recipientName");
    const qRecipientRole = searchParams.get("recipientRole") as ChatRole;
    const qRecipientAffil = searchParams.get("recipientAffiliation");

    if (qRecipientId && qRecipientName) {
      const existing = conversations.find((c) => c.recipientId === qRecipientId);
      if (existing) {
        setActiveConvId(existing.id);
      } else {
        const newConvId = `conv-${qRecipientId}-${Date.now()}`;
        const newConv: Conversation = {
          id: newConvId,
          recipientId: qRecipientId,
          recipientName: qRecipientName,
          recipientRole: qRecipientRole || "professor",
          recipientAvatar: qRecipientName.charAt(0),
          recipientAffiliation: qRecipientAffil || "Admissions Network",
          lastMessage: "Conversation initiated",
          lastMessageAt: "Just now",
          unreadCount: 0,
        };
        setConversations((prev) => [newConv, ...prev]);
        setMessagesMap((prev) => ({
          ...prev,
          [newConvId]: [
            {
              id: `m-init-${Date.now()}`,
              conversationId: newConvId,
              senderId: qRecipientId,
              senderRole: qRecipientRole || "professor",
              senderName: qRecipientName,
              content: `Hello! I received your inquiry from Meridian Guide. Feel free to share your questions or research proposal.`,
              createdAt: "Just now",
            },
          ],
        }));
        setActiveConvId(newConvId);
      }
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            sender_role: ChatRole;
            sender_name: string;
            content: string;
            created_at: string;
          };

          if (newMsg && newMsg.conversation_id) {
            setMessagesMap((prev) => {
              const currentList = prev[newMsg.conversation_id] || [];
              if (currentList.some((m) => m.id === newMsg.id)) return prev;
              return {
                ...prev,
                [newMsg.conversation_id]: [
                  ...currentList,
                  {
                    id: newMsg.id,
                    conversationId: newMsg.conversation_id,
                    senderId: newMsg.sender_id,
                    senderRole: newMsg.sender_role,
                    senderName: newMsg.sender_name,
                    content: newMsg.content,
                    createdAt: new Date(newMsg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  },
                ],
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesMap, activeConvId]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);
  const activeMessages = messagesMap[activeConvId] || [];

  const filteredConversations = useMemo(() => {
    if (roleFilter === "all") return conversations;
    return conversations.filter((c) => c.recipientRole === roleFilter);
  }, [conversations, roleFilter]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText("");

    const newMsgId = `m-${Date.now()}`;
    const myMsg: ChatMessage = {
      id: newMsgId,
      conversationId: activeConvId,
      senderId: user?.id || "student-self",
      senderRole: "student",
      senderName: profile.fullName || "Student",
      content,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), myMsg],
    }));

    setConversations((prev) =>
      prev.map((c) => (c.id === activeConvId ? { ...c, lastMessage: content, lastMessageAt: "Just now" } : c))
    );

    const supabase = getSupabase();
    if (supabase && user?.mode === "supabase") {
      try {
        await supabase.from("messages").insert({
          id: newMsgId,
          conversation_id: activeConvId,
          sender_id: user.id,
          sender_role: "student",
          sender_name: profile.fullName || "Student",
          content,
          created_at: new Date().toISOString(),
        });
      } catch {}
    }

    if (activeConversation) {
      setTimeout(() => {
        const replyName = activeConversation.recipientName;
        const replyRole = activeConversation.recipientRole;
        const replyContent =
          replyRole === "professor"
            ? `Thank you for your message. I have noted your interest in our lab's research and will review your profile credentials.`
            : replyRole === "mentor"
            ? `Great question! Focus on quantifying your concrete leadership outcomes. That will make a significant impact on your application.`
            : `Totally agree! When I applied from Kazakhstan, emphasizing independent initiative made the biggest difference in admissions.`;

        const replyMsg: ChatMessage = {
          id: `reply-${Date.now()}`,
          conversationId: activeConvId,
          senderId: activeConversation.recipientId,
          senderRole: replyRole,
          senderName: replyName,
          content: replyContent,
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessagesMap((prev) => ({
          ...prev,
          [activeConvId]: [...(prev[activeConvId] || []), replyMsg],
        }));

        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId ? { ...c, lastMessage: replyContent, lastMessageAt: "Just now" } : c
          )
        );
      }, 1200);
    }
  };

  const getAvatarClass = (role: ChatRole) => {
    if (role === "professor") return styles.avatarProfessor;
    if (role === "mentor") return styles.avatarMentor;
    return styles.avatarAlumni;
  };

  const getBadgeClass = (role: ChatRole) => {
    if (role === "professor") return styles.badgeProfessor;
    if (role === "mentor") return styles.badgeMentor;
    return styles.badgeAlumni;
  };

  return (
    <Page>
      <PageHeader
        eyebrow={t("Real-Time Communications")}
        title={t("Mentors, Alumni & Professor Network")}
        description={t("Direct, secure real-time messaging with university alumni, admissions advisors, and world-class faculty via Supabase Realtime.")}
      />

      <div className={styles.chatLayout}>
        <aside className={styles.conversationsPanel}>
          <div className={styles.conversationsHeader}>
            <h2 className={styles.conversationsTitle}>{t("Messages")}</h2>
            <div className={styles.roleFilterTabs}>
              <button
                type="button"
                className={clsx(styles.roleFilterBtn, roleFilter === "all" && styles.roleFilterBtnActive)}
                onClick={() => setRoleFilter("all")}
              >
                {t("All")}
              </button>
              <button
                type="button"
                className={clsx(styles.roleFilterBtn, roleFilter === "mentor" && styles.roleFilterBtnActive)}
                onClick={() => setRoleFilter("mentor")}
              >
                {t("Mentors")}
              </button>
              <button
                type="button"
                className={clsx(styles.roleFilterBtn, roleFilter === "alumni" && styles.roleFilterBtnActive)}
                onClick={() => setRoleFilter("alumni")}
              >
                {t("Alumni")}
              </button>
              <button
                type="button"
                className={clsx(styles.roleFilterBtn, roleFilter === "professor" && styles.roleFilterBtnActive)}
                onClick={() => setRoleFilter("professor")}
              >
                {t("Professors")}
              </button>
            </div>
          </div>

          <ul className={styles.conversationsList}>
            {filteredConversations.map((conv) => (
              <li
                key={conv.id}
                role="button"
                tabIndex={0}
                className={clsx(
                  styles.conversationItem,
                  conv.id === activeConvId && styles.conversationItemActive
                )}
                onClick={() => setActiveConvId(conv.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setActiveConvId(conv.id);
                }}
              >
                <div className={clsx(styles.avatar, getAvatarClass(conv.recipientRole))}>
                  {conv.recipientAvatar}
                </div>
                <div className={styles.convMeta}>
                  <div className={styles.convHead}>
                    <span className={styles.convName}>{conv.recipientName}</span>
                    <span className={clsx(styles.roleBadge, getBadgeClass(conv.recipientRole))}>
                      {conv.recipientRole}
                    </span>
                  </div>
                  <span className={styles.convSnippet}>{conv.lastMessage}</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <section className={styles.chatWindow}>
          {activeConversation ? (
            <>
              <header className={styles.chatHeader}>
                <div className={styles.chatHeaderUser}>
                  <div
                    className={clsx(
                      styles.avatar,
                      getAvatarClass(activeConversation.recipientRole)
                    )}
                  >
                    {activeConversation.recipientAvatar}
                  </div>
                  <div>
                    <h3 className={styles.chatHeaderName}>
                      {activeConversation.recipientName}
                    </h3>
                    <p className={styles.chatHeaderAffil}>
                      {activeConversation.recipientAffiliation}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-green-ink font-mono font-bold bg-green-soft px-2.5 py-1 rounded-full">
                  <ShieldCheck size={12} />
                  <span>Verified Identity</span>
                </div>
              </header>

              <div className={styles.messagesList}>
                {activeMessages.map((msg) => {
                  const isOwn = msg.senderRole === "student";
                  return (
                    <div
                      key={msg.id}
                      className={clsx(
                        styles.messageRow,
                        isOwn ? styles.messageRowOwn : styles.messageRowOther
                      )}
                    >
                      <span className={styles.messageSender}>
                        {isOwn ? "You" : msg.senderName}
                      </span>
                      <div
                        className={clsx(
                          styles.messageBubble,
                          isOwn ? styles.bubbleOwn : styles.bubbleOther
                        )}
                      >
                        {msg.content}
                      </div>
                      <span className={styles.messageTime}>{msg.createdAt}</span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form className={styles.inputArea} onSubmit={handleSend}>
                <input
                  className={styles.chatInput}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Write a message to ${activeConversation.recipientName}…`}
                />
                <button
                  type="submit"
                  className={styles.sendBtn}
                  disabled={!inputText.trim()}
                  aria-label="Send message"
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          ) : (
            <div className={styles.emptyChat}>
              <MessageSquare size={36} />
              <p>Select a conversation to begin messaging</p>
            </div>
          )}
        </section>
      </div>
    </Page>
  );
}
