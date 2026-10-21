import React, { useState } from 'react';
import {
  Check,
  Copy,
  Edit3,
  Heart,
  Home,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { DatingIdeaItem } from '../types/character';
import { filterDatingIdeas } from '../utils/characterLogic';

interface DatingIdeasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoHome: () => void;
  ideas: DatingIdeaItem[];
  onAddIdea: (title: string, category: string, content: string) => void;
  onUpdateIdea: (id: string, title: string, category: string, content: string) => void;
  onDeleteIdea: (id: string) => void;
  onToggleCompleted: (id: string) => void;
}

const CATEGORIES = ['Tất cả', 'Tại gia', 'Quán xá', 'Đi dạo', 'Lãng mạn', 'Ăn uống', 'Trải nghiệm'];

export const DatingIdeasModal: React.FC<DatingIdeasModalProps> = ({
  isOpen,
  onClose,
  onGoHome,
  ideas,
  onAddIdea,
  onUpdateIdea,
  onDeleteIdea,
  onToggleCompleted,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Lãng mạn');
  const [contentInput, setContentInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [randomPickedIdea, setRandomPickedIdea] = useState<DatingIdeaItem | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  if (!isOpen) return null;

  const filteredIdeas = filterDatingIdeas(ideas, selectedCategory, searchQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !contentInput.trim()) return;

    if (editingId) {
      onUpdateIdea(editingId, titleInput.trim(), categoryInput.trim(), contentInput.trim());
      setEditingId(null);
    } else {
      onAddIdea(titleInput.trim(), categoryInput.trim(), contentInput.trim());
    }
    setTitleInput('');
    setContentInput('');
  };

  const handleStartEdit = (idea: DatingIdeaItem) => {
    setEditingId(idea.id);
    setTitleInput(idea.title);
    setCategoryInput(idea.category);
    setContentInput(idea.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitleInput('');
    setContentInput('');
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRollRandom = () => {
    if (ideas.length === 0 || isRolling) return;
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      const randIdx = Math.floor(Math.random() * ideas.length);
      setRandomPickedIdea(ideas[randIdx]);
      count++;
      if (count >= 12) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 80);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 pt-16 sm:pt-20 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dating-ideas-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl bg-[#121215] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[88vh] flex flex-col text-[#FAFAFA]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[#27272A] bg-[#18181B] shrink-0">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 fill-pink-500 text-pink-400" />
            <div className="text-xs font-semibold text-[#FAFAFA] tracking-wide">
              IDEA HẸN HÒ · NHÀ NHỎ CỦA CHOCO
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onGoHome}
              aria-label="Về trang chủ từ Idea hẹn hò"
              title="Về trang chủ"
              className="w-9 h-9 rounded-xl bg-[#09090B] border border-[#27272A] text-[#FAFAFA] hover:border-[#71717A] hover:bg-[#27272A] flex items-center justify-center transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng bảng idea hẹn hò"
              className="p-2 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Header Description & Random Picker Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-pink-950/30 to-[#18181B] border border-pink-500/20">
            <div>
              <h3 id="dating-ideas-title" className="text-base font-editorial font-bold text-white flex items-center gap-2">
                <span>Ý Tưởng Hẹn Hò Ngọt Ngào</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  {ideas.length} ý tưởng
                </span>
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Lưu giữ và khám phá những gợi ý hẹn hò dễ thương cho bạn và người thương 🤎
              </p>
            </div>
            <button
              type="button"
              onClick={handleRollRandom}
              disabled={isRolling || ideas.length === 0}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
              <span>{isRolling ? 'Đang quay...' : 'Rút idea ngẫu nhiên ✨'}</span>
            </button>
          </div>

          {/* Random Pick Highlight Result */}
          {randomPickedIdea && (
            <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/40 text-left space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-pink-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>Idea được chọn hôm nay:</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-200 text-[10px]">
                  #{randomPickedIdea.category}
                </span>
              </div>
              <div className="text-sm font-bold text-white font-editorial">{randomPickedIdea.title}</div>
              <p className="text-xs text-[#E4E4E7] leading-relaxed">{randomPickedIdea.content}</p>
            </div>
          )}

          {/* Add / Edit Form */}
          <form
            onSubmit={handleSubmit}
            className="p-4 sm:p-5 rounded-xl bg-[#09090B] border border-[#27272A] space-y-3"
          >
            <div className="text-xs font-semibold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-pink-300" />
                <span>{editingId ? 'Chỉnh sửa ý tưởng hẹn hò' : 'Thêm ý tưởng hẹn hò mới'}</span>
              </span>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-[11px] text-[#A1A1AA] hover:text-white underline cursor-pointer"
                >
                  Hủy chỉnh sửa
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Tiêu đề idea (vd: Đi dạo ngắm hoàng hôn...)"
                  className="w-full px-3.5 py-2 text-xs bg-[#18181B] text-white border border-[#27272A] rounded-lg focus:outline-none focus:border-pink-400"
                  required
                />
              </div>
              <div>
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#18181B] text-white border border-[#27272A] rounded-lg focus:outline-none focus:border-pink-400 cursor-pointer"
                >
                  {CATEGORIES.filter((c) => c !== 'Tất cả').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              placeholder="Chi tiết buổi hẹn, điều đặc biệt muốn làm cùng nhau..."
              rows={2}
              className="w-full px-3.5 py-2 text-xs bg-[#18181B] text-white border border-[#27272A] rounded-lg focus:outline-none focus:border-pink-400 resize-none"
              required
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3.5 py-1.5 text-xs text-[#A1A1AA] hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-[#E4E4E7] text-[#09090B] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>{editingId ? 'Lưu thay đổi' : 'Thêm idea 🤎'}</span>
              </button>
            </div>
          </form>

          {/* Search & Category Filter Pills */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm ý tưởng hẹn hò..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#09090B] text-white placeholder-[#71717A] border border-[#27272A] rounded-lg focus:outline-none focus:border-white"
                />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 font-semibold'
                        : 'bg-[#18181B] text-[#A1A1AA] hover:text-white border border-transparent'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Ideas List */}
            {filteredIdeas.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#71717A] space-y-2">
                <div>Chưa tìm thấy ý tưởng hẹn hò nào phù hợp.</div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('Tất cả');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1 text-pink-300 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại bộ lọc</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {filteredIdeas.map((idea) => {
                  const isCopied = copiedId === idea.id;
                  const isDone = Boolean(idea.isCompleted);
                  return (
                    <div
                      key={idea.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                        isDone
                          ? 'bg-[#141417]/60 border-[#27272A] opacity-75'
                          : 'bg-[#141417] border-[#27272A] hover:border-[#52525B]'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              idea.category === 'Lãng mạn'
                                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                                : idea.category === 'Tại gia'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            #{idea.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleCompleted(idea.id)}
                            title={isDone ? 'Đánh dấu chưa đi' : 'Đánh dấu đã trải nghiệm cùng nhau'}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1 cursor-pointer transition-colors ${
                              isDone
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-[#18181B] text-[#A1A1AA] border-[#27272A] hover:text-white'
                            }`}
                          >
                            <Check className={`w-3 h-3 ${isDone ? 'text-emerald-400' : 'text-[#71717A]'}`} />
                            <span>{isDone ? 'Đã đi 🤎' : 'Chưa đi'}</span>
                          </button>
                        </div>
                        <h4 className="text-sm font-editorial font-bold text-white leading-snug">
                          {idea.title}
                        </h4>
                        <p className="text-xs text-[#A1A1AA] leading-relaxed line-clamp-3">
                          {idea.content}
                        </p>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#27272A] text-xs">
                        <button
                          type="button"
                          onClick={() => handleCopy(idea.id, `${idea.title}: ${idea.content}`)}
                          className="px-2.5 py-1 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-[#FAFAFA] border border-[#27272A] transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[#A1A1AA]" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(idea)}
                            aria-label={`Sửa idea ${idea.title}`}
                            className="p-1.5 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteIdea(idea.id)}
                            aria-label={`Xóa idea ${idea.title}`}
                            className="p-1.5 text-[#A1A1AA] hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatingIdeasModal;
