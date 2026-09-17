"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Folder,
  FileText,
  Check,
  X,
  Globe,
  Upload,
  Trash2,
  Landmark,
  Briefcase,
  FileCheck,
  Shield,
  Plus,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { useI18n } from "@/components/i18n/i18n-context";
import type { DocumentCategory, DocumentStatus, VaultDocument } from "@/lib/types";

const folderCategories: { key: DocumentCategory; label: string }[] = [
  { key: "passport", label: "Passports & Identity" },
  { key: "bank_statement", label: "Bank Statements" },
  { key: "family_income", label: "Family Income" },
  { key: "tax", label: "Tax Payers Documents" },
  { key: "insurance", label: "Health Insurance" },
];

function getCategoryIcon(key: DocumentCategory) {
  switch (key) {
    case "passport":
      return <Shield size={16} className="text-[#589C80]" />;
    case "bank_statement":
      return <Landmark size={16} className="text-[#589C80]" />;
    case "family_income":
      return <Briefcase size={16} className="text-[#589C80]" />;
    case "tax":
      return <FileCheck size={16} className="text-[#589C80]" />;
    case "insurance":
      return <Shield size={16} className="text-[#589C80]" />;
    default:
      return <FileText size={16} className="text-[#589C80]" />;
  }
}

export function DocumentVault() {
  const { documents, addVaultDocument, updateVaultDocument, removeVaultDocument } = useApp();
  const { t } = useI18n();

  const [activeCategory, setActiveCategory] = useState<"all" | DocumentCategory>("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<DocumentCategory>("passport");
  const [newDocStatus, setNewDocStatus] = useState<DocumentStatus>("missing");
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs =
    activeCategory === "all"
      ? documents
      : documents.filter((d) => d.category === activeCategory);

  const verifiedCount = documents.filter((d) => d.status === "verified").length;
  const totalCount = documents.length || 1;
  const compliancePercentage = Math.round((verifiedCount / totalCount) * 100);

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const newDoc: VaultDocument = {
      id: `doc-${Date.now()}`,
      name: newDocName.trim(),
      category: newDocCategory,
      status: newDocStatus,
      fileName: `${newDocName.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileSize: "1.4 MB",
      uploadedAt: new Date().toISOString().split("T")[0],
    };

    addVaultDocument(newDoc);
    setNewDocName("");
    setShowUploadModal(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const lower = file.name.toLowerCase();

      let detectedCategory: DocumentCategory = "family_income";
      if (lower.includes("pass") || lower.includes("id")) detectedCategory = "passport";
      else if (lower.includes("bank") || lower.includes("statement")) detectedCategory = "bank_statement";
      else if (lower.includes("tax")) detectedCategory = "tax";
      else if (lower.includes("insur") || lower.includes("med")) detectedCategory = "insurance";

      const newDoc: VaultDocument = {
        id: `doc-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        category: detectedCategory,
        status: "verified",
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString().split("T")[0],
      };

      addVaultDocument(newDoc);
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "verified":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#589C80]/20 text-[#589C80] border border-[#589C80]/40 flex items-center gap-1.5">
            <Check size={12} />
            <span>{t.common.verified}</span>
          </span>
        );
      case "missing":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-red-950/30 text-red-400 border border-red-800/40 flex items-center gap-1.5">
            <X size={12} />
            <span>{t.common.missing}</span>
          </span>
        );
      case "needs_translation":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#EBAE29]/20 text-[#EBAE29] border border-[#EBAE29]/40 flex items-center gap-1.5">
            <Globe size={12} />
            <span>{t.common.needsTranslation}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-[#132228]/85 border border-[#589C80]/30 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Folder size={22} className="text-[#589C80]" />
            <h2 className="text-xl font-bold tracking-tight text-[#F5EED2]">
              {t.documents.title}
            </h2>
          </div>
          <p className="text-xs text-[#F5EED2]/70 max-w-xl">
            {t.documents.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-[#589C80] to-[#EBAE29] text-[#132228] hover:brightness-110 shadow-lg cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus size={14} />
          <span>{t.common.upload}</span>
        </button>
      </div>

      <div className="p-6 rounded-3xl bg-[#132228]/85 border border-[#589C80]/30 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-mono uppercase tracking-wider text-[#589C80] font-bold">
            {t.documents.complianceScore}
          </span>
          <h3 className="text-2xl font-bold text-[#F5EED2]">
            {compliancePercentage}% Visa & Compliance Clearance
          </h3>
          <p className="text-xs text-[#F5EED2]/70 max-w-lg leading-relaxed">
            {t.documents.readyForVisa}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="w-20 h-20 rounded-full border-4 border-[#589C80] bg-[#132228] flex flex-col items-center justify-center text-center shadow-inner">
            <span className="text-xl font-extrabold font-mono text-[#EBAE29]">
              {verifiedCount}/{documents.length}
            </span>
            <span className="text-[9px] font-mono text-[#F5EED2]/60 uppercase">
              Verified
            </span>
          </div>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2 ${
          dragOver
            ? "border-[#EBAE29] bg-[#EBAE29]/10"
            : "border-[#589C80]/30 bg-[#132228]/50 hover:border-[#589C80]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const file = e.target.files[0];
              const newDoc: VaultDocument = {
                id: `doc-${Date.now()}`,
                name: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
                category: activeCategory === "all" ? "passport" : activeCategory,
                status: "verified",
                fileName: file.name,
                fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                uploadedAt: new Date().toISOString().split("T")[0],
              };
              addVaultDocument(newDoc);
            }
          }}
        />
        <div className="flex justify-center">
          <Upload size={32} className="text-[#589C80]" />
        </div>
        <p className="text-sm font-semibold text-[#F5EED2]">
          {t.documents.dropPrompt}
        </p>
        <p className="text-xs font-mono text-[#589C80]">
          Auto-categorization into structural compliance folders (PDF, JPG, PNG up to 25MB)
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
            activeCategory === "all"
              ? "bg-[#589C80] text-[#132228] shadow-md"
              : "bg-[#132228]/60 text-[#F5EED2]/70 hover:text-[#F5EED2] border border-[#589C80]/20"
          }`}
        >
          {t.documents.allFiles} ({documents.length})
        </button>

        {folderCategories.map((cat) => {
          const count = documents.filter((d) => d.category === cat.key).length;
          const active = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                active
                  ? "bg-[#589C80] text-[#132228] shadow-md"
                  : "bg-[#132228]/60 text-[#F5EED2]/70 hover:text-[#F5EED2] border border-[#589C80]/20"
              }`}
            >
              {getCategoryIcon(cat.key)}
              <span>{cat.label}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filteredDocs.map((doc) => {
          const catMeta = folderCategories.find((c) => c.key === doc.category);
          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-[#132228]/85 border border-[#589C80]/30 hover:border-[#EBAE29] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg backdrop-blur-xl"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#132228] border border-[#589C80]/30 shrink-0">
                  {getCategoryIcon(doc.category)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#589C80]">
                      {catMeta?.label}
                    </span>
                    {doc.uploadedAt && (
                      <span className="text-[10px] font-mono text-[#F5EED2]/50">
                        • Uploaded {doc.uploadedAt}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-[#F5EED2]">{doc.name}</h4>
                  {doc.fileName && (
                    <p className="text-xs font-mono text-[#F5EED2]/60">
                      {doc.fileName} ({doc.fileSize})
                    </p>
                  )}
                  {doc.notes && (
                    <p className="text-xs text-[#EBAE29] font-medium">{doc.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {getStatusBadge(doc.status)}

                <select
                  value={doc.status}
                  onChange={(e) =>
                    updateVaultDocument(doc.id, {
                      status: e.target.value as DocumentStatus,
                    })
                  }
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-[#132228] border border-[#589C80]/30 text-[#F5EED2] font-mono focus:outline-none focus:border-[#EBAE29] cursor-pointer"
                >
                  <option value="verified">{t.common.verified}</option>
                  <option value="missing">{t.common.missing}</option>
                  <option value="needs_translation">{t.common.needsTranslation}</option>
                </select>

                <button
                  type="button"
                  onClick={() => removeVaultDocument(doc.id)}
                  className="p-2 text-xs text-[#F5EED2]/50 hover:text-red-400 transition-colors cursor-pointer"
                  title="Remove document"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#132228] border border-[#589C80]/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#589C80]/20">
              <h3 className="text-base font-bold text-[#F5EED2]">
                Add Document to Vault
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-[#F5EED2]/60 hover:text-[#F5EED2] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#F5EED2]/70 uppercase">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. Certified Family Income Declaration"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#132228] border border-[#589C80]/30 text-xs text-[#F5EED2] focus:outline-none focus:border-[#EBAE29]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#F5EED2]/70 uppercase">
                  Category Folder
                </label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value as DocumentCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#132228] border border-[#589C80]/30 text-xs text-[#F5EED2] focus:outline-none focus:border-[#EBAE29] cursor-pointer"
                >
                  {folderCategories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#F5EED2]/70 uppercase">
                  Verification Status
                </label>
                <select
                  value={newDocStatus}
                  onChange={(e) => setNewDocStatus(e.target.value as DocumentStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#132228] border border-[#589C80]/30 text-xs text-[#F5EED2] focus:outline-none focus:border-[#EBAE29] cursor-pointer"
                >
                  <option value="verified">Verified</option>
                  <option value="missing">Missing</option>
                  <option value="needs_translation">Needs Translation</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono border border-[#589C80]/30 text-[#F5EED2]/70 hover:text-[#F5EED2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-[#EBAE29] text-[#132228] hover:bg-[#EBAE29]/90 shadow-md cursor-pointer"
                >
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
