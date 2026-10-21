import React, { useState } from 'react';
import type { DiaryMemoryItem } from '../types/character';
import {
  buildKyUcBackupPayload,
  catVaoKho,
  parseKyUcRestorePayload,
  validateMemoryInput,
} from '../utils/characterLogic';

interface MemoryDiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: DiaryMemoryItem[];
  onSaveMemory: (character: string, quote: string, thought: string) => void;
  onDeleteMemory: (index: number) => void;
  onRestoreMemories?: (restoredMemories: DiaryMemoryItem[], restoredStarScore?: unknown) => void;
}

export const MemoryDiaryModal: React.FC<MemoryDiaryModalProps> = ({
  isOpen,
  onClose,
  memories,
  onSaveMemory,
  onDeleteMemory,
  onRestoreMemories,
}) => {
  const [character, setCharacter] = useState('');
  const [quote, setQuote] = useState('');
  const [thought, setThought] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [backupNotice, setBackupNotice] = useState<{
    text: string;
    isError?: boolean;
  } | null>(null);
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateMemoryInput(character, quote);
    if (!validation.valid) {
      setFormError(validation.error || 'Cậu nhớ điền tên nhân vật và câu nói nhé!');
      return;
    }

    setFormError(null);
    onSaveMemory(character, quote, thought);
    setCharacter('');
    setQuote('');
    setThought('');
  };

  const handleDeleteClick = (idx: number) => {
    setConfirmDeleteIdx(idx);
  };

  const handleConfirmDelete = (idx: number) => {
    onDeleteMemory(idx);
    setConfirmDeleteIdx(null);
  };

  // 1. Lệnh Đóng Gói (Tải dữ liệu về máy)
  const handleSaoLuuKyUc = () => {
    catVaoKho('chocoMemories', memories);
    const duLieuBaoMat = buildKyUcBackupPayload();
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(duLieuBaoMat));
    const nutTai = document.createElement('a');
    nutTai.setAttribute('href', dataStr);
    nutTai.setAttribute('download', 'GocCuaChoco_KyUc.json');
    document.body.appendChild(nutTai);
    nutTai.click();
    nutTai.remove();
    setBackupNotice({
      text: 'Đã cất giữ ký ức an toàn vào máy tính của cậu. 🤎',
      isError: false,
    });
  };

  // 2. Lệnh Khôi Phục (Đọc file từ máy tính)
  const handleKhoiPhucKyUc = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const docFile = new FileReader();
    docFile.onload = (e) => {
      const rawText = typeof e.target?.result === 'string' ? e.target.result : '';
      const result = parseKyUcRestorePayload(rawText);
      if (!result.valid) {
        setBackupNotice({
          text: result.error || 'Hình như đây không phải là chiếc hộp ký ức của Choco...',
          isError: true,
        });
        return;
      }

      const restoredMemories = (Array.isArray(result.kyUc) ? result.kyUc : []) as DiaryMemoryItem[];
      catVaoKho('chocoMemories', restoredMemories);
      catVaoKho('diemGomSao', result.diemSao);
      onRestoreMemories?.(restoredMemories, result.diemSao);
      setBackupNotice({
        text: 'Ký ức đã quay về! ✨',
        isError: false,
      });
    };
    docFile.readAsText(file);
    event.target.value = '';
  };

  return (
    <div
      id="diary-modal"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto ${
        isOpen ? 'show-diary' : 'hidden-modal'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="diary-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="diary-book" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="close-diary"
          onClick={onClose}
          aria-label="Đóng sổ ký ức"
        >
          ✖
        </button>

        <h2 id="diary-modal-title" className="diary-title text-xl sm:text-2xl font-bold font-editorial">
          Sổ Tay Ký Ức 🤎
        </h2>

        {/* Khu vực viết nhật ký mới */}
        <form className="diary-form" onSubmit={handleSubmit}>
          {formError && (
            <div className="mb-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg text-center animate-fade-in">
              {formError}
            </div>
          )}
          <input
            type="text"
            id="mem-char"
            value={character}
            onChange={(e) => {
              setCharacter(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="Tên nhân vật..."
            autoComplete="off"
          />
          <textarea
            id="mem-quote"
            rows={2}
            value={quote}
            onChange={(e) => {
              setQuote(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="Trích dẫn câu nói khiến cậu rung động..."
          />
          <textarea
            id="mem-thought"
            rows={3}
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            placeholder="Cảm nghĩ của cậu lúc này..."
          />
          <button type="submit" className="btn-save-mem font-editorial font-semibold">
            Ghi lại vào tim ✨
          </button>
        </form>

        {/* Nút cất giữ & khôi phục ký ức */}
        <div className="mt-3 pt-3 border-t border-[#d4a373]/40 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            className="btn-play !mt-0 text-xs sm:text-sm inline-flex items-center gap-1"
            onClick={handleSaoLuuKyUc}
          >
            📦 Gói gém ký ức (Tải về)
          </button>

          <label
            className="btn-play !mt-0 text-xs sm:text-sm inline-flex items-center gap-1"
            style={{ cursor: 'pointer' }}
          >
            🗝️ Tìm lại ký ức (Tải lên)
            <input
              type="file"
              accept=".json"
              onChange={handleKhoiPhucKyUc}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {backupNotice && (
          <div
            role="status"
            className={`mt-2.5 p-2 rounded-lg text-xs text-center font-medium border ${
              backupNotice.isError
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-[#8b5a2b]/15 text-[#5c4033] border-[#d4a373]'
            }`}
          >
            {backupNotice.text}
          </div>
        )}

        {/* Nơi hiển thị các trang nhật ký đã viết */}
        <div id="diary-entries" className="mt-4">
          {memories.length === 0 ? (
            <p
              style={{
                textAlign: 'center',
                color: '#a8948a',
                marginTop: '20px',
                fontStyle: 'italic',
              }}
            >
              Sổ vẫn còn trắng... Hãy lưu lại câu nói đầu tiên nhé!
            </p>
          ) : (
            memories.map((mem, index) => (
              <div key={`${mem.date}-${index}`} className="memory-item relative group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="mem-date">
                    🕒 {mem.date} • Trò chuyện cùng <b>{mem.character}</b>
                  </div>
                  {confirmDeleteIdx === index ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[11px] text-rose-600 font-medium">Xác nhận?</span>
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(index)}
                        className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[10px] font-semibold hover:bg-rose-600 transition-colors"
                      >
                        Xóa
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteIdx(null)}
                        className="px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 text-[10px] hover:bg-stone-300 transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn-del-mem"
                      onClick={() => handleDeleteClick(index)}
                      title="Xóa ký ức này"
                    >
                      Xóa
                    </button>
                  )}
                </div>
                <div className="mem-quote">&ldquo;{mem.quote}&rdquo;</div>
                {mem.thought && <div className="mem-thought">Cảm nghĩ: {mem.thought}</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

