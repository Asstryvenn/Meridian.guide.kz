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
  FileUp,
  Download,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { useI18n } from "@/components/i18n/i18n-context";
import type { DocumentCategory, DocumentStatus, VaultDocument } from "@/lib/types";
import { useT } from "@/lib/i18n/use-t";
import { msg } from "@/lib/i18n/catalog";

const folderCategories: { key: DocumentCategory; label: string }[] = [
  { key: "passport", label: msg("Passports & Identity") },
  { key: "bank_statement", label: msg("Bank Statements") },
  { key: "family_income", label: msg("Family Income") },
  { key: "tax", label: msg("Tax Payers Documents") },
  { key: "insurance", label: msg("Health Insurance") },
];

function getCategoryIcon(key: DocumentCategory) {
  switch (key) {
    case "passport":
      return <Shield size={16} className="text-green-ink" />;
    case "bank_statement":
      return <Landmark size={16} className="text-green-ink" />;
    case "family_income":
      return <Briefcase size={16} className="text-green-ink" />;
    case "tax":
      return <FileCheck size={16} className="text-green-ink" />;
    case "insurance":
      return <Shield size={16} className="text-green-ink" />;
    default:
      return <FileText size={16} className="text-green-ink" />;
  }
}

function isValidDocumentFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DocumentVault() {
  const tx = useT();
  const { documents, addVaultDocument, updateVaultDocument, removeVaultDocument } = useApp();
  const { t } = useI18n();

  const [activeCategory, setActiveCategory] = useState<"all" | DocumentCategory>("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<DocumentCategory>("passport");
  const [newDocStatus, setNewDocStatus] = useState<DocumentStatus>("verified");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64Data, setFileBase64Data] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [modalDragOver, setModalDragOver] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs =
    activeCategory === "all"
      ? documents
      : documents.filter((d) => d.category === activeCategory);

  const verifiedCount = documents.filter((d) => d.status === "verified").length;
  const totalCount = documents.length || 1;
  const compliancePercentage = Math.round((verifiedCount / totalCount) * 100);

  async function handleFileSelection(file: File) {
    if (!isValidDocumentFile(file)) {
      setFileError(tx("Supported formats are .pdf, .doc, and .docx only"));
      setSelectedFile(null);
      setFileBase64Data(null);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setFileError(tx("File size exceeds 20MB limit"));
      setSelectedFile(null);
      setFileBase64Data(null);
      return;
    }
    setFileError(null);
    setSelectedFile(file);
    if (!newDocName.trim()) {
      setNewDocName(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }
    try {
      const b64 = await fileToBase64(file);
      setFileBase64Data(b64);
    } catch {
      setFileError(tx("Error processing file data"));
    }
  }

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const newDoc: VaultDocument = {
      id: `doc-${Date.now()}`,
      name: newDocName.trim(),
      category: newDocCategory,
      status: newDocStatus,
      fileName: selectedFile ? selectedFile.name : `${newDocName.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileSize: selectedFile ? formatFileSize(selectedFile.size) : "1.4 MB",
      fileData: fileBase64Data || undefined,
      mimeType: selectedFile ? selectedFile.type : "application/pdf",
      uploadedAt: new Date().toISOString().split("T")[0],
    };

    addVaultDocument(newDoc);
    setNewDocName("");
    setSelectedFile(null);
    setFileBase64Data(null);
    setFileError(null);
    setShowUploadModal(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!isValidDocumentFile(file)) return;

      const lower = file.name.toLowerCase();
      let detectedCategory: DocumentCategory = "family_income";
      if (lower.includes("pass") || lower.includes("id")) detectedCategory = "passport";
      else if (lower.includes("bank") || lower.includes("statement")) detectedCategory = "bank_statement";
      else if (lower.includes("tax")) detectedCategory = "tax";
      else if (lower.includes("insur") || lower.includes("med")) detectedCategory = "insurance";

      let base64: string | undefined = undefined;
      try {
        base64 = await fileToBase64(file);
      } catch {}

      const newDoc: VaultDocument = {
        id: `doc-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        category: detectedCategory,
        status: "verified",
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileData: base64,
        mimeType: file.type,
        uploadedAt: new Date().toISOString().split("T")[0],
      };

      addVaultDocument(newDoc);
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "verified":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#589C80]/20 text-green-ink border border-[#589C80]/40 flex items-center gap-1.5">
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
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#EBAE29]/20 text-amber-ink border border-[#EBAE29]/40 flex items-center gap-1.5">
            <Globe size={12} />
            <span>{t.common.needsTranslation}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-panel border border-[#589C80]/30 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Folder className="text-green-ink" size={20} />
            <h2 className="text-lg font-bold text-ink">
              {t.documents.title}
            </h2>
          </div>
          <p className="text-xs text-ink/70">
            {t.documents.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-mono text-ink/60 uppercase">
              {t.documents.complianceScore}
            </p>
            <p className="text-xl font-mono font-black text-green-ink">
              {compliancePercentage}%
            </p>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-[#589C80]/30 flex items-center justify-center p-1 bg-surface-sunken">
            <div
              className="w-full h-full rounded-full flex items-center justify-center text-xs font-mono font-bold text-ink"
              style={{
                background: `conic-gradient(#589C80 ${compliancePercentage * 3.6}deg, transparent 0deg)`,
              }}
            >
              <div className="w-9 h-9 rounded-full bg-panel flex items-center justify-center">
                <FileCheck size={16} className="text-green-ink" />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#EBAE29] text-on-accent font-mono text-xs font-bold hover:bg-[#EBAE29]/90 shadow-md transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>{tx("Upload Document")}</span>
          </button>
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
            : "border-[#589C80]/30 bg-panel/50 hover:border-[#589C80]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={async (e) => {
            if (e.target.files && e.target.files.length > 0) {
              const file = e.target.files[0];
              if (!isValidDocumentFile(file)) return;
              let base64: string | undefined = undefined;
              try {
                base64 = await fileToBase64(file);
              } catch {}
              const newDoc: VaultDocument = {
                id: `doc-${Date.now()}`,
                name: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
                category: activeCategory === "all" ? "passport" : activeCategory,
                status: "verified",
                fileName: file.name,
                fileSize: formatFileSize(file.size),
                fileData: base64,
                mimeType: file.type,
                uploadedAt: new Date().toISOString().split("T")[0],
              };
              addVaultDocument(newDoc);
            }
          }}
        />
        <div className="flex justify-center">
          <Upload size={32} className="text-green-ink" />
        </div>
        <p className="text-sm font-semibold text-ink">
          {t.documents.dropPrompt}
        </p>
        <p className="text-xs font-mono text-green-ink">
          {tx("Drag & drop .PDF, .DOC, .DOCX portfolio items (up to 20MB)")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
            activeCategory === "all"
              ? "bg-[#589C80] text-on-accent shadow-md"
              : "bg-panel/60 text-ink/70 hover:text-ink border border-[#589C80]/20"
          }`}
        >
          {t.documents.allFiles} ({documents.length})
        </button>
        {folderCategories.map((cat) => {
          const count = documents.filter((d) => d.category === cat.key).length;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeCategory === cat.key
                  ? "bg-[#589C80] text-on-accent shadow-md"
                  : "bg-panel/60 text-ink/70 hover:text-ink border border-[#589C80]/20"
              }`}
            >
              {getCategoryIcon(cat.key)}
              <span>{cat.label}</span>
              <span className="opacity-60 text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          const isWord = doc.fileName?.endsWith(".doc") || doc.fileName?.endsWith(".docx");
          return (
            <motion.div
              layout
              key={doc.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-5 rounded-3xl bg-panel border border-[#589C80]/30 shadow-md hover:border-[#589C80] transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-surface-sunken border border-[#589C80]/20">
                      {isWord ? (
                        <FileSpreadsheet size={20} className="text-[#589C80]" />
                      ) : (
                        <FileText size={20} className="text-[#EBAE29]" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-ink leading-snug line-clamp-1">
                        {doc.name}
                      </h4>
                      <p className="text-[10px] font-mono text-ink/50 uppercase">
                        {folderCategories.find((c) => c.key === doc.category)?.label}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>

                <div className="p-2.5 rounded-2xl bg-surface-sunken border border-[#589C80]/15 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-ink/60">
                    <span className="truncate max-w-[170px]">{doc.fileName || "document.pdf"}</span>
                    <span>{doc.fileSize || "—"}</span>
                  </div>
                  <div className="text-[9px] font-mono text-ink/40">
                    {tx("Uploaded")}: {doc.uploadedAt || "2026-09-01"}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#589C80]/20 text-xs">
                <select
                  value={doc.status}
                  onChange={(e) =>
                    updateVaultDocument(doc.id, {
                      status: e.target.value as DocumentStatus,
                    })
                  }
                  className="px-2.5 py-1 rounded-xl bg-surface-sunken border border-[#589C80]/30 text-[11px] font-mono text-ink focus:outline-none focus:border-[#EBAE29] cursor-pointer"
                >
                  <option value="verified">{tx("Verified")}</option>
                  <option value="missing">{tx("Missing")}</option>
                  <option value="needs_translation">{tx("Needs Translation")}</option>
                </select>

                <div className="flex items-center gap-1.5">
                  {doc.fileData && (
                    <a
                      href={doc.fileData}
                      download={doc.fileName || "document"}
                      className="p-2 rounded-xl text-ink/60 hover:text-green-ink hover:bg-surface-sunken transition-colors cursor-pointer"
                      title={tx("Download Document")}
                    >
                      <Download size={15} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => removeVaultDocument(doc.id)}
                    className="p-2 rounded-xl text-ink/60 hover:text-red-400 hover:bg-surface-sunken transition-colors cursor-pointer"
                    title={tx("Delete Document")}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-panel border border-[#589C80]/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#589C80]/20">
              <div className="flex items-center gap-2">
                <FileUp className="text-[#EBAE29]" size={18} />
                <h3 className="text-base font-bold text-ink">
                  {tx("Add Document to Vault")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setFileBase64Data(null);
                  setFileError(null);
                }}
                className="p-1 rounded-lg text-ink/60 hover:text-ink cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setModalDragOver(true);
                }}
                onDragLeave={() => setModalDragOver(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setModalDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    await handleFileSelection(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => modalFileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2 ${
                  modalDragOver
                    ? "border-[#EBAE29] bg-[#EBAE29]/10"
                    : selectedFile
                    ? "border-[#589C80] bg-[#589C80]/10"
                    : "border-[#589C80]/30 bg-surface-sunken hover:border-[#589C80]"
                }`}
              >
                <input
                  ref={modalFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      await handleFileSelection(e.target.files[0]);
                    }
                  }}
                />
                {selectedFile ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-panel border border-[#589C80]/40 text-left">
                    <div className="flex items-center gap-3">
                      <FileText size={24} className="text-[#EBAE29] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink truncate max-w-[240px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] font-mono text-ink/60">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setFileBase64Data(null);
                      }}
                      className="p-1 rounded-lg hover:bg-surface-sunken text-ink/60 hover:text-red-400"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <Upload size={28} className="text-green-ink" />
                    </div>
                    <p className="text-xs font-semibold text-ink">
                      {tx("Drag & drop document or click to browse")}
                    </p>
                    <p className="text-[11px] font-mono text-green-ink">
                      {tx("Supports .PDF, .DOC, .DOCX up to 20MB")}
                    </p>
                  </>
                )}
              </div>

              {fileError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/20 border border-red-800/40 text-red-400 text-xs font-mono">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-mono text-ink/70 uppercase">
                  {tx("Document Title")}
                </label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder={tx("e.g. Certified Family Income Declaration")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-sunken border border-[#589C80]/30 text-xs text-ink focus:outline-none focus:border-[#EBAE29]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-ink/70 uppercase">
                    {tx("Category Folder")}
                  </label>
                  <select
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value as DocumentCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-sunken border border-[#589C80]/30 text-xs text-ink focus:outline-none focus:border-[#EBAE29] cursor-pointer"
                  >
                    {folderCategories.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-ink/70 uppercase">
                    {tx("Verification Status")}
                  </label>
                  <select
                    value={newDocStatus}
                    onChange={(e) => setNewDocStatus(e.target.value as DocumentStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-sunken border border-[#589C80]/30 text-xs text-ink focus:outline-none focus:border-[#EBAE29] cursor-pointer"
                  >
                    <option value="verified">{tx("Verified")}</option>
                    <option value="missing">{tx("Missing")}</option>
                    <option value="needs_translation">{tx("Needs Translation")}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setFileBase64Data(null);
                    setFileError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-mono border border-[#589C80]/30 text-ink/70 hover:text-ink cursor-pointer"
                >
                  {tx("Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-[#EBAE29] text-on-accent hover:bg-[#EBAE29]/90 shadow-md cursor-pointer"
                >
                  {tx("Save Document")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
