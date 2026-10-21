import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Sparkles, X } from 'lucide-react';
import type { CharacterProfile } from '../types/character';
import { CharacterArtwork } from './CharacterArtwork';

interface RandomPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: CharacterProfile[];
  onSelectCharacter: (id: string) => void;
}

export const RandomPickerModal: React.FC<RandomPickerModalProps> = ({
  isOpen,
  onClose,
  characters,
  onSelectCharacter,
}) => {
  const [isRolling, setIsRolling] = useState(false);
  const [displayText, setDisplayText] = useState('???');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterProfile | null>(null);
  const [isWinner, setIsWinner] = useState(false);
  const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rollTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    rollTimeoutsRef.current.forEach(clearTimeout);
    rollTimeoutsRef.current = [];
  };

  useEffect(() => {
    if (!isOpen) {
      clearAllTimers();
      setIsRolling(false);
      setDisplayText('???');
      setSelectedCharacter(null);
      setIsWinner(false);
    }
    return () => clearAllTimers();
  }, [isOpen]);

  if (!isOpen) return null;

  // Hàm xử lý sự kiện chọn ngẫu nhiên với setTimeout kéo dài 2-3 giây (2.6s) tạo cảm giác hồi hộp
  const handleStartRoll = () => {
    if (characters.length === 0 || isRolling) return;

    clearAllTimers();
    setIsRolling(true);
    setIsWinner(false);
    setSelectedCharacter(null);

    // Giai đoạn 1: Tên nhảy cực nhanh liên tục (mỗi 60ms)
    rollIntervalRef.current = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * characters.length);
      setDisplayText(characters[randomIndex].name);
    }, 60);

    // Giai đoạn 2 (sau 1.7s): Giảm tốc độ quay xuống 140ms để tăng hồi hộp
    const t1 = setTimeout(() => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * characters.length);
        setDisplayText(characters[randomIndex].name);
      }, 140);
    }, 1700);

    // Giai đoạn 3 (sau 2.2s): Quay chậm lại 260ms tạo kịch tính đỉnh điểm
    const t2 = setTimeout(() => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * characters.length);
        setDisplayText(characters[randomIndex].name);
      }, 260);
    }, 2200);

    // Chốt kết quả: setTimeout kéo dài khoảng 2.6 giây (trong khoảng 2-3s) trước khi hiển thị kết quả cuối cùng
    const t3 = setTimeout(() => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);

      const finalWinner = characters[Math.floor(Math.random() * characters.length)];
      setDisplayText(finalWinner.name);
      setSelectedCharacter(finalWinner);
      setIsWinner(true);
      setIsRolling(false);
    }, 2600);

    rollTimeoutsRef.current = [t1, t2, t3];
  };

  const handleOpenWinnerProfile = () => {
    if (selectedCharacter) {
      onSelectCharacter(selectedCharacter.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="random-picker-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRolling) onClose();
      }}
    >
      <div className="relative w-full max-w-lg my-auto text-center space-y-4">
        {/* Close button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isRolling}
            aria-label="Đóng bảng chọn ngẫu nhiên"
            className="p-2 rounded-full bg-[#18181B] text-[#A1A1AA] hover:text-white border border-[#27272A] cursor-pointer transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Khối chứa câu Quote */}
        <div className="quote-container">
          <p className="choco-quote">
            &ldquo;Ngọt ngào nhưng vương chút đắng nhẹ, như cách ta nhớ về một người...&rdquo;
          </p>
        </div>

        {/* Random Card Glass Box */}
        <div className="random-card glass-box">
          <h3
            id="random-picker-title"
            className="random-title font-editorial text-2xl font-bold tracking-wide text-white drop-shadow-md"
          >
            Hôm nay bé sẽ hẹn hò cùng ai?
          </h3>

          {/* Khung hiển thị tên */}
          <div className="name-display">
            <span
              id="result-text"
              className={`font-editorial ${isWinner ? 'winner-anim' : ''}`}
            >
              {displayText}
            </span>
          </div>

          {/* Dòng trạng thái kịch tính khi đang quay */}
          {isRolling && (
            <div className="text-xs text-pink-200/90 font-medium italic animate-pulse mb-3">
              Đang quay tìm chàng trai định mệnh cho bé, chờ một chút nha... ✨
            </div>
          )}

          {/* Nút bấm bắt đầu */}
          <button
            id="roll-btn"
            type="button"
            className="magic-btn w-full sm:w-auto inline-flex items-center justify-center gap-2"
            onClick={handleStartRoll}
            disabled={isRolling || characters.length === 0}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isRolling ? 'Đang quay kết quả...' : isWinner ? 'Chọn lại người khác' : 'Bắt đầu chọn'}
            </span>
          </button>

          {/* Revealed Winner Profile Preview */}
          {selectedCharacter && isWinner && (
            <div className="mt-6 pt-5 border-t border-white/20 text-left space-y-3 animate-fade-in">
              <div className="flex items-center gap-3 bg-white/20 p-3 rounded-xl border border-white/30">
                <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 spin-border">
                  <CharacterArtwork character={selectedCharacter} className="w-full h-full rounded-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-white/80 font-mono-num truncate">
                    Creator: {selectedCharacter.creatorHandle}
                  </div>
                  <div className="text-lg font-editorial font-bold text-white truncate">
                    {selectedCharacter.name}
                  </div>
                  <div className="text-xs text-pink-200/90 truncate italic">
                    {selectedCharacter.personalityNotes || selectedCharacter.shortHook}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenWinnerProfile}
                className="link-button w-full py-2.5 px-4 text-[#09090B] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Xem hồ sơ & hẹn hò cùng {selectedCharacter.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
