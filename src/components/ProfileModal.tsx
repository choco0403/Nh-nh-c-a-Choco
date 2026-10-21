import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  ExternalLink,
  Heart,
  Home,
  Link2,
  MessageSquareQuote,
  Send,
  Trash2,
  User,
  X,
} from 'lucide-react';
import type { CharacterProfile } from '../types/character';
import {
  countWords,
  formatCharacterExportMarkdown,
  isCharacterNew,
  shortenLinkDisplay,
} from '../utils/characterLogic';
import { CharacterArtwork } from './CharacterArtwork';

interface ProfileModalProps {
  character: CharacterProfile | null;
  onClose: () => void;
  onGoHome: () => void;
  onSelectPrevious: () => void;
  onSelectNext: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  isHouseFavorite?: boolean;
  onSetHouseFavorite?: (id: string) => void;
  onEditCharacter?: (character: CharacterProfile) => void;
  onDeleteCharacter?: (id: string) => void;
  totalCount: number;
  currentIndex: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  character,
  onClose,
  onGoHome,
  onSelectPrevious,
  onSelectNext,
  isFavorite,
  onToggleFavorite,
  isHouseFavorite,
  onSetHouseFavorite,
  onEditCharacter,
  onDeleteCharacter,
  totalCount,
  currentIndex,
}) => {
  const [selectedGreetingIndex, setSelectedGreetingIndex] = useState(0);
  const [copiedField, setCopiedField] = useState<'greeting' | 'link' | 'markdown' | null>(null);
  const [trialReply, setTrialReply] = useState('');
  const [submittedReplies, setSubmittedReplies] = useState<string[]>([]);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);

  useEffect(() => {
    setSelectedGreetingIndex(0);
    setCopiedField(null);
    setTrialReply('');
    setSubmittedReplies([]);
    setIsPersonalInfoOpen(false);
  }, [character?.id]);

  useEffect(() => {
    if (!character) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isPersonalInfoOpen) {
          setIsPersonalInfoOpen(false);
        } else {
          onClose();
        }
      } else if (
        event.key === 'ArrowLeft' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        onSelectPrevious();
      } else if (
        event.key === 'ArrowRight' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        onSelectNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [character, isPersonalInfoOpen, onClose, onSelectPrevious, onSelectNext]);

  if (!character) return null;

  const activeGreeting =
    character.alternateGreetings && character.alternateGreetings[selectedGreetingIndex]
      ? character.alternateGreetings[selectedGreetingIndex].message
      : character.openingMessage;

  const activeGreetingContext =
    character.alternateGreetings && character.alternateGreetings[selectedGreetingIndex]
      ? character.alternateGreetings[selectedGreetingIndex].context
      : null;

  const handleCopy = async (text: string, type: 'greeting' | 'link' | 'markdown') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedField(type);
    window.setTimeout(() => {
      setCopiedField((prev) => (prev === type ? null : prev));
    }, 2200);
  };

  const handleSendTrialReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trialReply.trim()) return;
    setSubmittedReplies((prev) => [...prev, trialReply.trim()]);
    setTrialReply('');
  };

  const renderFormattedMessage = (rawMessage: string) => {
    const paragraphs = rawMessage.split(/\n\n+/);
    return paragraphs.map((paragraph, pIdx) => {
      const parts = paragraph.split(/(\*[^*]+\*)/g);
      return (
        <p key={pIdx} className="text-[15px] leading-[1.75] text-[#FAFAFA] mb-4 last:mb-0">
          {parts.map((part, idx) => {
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <em key={idx} className="text-[#A1A1AA] font-editorial text-[17px] italic">
                  {part.slice(1, -1)}
                </em>
              );
            }
            return (
              <span key={idx} className="font-medium text-white">
                {part}
              </span>
            );
          })}
        </p>
      );
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-6 pt-16 sm:pt-20 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dossier-character-name"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl bg-[#121215] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[85vh] flex flex-col text-[#FAFAFA]">
        {/* Top Modal Dossier Control Bar */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b border-[#27272A] bg-[#18181B] shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#A1A1AA] font-mono-num whitespace-nowrap">
            <span>
              <span className="font-sans font-medium text-white">Thành viên </span>
              <strong className="text-white font-mono-num" data-testid="modal-member-code">
                {character.code}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {currentIndex + 1}/{totalCount}
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span className="hidden sm:inline font-sans font-medium text-white">
              Creator: {character.creatorHandle}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {totalCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={onSelectPrevious}
                  aria-label="Nhân vật trước"
                  className="p-2 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onSelectNext}
                  aria-label="Nhân vật tiếp theo"
                  className="p-2 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* "Em thương anh nhất mà" button in top bar */}
            {onSetHouseFavorite && (
              <button
                type="button"
                onClick={() => onSetHouseFavorite(character.id)}
                title="Đặt làm thành viên trong ngôi nhà nhỏ được yêu thích nhất"
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  isHouseFavorite
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-300 shadow-md ring-1 ring-pink-300'
                    : 'bg-[#18181B] border-pink-500/40 text-pink-300 hover:bg-pink-500/10'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isHouseFavorite ? 'fill-current pulse-icon' : ''}`} />
                <span>{isHouseFavorite ? 'Được thương nhất' : 'Em thương anh nhất mà'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onToggleFavorite(character.id)}
              aria-label={
                isFavorite ? `Bỏ lưu hồ sơ ${character.name}` : `Lưu hồ sơ ${character.name}`
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                isFavorite
                  ? 'bg-white text-[#09090B] border-white'
                  : 'bg-[#09090B] border-[#27272A] text-[#E4E4E7] hover:border-[#52525B]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              <span>{isFavorite ? 'Đã lưu' : 'Đánh dấu'}</span>
            </button>

            {/* Every character can be edited */}
            {onEditCharacter && (
              <button
                type="button"
                onClick={() => onEditCharacter(character)}
                aria-label={`Chỉnh sửa hồ sơ ${character.name}`}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#09090B] border border-[#27272A] text-[#E4E4E7] hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sửa</span>
              </button>
            )}

            {onDeleteCharacter && (
              <button
                type="button"
                onClick={() => onDeleteCharacter(character.id)}
                aria-label={`Xóa hồ sơ ${character.name}`}
                className="p-2 text-red-400 hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onGoHome}
              aria-label="Về trang chủ từ hồ sơ"
              title="Về trang chủ"
              className="w-9 h-9 rounded-xl bg-[#09090B] border border-[#27272A] text-[#FAFAFA] hover:border-[#71717A] hover:bg-[#27272A] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng hồ sơ nhân vật"
              className="p-2 text-[#E4E4E7] hover:text-white hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Dossier Content */}
        <div className="overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Portrait, Creator + Tags Metadata & Direct Character Link Card */}
          <div className="lg:col-span-4 p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-[#27272A] bg-[#0E0E11] flex flex-col justify-start gap-5">
            <div className="space-y-4">
              <div className="floating-img aspect-[4/3] w-full rounded-xl overflow-hidden relative">
                {isCharacterNew(character) && (
                  <span className="absolute top-3 left-3 z-20 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500/90 text-white shadow-lg border border-rose-300/50 backdrop-blur-xs flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    <span>Mới (New)</span>
                  </span>
                )}
                <CharacterArtwork character={character} className="w-full h-full" />
                <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                  <div
                    className="text-[11px] tracking-wide text-[#D4D4D8] font-mono-num"
                    data-testid="modal-portrait-code"
                  >
                    {character.code} · Creator: {character.creatorHandle}
                  </div>
                  <div className="text-2xl font-editorial font-semibold leading-tight">
                    {character.name}
                  </div>
                </div>
              </div>

              {/* Special "Em thương anh nhất mà" Button in Left Column */}
              {onSetHouseFavorite && (
                <div className="p-3.5 rounded-xl bg-[#141417] border border-pink-500/30 space-y-2">
                  <div className="text-[11px] text-pink-200/90 font-medium flex items-center justify-between">
                    <span>Ngôi nhà nhỏ của Choco</span>
                    {isHouseFavorite && (
                      <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 text-[10px] font-semibold">
                        Đang yêu thích nhất
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSetHouseFavorite(character.id)}
                    data-testid="house-favorite-btn-left"
                    className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isHouseFavorite
                        ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-lg ring-2 ring-pink-300'
                        : 'link-button text-[#09090B]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isHouseFavorite ? 'fill-current pulse-icon' : ''}`} />
                    <span>{isHouseFavorite ? 'Đang là anh được thương nhất' : 'Em thương anh nhất mà'}</span>
                  </button>
                </div>
              )}

              {/* Clean unboxed Creator & Tags metadata on separate rows */}
              <div className="space-y-2.5 text-xs text-[#A1A1AA] border-t border-b border-[#27272A] py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#71717A] shrink-0">Creator (Tác giả)</span>
                  <span className="text-white font-semibold text-right truncate">
                    {character.creatorHandle}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[#71717A] shrink-0">Nhãn (Tags)</span>
                  <span className="text-[#D4D4D8] font-medium text-right break-words">
                    {character.tags.map((t) => `#${t}`).join(' · ')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#71717A] shrink-0">Nền tảng</span>
                  <span className="text-[#E4E4E7] text-right truncate">
                    {character.platformName}
                  </span>
                </div>
              </div>
            </div>

            {/* Dedicated Character Link Box (Link nhân vật) - Shortened with 5 lines limit */}
            <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5 whitespace-nowrap">
                  <Link2 className="w-3.5 h-3.5 text-[#D4D4D8]" />
                  <span>03. Link nhân vật</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(character.characterLink, 'link')}
                  className="text-xs font-medium text-[#D4D4D8] hover:text-white hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedField === 'link' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã chép URL</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-2.5 bg-[#09090B] border border-[#27272A] rounded-lg mb-3">
                <a
                  href={character.characterLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={character.characterLink}
                  className="text-xs font-mono-num text-[#E4E4E7] hover:text-white break-all underline decoration-[#52525B] hover:decoration-white transition-colors block line-clamp-5 max-h-[7.5rem] overflow-hidden"
                >
                  {shortenLinkDisplay(character.characterLink)}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={character.characterLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-button flex-1 py-2.5 px-3.5 text-[#09090B] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <span>Mở Link Nhân Vật</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(formatCharacterExportMarkdown(character), 'markdown')}
                  className="py-2.5 px-3 bg-[#09090B] hover:bg-[#27272A] text-[#E4E4E7] border border-[#27272A] text-xs font-medium rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedField === 'markdown' ? 'Đã chép' : 'Chép hồ sơ'}
                </button>
              </div>
            </div>

            {/* Clickable Personal Info Box (Thông tin cá nhân) below Link nhân vật */}
            <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5 whitespace-nowrap">
                  <User className="w-3.5 h-3.5 text-[#D4D4D8]" />
                  <span>04. Thông tin cá nhân</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPersonalInfoOpen(true)}
                data-testid="personal-info-trigger"
                aria-label="Thông tin cá nhân"
                className="link-button w-full py-2.5 px-3.5 text-[#09090B] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Thông tin cá nhân</span>
              </button>
            </div>
          </div>

          {/* Right Column: Name, Creator (separate line), Tags (separate line), Backstory, and Opening Message */}
          <div className="lg:col-span-8 p-5 sm:p-7 space-y-6 bg-[#121215]">
            {/* 1. Tên nhân vật, dòng Creator riêng & dòng Tags riêng */}
            <header className="border-b border-[#27272A] pb-4 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-[#A1A1AA] font-medium">
                  Creator: <strong className="text-white font-semibold">{character.creatorHandle}</strong>
                </div>
                <a
                  href={character.characterLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[#E4E4E7] hover:text-white hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Truy cập {character.platformName}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="text-xs text-[#A1A1AA]">
                <span className="text-[#71717A]">Tags: </span>
                <span className="text-[#D4D4D8] font-medium">
                  {character.tags.map((t) => `#${t}`).join(' · ')}
                </span>
              </div>
              <h2
                id="dossier-character-name"
                className="text-3xl sm:text-4xl font-editorial font-bold text-white tracking-tight pt-0.5"
              >
                {character.name}
              </h2>
              <p className="text-sm text-[#A1A1AA] pt-1 leading-relaxed">{character.shortHook}</p>
            </header>

            {/* 2. Backstory (Tiểu sử & Quá khứ) */}
            <section aria-labelledby="section-backstory">
              <div className="flex items-center justify-between mb-2.5">
                <h3
                  id="section-backstory"
                  className="text-lg font-editorial font-bold text-white flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-[#D4D4D8]" />
                  <span>01. Backstory — Tiểu sử & Quá khứ</span>
                </h3>
                <span className="text-xs text-[#71717A]">
                  <span className="font-mono-num">{countWords(character.backstory.join(' '))}</span> từ
                </span>
              </div>

              <div className="space-y-2.5 text-[14.5px] leading-[1.65] text-[#D4D4D8]">
                {character.backstory.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              {character.personalityNotes && (
                <div className="mt-3 pt-3 border-t border-[#27272A] text-xs text-[#D4D4D8] italic font-editorial text-sm leading-relaxed">
                  {character.personalityNotes}
                </div>
              )}
            </section>

            {/* 3. Tin nhắn mở đầu (Opening Message) */}
            <section
              aria-labelledby="section-opening-message"
              className="pt-4 border-t border-[#27272A]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3
                  id="section-opening-message"
                  className="text-lg font-editorial font-bold text-white flex items-center gap-2"
                >
                  <MessageSquareQuote className="w-4 h-4 text-[#D4D4D8]" />
                  <span>02. Tin nhắn mở đầu (Opening Message)</span>
                </h3>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#71717A]">
                    <span className="font-mono-num">{countWords(activeGreeting)}</span> từ
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeGreeting, 'greeting')}
                    className="px-3 py-1.5 text-xs font-medium bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedField === 'greeting' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Đã sao chép lời mở đầu</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#D4D4D8]" />
                        <span>Sao chép lời mở đầu</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {character.alternateGreetings && character.alternateGreetings.length > 1 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1.5 p-1 bg-[#09090B] border border-[#27272A] rounded-xl">
                    {character.alternateGreetings.map((alt, index) => (
                      <button
                        key={alt.id}
                        type="button"
                        onClick={() => setSelectedGreetingIndex(index)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          selectedGreetingIndex === index
                            ? 'bg-white text-[#09090B] font-semibold'
                            : 'text-[#A1A1AA] hover:text-white'
                        }`}
                      >
                        {alt.label}
                      </button>
                    ))}
                  </div>
                  {activeGreetingContext && (
                    <p className="text-xs text-[#A1A1AA] mt-2">
                      Bối cảnh mở đầu: {activeGreetingContext}
                    </p>
                  )}
                </div>
              )}

              {/* Opening Message Manuscript Card */}
              <div className="p-5 sm:p-6 rounded-xl bg-[#09090B] border border-[#27272A]">
                <div className="text-xs text-[#71717A] mb-3 pb-2 border-b border-[#18181B] flex items-center justify-between">
                  <span>
                    Lời chào mở màn từ {character.name} · Creator: {character.creatorHandle}
                  </span>
                  <span className="font-mono-num">Roleplay Greeting</span>
                </div>
                <div>{renderFormattedMessage(activeGreeting)}</div>
              </div>

              {/* Interactive Scene Reply Sandbox */}
              <div className="mt-5 pt-5 border-t border-[#27272A]">
                <div className="text-xs font-semibold text-[#E4E4E7] mb-2">
                  Viết thử lời hồi đáp mở màn của bạn (Nháp nhập vai)
                </div>
                {submittedReplies.length > 0 && (
                  <div className="space-y-2.5 mb-3">
                    {submittedReplies.map((reply, rIdx) => (
                      <div
                        key={rIdx}
                        className="p-3.5 rounded-xl bg-[#18181B] border border-[#27272A] text-sm text-white"
                      >
                        <div className="text-[11px] text-[#A1A1AA] mb-1">Bạn (Người chơi)</div>
                        <p className="leading-relaxed">{reply}</p>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleSendTrialReply} className="flex gap-2">
                  <input
                    type="text"
                    value={trialReply}
                    onChange={(e) => setTrialReply(e.target.value)}
                    placeholder={`Nhập câu trả lời đầu tiên của bạn với ${character.name}...`}
                    aria-label="Nhập câu trả lời thử nghiệm"
                    className="flex-1 px-3.5 py-2 text-sm bg-[#09090B] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white hover:bg-[#E4E4E7] text-[#09090B] text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi nháp</span>
                  </button>
                </form>
              </div>
            </section>
          </div>
        </div>

        {/* Personal Info Notification Modal ("Thông tin cá nhân") */}
        {isPersonalInfoOpen && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="personal-info-modal-title"
            data-testid="personal-info-modal"
            onClick={(e) => {
              e.stopPropagation();
              if (e.target === e.currentTarget) setIsPersonalInfoOpen(false);
            }}
          >
            <div className="w-full max-w-md rounded-2xl bg-[#121215] border border-[#3F3F46] shadow-2xl overflow-hidden text-[#FAFAFA]">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#27272A] bg-[#18181B]">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <User className="w-4 h-4 text-[#D4D4D8]" />
                  <span>Thông tin cá nhân · {character.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPersonalInfoOpen(false)}
                  aria-label="Đóng thông tin cá nhân"
                  className="p-1.5 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <p
                  id="personal-info-modal-title"
                  className="text-base font-editorial font-semibold glow-text text-center leading-relaxed"
                >
                  Dưới đây là thông tin của anh, bé đọc qua để hiểu anh hơn nha
                </p>

                <div className="rounded-xl bg-[#09090B] border border-[#27272A] divide-y divide-[#27272A] text-sm">
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-xs font-medium text-[#A1A1AA] shrink-0">Tên</span>
                    <span className="font-semibold text-white text-right">{character.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-xs font-medium text-[#A1A1AA] shrink-0">Ngày sinh</span>
                    <span className="font-medium text-[#E4E4E7] text-right">
                      {character.birthday || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-xs font-medium text-[#A1A1AA] shrink-0">Tuổi</span>
                    <span className="font-medium text-[#E4E4E7] text-right">
                      {character.age || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-xs font-medium text-[#A1A1AA] shrink-0">Cung</span>
                    <span className="font-medium text-[#E4E4E7] text-right">
                      {character.zodiac || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4 px-4 py-3">
                    <span className="text-xs font-medium text-[#A1A1AA] shrink-0">Tính cách</span>
                    <span className="font-medium text-[#E4E4E7] text-right leading-relaxed">
                      {character.personality || character.personalityNotes || 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {onEditCharacter && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsPersonalInfoOpen(false);
                        onEditCharacter(character);
                      }}
                      className="px-3.5 py-2 text-xs font-medium text-[#E4E4E7] hover:text-white bg-[#18181B] border border-[#27272A] rounded-xl transition-colors cursor-pointer"
                    >
                      Cập nhật thông tin
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsPersonalInfoOpen(false)}
                    className="px-5 py-2 text-xs font-semibold bg-white hover:bg-[#E4E4E7] text-[#09090B] rounded-xl transition-colors cursor-pointer"
                  >
                    Đã hiểu anh rồi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
