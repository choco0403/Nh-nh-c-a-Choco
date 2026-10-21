import React, { useState } from 'react';
import {
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Globe,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type {
  MultiverseOpenWorld,
  MultiverseShow,
  OpenWorldFormInput,
  ShowFormInput,
} from '../types/multiverse';
import { shortenLinkDisplay } from '../utils/characterLogic';

interface MultiverseSectionProps {
  shows: MultiverseShow[];
  openWorlds: MultiverseOpenWorld[];
  onAddShow: (input: ShowFormInput) => void;
  onUpdateShow: (id: string, input: ShowFormInput) => void;
  onDeleteShow: (id: string) => void;
  onAddOpenWorld: (input: OpenWorldFormInput) => void;
  onUpdateOpenWorld: (id: string, input: OpenWorldFormInput) => void;
  onDeleteOpenWorld: (id: string) => void;
  onClose: () => void;
}

export const MultiverseSection: React.FC<MultiverseSectionProps> = ({
  shows,
  openWorlds,
  onAddShow,
  onUpdateShow,
  onDeleteShow,
  onAddOpenWorld,
  onUpdateOpenWorld,
  onDeleteOpenWorld,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'shows' | 'open_world'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals for Show
  const [isShowFormOpen, setIsShowFormOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<MultiverseShow | null>(null);
  const [selectedShowDetail, setSelectedShowDetail] = useState<MultiverseShow | null>(null);

  // Modals for OPW
  const [isOpwFormOpen, setIsOpwFormOpen] = useState(false);
  const [editingOpw, setEditingOpw] = useState<MultiverseOpenWorld | null>(null);
  const [selectedOpwDetail, setSelectedOpwDetail] = useState<MultiverseOpenWorld | null>(null);

  // Show Form State
  const [showForm, setShowForm] = useState<ShowFormInput>({
    title: '',
    description: '',
    charactersInfo: '',
    link: '',
    tagsText: '',
  });

  // OPW Form State
  const [opwForm, setOpwForm] = useState<OpenWorldFormInput>({
    title: '',
    description: '',
    link: '',
    tagsText: '',
  });

  const handleCopyLink = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const handleOpenAddShow = () => {
    setEditingShow(null);
    setShowForm({
      title: '',
      description: '',
      charactersInfo: '',
      link: '',
      tagsText: '',
    });
    setIsShowFormOpen(true);
  };

  const handleOpenEditShow = (show: MultiverseShow) => {
    setEditingShow(show);
    setShowForm({
      title: show.title,
      description: show.description,
      charactersInfo: show.charactersInfo,
      link: show.link,
      tagsText: show.tags ? show.tags.join(', ') : '',
    });
    setIsShowFormOpen(true);
  };

  const handleSubmitShow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showForm.title.trim() || !showForm.description.trim() || !showForm.link.trim()) return;
    if (editingShow) {
      onUpdateShow(editingShow.id, showForm);
    } else {
      onAddShow(showForm);
    }
    setIsShowFormOpen(false);
    setEditingShow(null);
  };

  const handleOpenAddOpw = () => {
    setEditingOpw(null);
    setOpwForm({
      title: '',
      description: '',
      link: '',
      tagsText: '',
    });
    setIsOpwFormOpen(true);
  };

  const handleOpenEditOpw = (opw: MultiverseOpenWorld) => {
    setEditingOpw(opw);
    setOpwForm({
      title: opw.title,
      description: opw.description,
      link: opw.link,
      tagsText: opw.tags ? opw.tags.join(', ') : '',
    });
    setIsOpwFormOpen(true);
  };

  const handleSubmitOpw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opwForm.title.trim() || !opwForm.description.trim() || !opwForm.link.trim()) return;
    if (editingOpw) {
      onUpdateOpenWorld(editingOpw.id, opwForm);
    } else {
      onAddOpenWorld(opwForm);
    }
    setIsOpwFormOpen(false);
    setEditingOpw(null);
  };

  return (
    <section
      id="khong-gian-da-vu-tru"
      aria-labelledby="multiverse-title"
      className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#161226] via-[#121215] to-[#1a1122] border border-pink-500/40 space-y-6 shadow-2xl relative overflow-hidden"
    >
      {/* Top Section Header with Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27272A] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-xs font-semibold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>ĐA VŨ TRỤ</span>
            </span>
            <span className="text-xs text-[#A1A1AA]">Không gian các Show và Open World</span>
          </div>
          <h2
            id="multiverse-title"
            className="text-2xl sm:text-3xl font-editorial font-bold text-white tracking-tight glow-text"
          >
            Các Show & Open World
          </h2>
          <p className="text-sm text-[#D4D4D8]">
            Tách riêng các chương trình truyền hình thực tế (Show) và các thế giới mở (Open World) với đầy đủ mô tả, nhân vật và đường dẫn truy cập.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="p-1 rounded-xl bg-[#09090B] border border-[#27272A] flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-[#09090B]'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              Tất cả ({shows.length + openWorlds.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('shows')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === 'shows'
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              Các Show ({shows.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('open_world')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === 'open_world'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              Open World ({openWorlds.length})
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-white transition-colors cursor-pointer"
          >
            Đóng Đa vũ trụ
          </button>
        </div>
      </div>

      {/* Split 2 Panels: 1 Bên Các Show & 1 Bên Open World */}
      <div
        className={`grid gap-6 ${
          filter === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {/* ==================== 1 BÊN: CÁC SHOW ==================== */}
        {(filter === 'all' || filter === 'shows') && (
          <div className="p-5 sm:p-6 rounded-xl bg-[#161220] border border-pink-500/20 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#27272A] pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/30">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-lg font-editorial font-bold text-white">1 Bên: Các Show</h3>
                    <p className="text-xs text-[#A1A1AA]">
                      Tên show, mô tả show, thông tin các nhân vật và link
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block px-2 py-0.5 text-xs rounded bg-[#09090B] text-pink-300 font-mono-num border border-pink-500/30">
                    {shows.length} Show
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenAddShow}
                    className="px-2.5 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-500/40 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Show</span>
                  </button>
                </div>
              </div>

              {/* List of Shows */}
              <div className="space-y-4">
                {shows.map((show) => (
                  <article
                    key={show.id}
                    className="p-4 sm:p-5 rounded-xl bg-[#0E0E11] border border-[#27272A] hover:border-pink-500/40 transition-all space-y-3.5 group shadow-md"
                  >
                    {/* Header: Tên Show + Action Buttons */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                            SHOW
                          </span>
                          {show.tags && show.tags.length > 0 && (
                            <span className="text-[11px] text-[#A1A1AA] truncate">
                              {show.tags.map((t) => `#${t}`).join(' · ')}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base sm:text-lg font-editorial font-bold text-white group-hover:text-pink-200 transition-colors">
                          {show.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditShow(show)}
                          aria-label={`Sửa show ${show.title}`}
                          className="p-1.5 text-[#A1A1AA] hover:text-white hover:bg-[#18181B] rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteShow(show.id)}
                          aria-label={`Xóa show ${show.title}`}
                          className="p-1.5 text-[#A1A1AA] hover:text-red-400 hover:bg-[#18181B] rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Mô tả show */}
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[#A1A1AA]">Mô tả show:</span>
                      <p className="text-xs sm:text-sm text-[#D4D4D8] leading-relaxed line-clamp-3">
                        {show.description}
                      </p>
                    </div>

                    {/* Thông tin các nhân vật */}
                    <div className="p-3 rounded-lg bg-[#14121B] border border-pink-500/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-300">
                        <Users className="w-3.5 h-3.5" />
                        <span>Thông tin các nhân vật:</span>
                      </div>
                      <p className="text-xs text-[#E4E4E7] leading-relaxed line-clamp-3">
                        {show.charactersInfo}
                      </p>
                    </div>

                    {/* Link */}
                    <div className="pt-2 border-t border-[#1C1C22] flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] font-mono-num truncate max-w-[240px] sm:max-w-[320px]">
                        <span className="text-[#71717A]">Link:</span>
                        <a
                          href={show.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-300 hover:underline truncate"
                          title={show.link}
                        >
                          {shortenLinkDisplay(show.link)}
                        </a>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(show.id, show.link)}
                          className="px-2.5 py-1.5 text-xs text-[#D4D4D8] hover:text-white bg-[#141417] hover:bg-[#1C1C20] border border-[#27272A] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === show.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Chép link</span>
                            </>
                          )}
                        </button>
                        <a
                          href={show.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-semibold text-[#09090B] bg-white hover:bg-pink-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <span>Mở Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </article>
                ))}

                {shows.length === 0 && (
                  <div className="py-10 text-center text-xs text-[#71717A] space-y-3">
                    <p>Chưa có show nào trong danh sách.</p>
                    <button
                      type="button"
                      onClick={handleOpenAddShow}
                      className="px-3.5 py-2 rounded-xl bg-pink-500/20 text-xs font-semibold text-pink-200 border border-pink-500/40 hover:bg-pink-500/30 cursor-pointer"
                    >
                      + Thêm show đầu tiên
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 1 BÊN: OPEN WORLD (OPW) ==================== */}
        {(filter === 'all' || filter === 'open_world') && (
          <div className="p-5 sm:p-6 rounded-xl bg-[#141624] border border-purple-500/20 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#27272A] pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30">
                    <Globe className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-lg font-editorial font-bold text-white">1 Bên: Open World</h3>
                    <p className="text-xs text-[#A1A1AA]">
                      Tên OPW, mô tả và link
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block px-2 py-0.5 text-xs rounded bg-[#09090B] text-purple-300 font-mono-num border border-purple-500/30">
                    {openWorlds.length} OPW
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenAddOpw}
                    className="px-2.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm OPW</span>
                  </button>
                </div>
              </div>

              {/* List of OPW */}
              <div className="space-y-4">
                {openWorlds.map((opw) => (
                  <article
                    key={opw.id}
                    className="p-4 sm:p-5 rounded-xl bg-[#0E0E11] border border-[#27272A] hover:border-purple-500/40 transition-all space-y-3.5 group shadow-md"
                  >
                    {/* Header: Tên OPW + Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            OPEN WORLD
                          </span>
                          {opw.tags && opw.tags.length > 0 && (
                            <span className="text-[11px] text-[#A1A1AA] truncate">
                              {opw.tags.map((t) => `#${t}`).join(' · ')}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base sm:text-lg font-editorial font-bold text-white group-hover:text-purple-200 transition-colors">
                          {opw.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditOpw(opw)}
                          aria-label={`Sửa OPW ${opw.title}`}
                          className="p-1.5 text-[#A1A1AA] hover:text-white hover:bg-[#18181B] rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteOpenWorld(opw.id)}
                          aria-label={`Xóa OPW ${opw.title}`}
                          className="p-1.5 text-[#A1A1AA] hover:text-red-400 hover:bg-[#18181B] rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Mô tả OPW */}
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[#A1A1AA]">Mô tả:</span>
                      <p className="text-xs sm:text-sm text-[#D4D4D8] leading-relaxed line-clamp-4">
                        {opw.description}
                      </p>
                    </div>

                    {/* Link */}
                    <div className="pt-2 border-t border-[#1C1C22] flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] font-mono-num truncate max-w-[240px] sm:max-w-[320px]">
                        <span className="text-[#71717A]">Link:</span>
                        <a
                          href={opw.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-300 hover:underline truncate"
                          title={opw.link}
                        >
                          {shortenLinkDisplay(opw.link)}
                        </a>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(opw.id, opw.link)}
                          className="px-2.5 py-1.5 text-xs text-[#D4D4D8] hover:text-white bg-[#141417] hover:bg-[#1C1C20] border border-[#27272A] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === opw.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Chép link</span>
                            </>
                          )}
                        </button>
                        <a
                          href={opw.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-semibold text-[#09090B] bg-white hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <span>Mở Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </article>
                ))}

                {openWorlds.length === 0 && (
                  <div className="py-10 text-center text-xs text-[#71717A] space-y-3">
                    <p>Chưa có thế giới mở (OPW) nào trong danh sách.</p>
                    <button
                      type="button"
                      onClick={handleOpenAddOpw}
                      className="px-3.5 py-2 rounded-xl bg-purple-500/20 text-xs font-semibold text-purple-200 border border-purple-500/40 hover:bg-purple-500/30 cursor-pointer"
                    >
                      + Thêm OPW đầu tiên
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== MODAL: THÊM / SỬA SHOW ==================== */}
      {isShowFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="show-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsShowFormOpen(false);
          }}
        >
          <div className="relative w-full max-w-xl bg-[#121215] border border-pink-500/40 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-[#FAFAFA]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272A] bg-[#18181B] shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-300" />
                <h3 id="show-modal-title" className="text-base font-semibold text-white">
                  {editingShow ? 'Chỉnh sửa Show' : 'Thêm Show mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShowFormOpen(false)}
                className="p-1.5 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitShow} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Tên show <span className="text-pink-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tín Hiệu Rung Động (Heart Signal Special)"
                  value={showForm.title}
                  onChange={(e) => setShowForm({ ...showForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Mô tả show <span className="text-pink-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Mô tả bối cảnh show, thể loại, nội dung chương trình..."
                  value={showForm.description}
                  onChange={(e) => setShowForm({ ...showForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Thông tin các nhân vật <span className="text-pink-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Liệt kê danh sách các anh chàng tham gia show, tính cách, vai trò, chemistry..."
                  value={showForm.charactersInfo}
                  onChange={(e) => setShowForm({ ...showForm, charactersInfo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Link xem / truy cập show <span className="text-pink-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={showForm.link}
                  onChange={(e) => setShowForm({ ...showForm, link: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Nhãn / Tags (cách nhau bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  placeholder="Hẹn hò, Gameshow, Idol, Center"
                  value={showForm.tagsText || ''}
                  onChange={(e) => setShowForm({ ...showForm, tagsText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-pink-400"
                />
              </div>

              <div className="pt-3 border-t border-[#27272A] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsShowFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#D4D4D8] border border-[#27272A] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-pink-500 hover:bg-pink-600 text-white cursor-pointer shadow-md"
                >
                  {editingShow ? 'Lưu thay đổi' : 'Thêm Show'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: THÊM / SỬA OPEN WORLD (OPW) ==================== */}
      {isOpwFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="opw-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpwFormOpen(false);
          }}
        >
          <div className="relative w-full max-w-xl bg-[#121215] border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-[#FAFAFA]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272A] bg-[#18181B] shrink-0">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-300" />
                <h3 id="opw-modal-title" className="text-base font-semibold text-white">
                  {editingOpw ? 'Chỉnh sửa Open World (OPW)' : 'Thêm Open World (OPW) mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpwFormOpen(false)}
                className="p-1.5 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitOpw} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Tên OPW <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đại Lục Aethelgard: Thế Giới Dị Giới & Ma Pháp"
                  value={opwForm.title}
                  onChange={(e) => setOpwForm({ ...opwForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Mô tả OPW <span className="text-purple-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Mô tả bối cảnh thế giới mở, cốt truyện, các khu vực, quy tắc thế giới..."
                  value={opwForm.description}
                  onChange={(e) => setOpwForm({ ...opwForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Link OPW <span className="text-purple-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={opwForm.link}
                  onChange={(e) => setOpwForm({ ...opwForm, link: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Nhãn / Tags (cách nhau bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  placeholder="RPG, Thế giới mở, Sandbox, Ma pháp"
                  value={opwForm.tagsText || ''}
                  onChange={(e) => setOpwForm({ ...opwForm, tagsText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="pt-3 border-t border-[#27272A] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpwFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#D4D4D8] border border-[#27272A] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-md"
                >
                  {editingOpw ? 'Lưu thay đổi' : 'Thêm OPW'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
