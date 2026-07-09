import React, { useState } from 'react';
import { Copy01Icon as Copy, CheckmarkBadge01Icon as Check } from 'hugeicons-react';
import { useTranslation } from 'react-i18next';

export default function CopyPaycamId({ paycamId, className = "" }: { paycamId: string, className?: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const handleCopy = () => {
    if (paycamId) {
      navigator.clipboard.writeText(paycamId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!paycamId) return null;

  return (
    <button 
      onClick={handleCopy}
      className={`flex items-center gap-2 mt-1 bg-black/20 dark:bg-white/20 rounded-full px-3 py-1 w-fit hover:bg-black/30 dark:hover:bg-white/30 transition-colors ${className}`}
      title={t("Copy PayCam ID")}
    >
      <span className="text-white/90 text-xs font-mono font-medium">{paycamId}</span>
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-white/70" />}
    </button>
  );
}
