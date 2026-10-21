import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { CharacterFormInput, CharacterProfile } from '../types/character';
import { validateCharacterForm } from '../utils/characterLogic';

interface CharacterFormModalProps {
  isOpen: boolean;
  editingCharacter: CharacterProfile | null;
  onClose: () => void;
  onSave: (input: CharacterFormInput, existingId?: string) => void;
}

const STORAGE_KEY_FORM_DRAFT = 'choco_character_form_draft_v1';

const EMPTY_FORM: CharacterFormInput = {
  name: '',
  birthday: '',
  age: '',
  zodiac: '',
  personality: '',
  tagsText: '',
  shortHook: '',
  backstoryText: '',
  personalityNotes: '',
  openingMessage: '',
  characterLink: '',
  platformName: 'Character.AI',
  creatorHandle: '@Creator',
  customAvatarUrl: '',
};

function readSavedFormDraft(): CharacterFormInput {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_FORM_DRAFT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...EMPTY_FORM, ...parsed };
      }
    }
  } catch {
    // Ignore storage errors
  }
  return EMPTY_FORM;
}

export const CharacterFormModal: React.FC<CharacterFormModalProps> = ({
  isOpen,
  editingCharacter,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<CharacterFormInput>(() => readSavedFormDraft());
  const [errors, setErrors] = useState<Partial<Record<keyof CharacterFormInput, string>>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (editingCharacter) {
      setForm({
        name: editingCharacter.name,
        birthday: editingCharacter.birthday || '',
        age: editingCharacter.age || '',
        zodiac: editingCharacter.zodiac || '',
        personality: editingCharacter.personality || '',
        tagsText: editingCharacter.tags.join(', '),
        shortHook: editingCharacter.shortHook || '',
        backstoryText: editingCharacter.backstory.join('\n\n'),
        personalityNotes: editingCharacter.personalityNotes,
        openingMessage: editingCharacter.openingMessage,
        characterLink: editingCharacter.characterLink,
        platformName: editingCharacter.platformName,
        creatorHandle: editingCharacter.creatorHandle,
        customAvatarUrl: editingCharacter.customAvatarUrl || '',
      });
    } else {
      setForm(readSavedFormDraft());
    }
    setErrors({});
  }, [editingCharacter, isOpen]);

  // Save draft continuously while adding a new character so switching tabs or accidental reloads never lose input
  useEffect(() => {
    if (!isOpen || editingCharacter) return;
    try {
      sessionStorage.setItem(STORAGE_KEY_FORM_DRAFT, JSON.stringify(form));
    } catch {
      // Ignore storage errors
    }
  }, [form, isOpen, editingCharacter]);

  if (!isOpen) return null;

  const handleExplicitClose = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY_FORM_DRAFT);
    } catch {
      // Ignore
    }
    setForm(EMPTY_FORM);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCharacterForm(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    try {
      sessionStorage.removeItem(STORAGE_KEY_FORM_DRAFT);
    } catch {
      // Ignore
    }
    setForm(EMPTY_FORM);
    onSave(form, editingCharacter?.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="character-form-title"
    >
      <div className="relative w-full max-w-2xl bg-[#121215] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-[#FAFAFA]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#18181B]">
          <div>
            <div className="text-[11px] text-[#A1A1AA] tracking-wide">
              Biểu mẫu rút gọn · Lưu trữ trực tiếp
            </div>
            <h2 id="character-form-title" className="text-xl font-editorial font-bold text-white">
              {editingCharacter
                ? `Chỉnh sửa hồ sơ: ${editingCharacter.name}`
                : 'Thêm hồ sơ nhân vật mới'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleExplicitClose}
            aria-label="Đóng biểu mẫu"
            className="p-1.5 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="char-name" className="block text-xs font-semibold text-[#E4E4E7] mb-1">
                Tên nhân vật *
              </label>
              <input
                id="char-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Bạch Khuê"
                className="w-full px-3.5 py-2 text-sm bg-[#09090B] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
              />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="char-creator" className="block text-xs font-semibold text-[#E4E4E7] mb-1">
                Tên Creator (Tác giả) *
              </label>
              <input
                id="char-creator"
                type="text"
                value={form.creatorHandle}
                onChange={(e) => setForm({ ...form, creatorHandle: e.target.value })}
                placeholder="VD: @SonTraArchive"
                className="w-full px-3.5 py-2 text-sm bg-[#09090B] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label htmlFor="char-tags" className="block text-xs font-semibold text-[#E4E4E7] mb-1">
                Nhãn (Tags, cách nhau dấu phẩy)
              </label>
              <input
                id="char-tags"
                type="text"
                value={form.tagsText}
                onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
                placeholder="VD: Bí ẩn, Đêm mưa"
                className="w-full px-3.5 py-2 text-sm bg-[#09090B] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
              />
            </div>
          </div>

          {/* Personal Info Fields: Ngày sinh, Tuổi, Cung, Tính cách */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="char-birthday" className="block text-xs font-semibold text-[#E4E4E7] mb-1">
                Ngày sinh
              </label>
              <input
                id="char-birthday"
                type="text"
                value={form.birthday || ''}
                onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                placeholder="VD: 15/10 hoặc 20/08"
                className="w-full px-3.5 py-2 text-sm bg-[#09090B] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label htmlFor="char-age" className="block text-xs font-semibold text-[#E4E4E7] mb-1">
                Tuổi
              </label>
              <input
                id="char-age"
                type="text"
                value={form.age || ''}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="VD: 24 tuổi"
                className="w-full px-3.5 py-2 text-sm bg-[#09090B] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label htmlFor="char-zodiac" className="block text-xs font-semibold text-[#E4E4E7] mb-1">
                Cung (Hoàng đạo)
              </label>
              <input
                id="char-zodiac"
                type="text"
                value={form.zodiac || ''}
                onChange={(e) => setForm({ ...form, zodiac: e.target.value })}
                placeholder="VD: Bọ Cạp / Thiên Yết"
                className="w-full px-3.5 py-2 text-sm bg-[#09090B] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label
                htmlFor="char-personal-trait"
                className="block text-xs font-semibold text-[#E4E4E7] mb-1"
              >
                Tính cách
              </label>
              <input
                id="char-personal-trait"
                type="text"
                value={form.personality || ''}
                onChange={(e) => setForm({ ...form, personality: e.target.value })}
                placeholder="VD: Điềm tĩnh, ôn nhu, chiều chuộng"
                className="w-full px-3.5 py-2 text-sm bg-[#09090B] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="char-short-hook" className="block text-xs font-semibold text-[#E4E4E7] mb-1">
              Lời tựa / Câu trích dẫn ngắn (Tùy chọn)
            </label>
            <input
              id="char-short-hook"
              type="text"
              value={form.shortHook || ''}
              onChange={(e) => setForm({ ...form, shortHook: e.target.value })}
              placeholder="Câu trích dẫn hiển thị dưới tên nhân vật..."
              className="w-full px-3.5 py-2 text-sm bg-[#09090B] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label htmlFor="char-backstory" className="block text-xs font-semibold text-[#E4E4E7] mb-1">
              Backstory (Tiểu sử & Quá khứ nhân vật) *
            </label>
            <textarea
              id="char-backstory"
              rows={4}
              value={form.backstoryText}
              onChange={(e) => setForm({ ...form, backstoryText: e.target.value })}
              placeholder="Nhập câu chuyện quá khứ, nguồn gốc và động cơ của nhân vật (xuống dòng để tách đoạn)..."
              className="w-full px-3.5 py-2 text-sm bg-[#09090B] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
            />
            {errors.backstoryText && (
              <p className="text-xs text-red-400 mt-1">{errors.backstoryText}</p>
            )}
          </div>

          <div>
            <label htmlFor="char-opening" className="block text-xs font-semibold text-[#E4E4E7] mb-1">
              Tin nhắn mở đầu (Opening Message) *
            </label>
            <textarea
              id="char-opening"
              rows={4}
              value={form.openingMessage}
              onChange={(e) => setForm({ ...form, openingMessage: e.target.value })}
              placeholder="*Đặt phần dẫn cảnh trong dấu sao* và &quot;lời thoại trong dấu ngoặc kép&quot;..."
              className="w-full px-3.5 py-2 text-sm bg-[#09090B] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
            />
            {errors.openingMessage && (
              <p className="text-xs text-red-400 mt-1">{errors.openingMessage}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="char-link" className="block text-xs font-semibold text-[#E4E4E7] mb-1">
                Link nhân vật (URL) *
              </label>
              <input
                id="char-link"
                type="url"
                value={form.characterLink}
                onChange={(e) => setForm({ ...form, characterLink: e.target.value })}
                placeholder="https://character.ai/chat/..."
                className="w-full px-3.5 py-2 text-sm bg-[#09090B] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white font-mono-num"
              />
              {errors.characterLink && (
                <p className="text-xs text-red-400 mt-1">{errors.characterLink}</p>
              )}
            </div>

            <div>
              <label htmlFor="char-platform" className="block text-xs font-semibold text-[#E4E4E7] mb-1">
                Tên nền tảng
              </label>
              <input
                id="char-platform"
                type="text"
                value={form.platformName}
                onChange={(e) => setForm({ ...form, platformName: e.target.value })}
                placeholder="Character.AI / JanitorAI"
                className="w-full px-3.5 py-2 text-sm bg-[#09090B] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="char-avatar" className="block text-xs font-semibold text-[#E4E4E7] mb-1">
                Link ảnh chân dung (Tùy chọn)
              </label>
              <input
                id="char-avatar"
                type="url"
                value={form.customAvatarUrl}
                onChange={(e) => setForm({ ...form, customAvatarUrl: e.target.value })}
                placeholder="https://... (để trống dùng tranh mặc định)"
                className="w-full px-3.5 py-2 text-sm bg-[#09090B] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
              />
              {errors.customAvatarUrl && (
                <p className="text-xs text-red-400 mt-1">{errors.customAvatarUrl}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="char-personality"
                className="block text-xs font-semibold text-[#E4E4E7] mb-1"
              >
                Ghi chú bổ sung (Tùy chọn)
              </label>
              <input
                id="char-personality"
                type="text"
                value={form.personalityNotes}
                onChange={(e) => setForm({ ...form, personalityNotes: e.target.value })}
                placeholder="VD: Nói chuyện từ tốn, quan sát tỉ mỉ..."
                className="w-full px-3.5 py-2 text-sm bg-[#09090B] text-white placeholder-[#71717A] border border-[#27272A] rounded-xl focus:outline-none focus:border-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27272A]">
            <button
              type="button"
              onClick={handleExplicitClose}
              className="px-4 py-2 text-xs font-medium text-[#A1A1AA] hover:text-white bg-[#18181B] border border-[#27272A] rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-[#09090B] bg-white hover:bg-[#E4E4E7] rounded-xl transition-colors cursor-pointer"
            >
              {editingCharacter ? 'Lưu thay đổi' : 'Tạo hồ sơ nhân vật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
