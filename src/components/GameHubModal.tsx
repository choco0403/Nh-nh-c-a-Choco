import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { DiaryMemoryItem } from '../types/character';
import {
  buildKyUcBackupPayload,
  catVaoKho,
  createMemoryDeckForLevel,
  DANH_SACH_MAT_NGU,
  DANH_SACH_THU_TAY,
  evaluateRiddleAnswer,
  getPairCountForLevel,
  isStarJarComplete,
  layTuKho,
  parseKyUcRestorePayload,
  pickRandomSkyPolaroid,
  type MatNguItem,
  type MemoryDifficultyLevel,
  type SkyPolaroidItem,
} from '../utils/characterLogic';

export type MinigameRoomId = 'riddle' | 'memory' | 'star';

interface GameHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreMemories?: (restoredMemories: DiaryMemoryItem[], restoredStarScore?: unknown) => void;
}

interface MemoryCardState {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface FallingStarItem {
  id: number;
  leftPercent: number;
  topPx: number;
  speed: number;
}

export const GameHubModal: React.FC<GameHubModalProps> = ({
  isOpen,
  onClose,
  onRestoreMemories,
}) => {
  const [activeRoom, setActiveRoom] = useState<MinigameRoomId | null>(null);
  const [hubBackupNotice, setHubBackupNotice] = useState<{
    text: string;
    isError?: boolean;
  } | null>(null);

  // ==========================================
  // GAME 1: MẬT NGỮ GIẤU KÍN (10 CÂU NGẪU NHIÊN + THƯ TAY BÍ MẬT)
  // ==========================================
  const [currentRiddle, setCurrentRiddle] = useState<MatNguItem>(
    () => DANH_SACH_MAT_NGU[Math.floor(Math.random() * DANH_SACH_MAT_NGU.length)]
  );
  const [riddleInput, setRiddleInput] = useState('');
  const [riddleResult, setRiddleResult] = useState<{
    message: string;
    color: string;
  } | null>(null);
  const [isRewardLetterOpen, setIsRewardLetterOpen] = useState(false);
  const [rewardLetterContent, setRewardLetterContent] = useState(DANH_SACH_THU_TAY[0]);

  const initRiddleGame = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * DANH_SACH_MAT_NGU.length);
    setCurrentRiddle(DANH_SACH_MAT_NGU[randomIndex]);
    setRiddleInput('');
    setRiddleResult(null);
  }, []);

  const closeRewardLetter = useCallback(() => {
    setIsRewardLetterOpen(false);
  }, []);

  const handleCheckRiddle = useCallback(() => {
    const res = evaluateRiddleAnswer(riddleInput, currentRiddle);
    if (res.isCorrect) {
      setActiveRoom(null);
      const randomLetter =
        DANH_SACH_THU_TAY[Math.floor(Math.random() * DANH_SACH_THU_TAY.length)];
      setRewardLetterContent(randomLetter);
      setIsRewardLetterOpen(true);
      setRiddleInput('');
      setRiddleResult(null);
    } else {
      setRiddleResult({ message: res.message, color: res.color });
    }
  }, [riddleInput, currentRiddle]);

  // ==========================================
  // GAME 2: LẬT THẺ KÝ ỨC (3 MỨC ĐỘ + ẢNH POLAROID)
  // ==========================================
  const [memoryLevel, setMemoryLevel] = useState<MemoryDifficultyLevel>('medium');
  const [memoryCards, setMemoryCards] = useState<MemoryCardState[]>([]);
  const [firstCardIdx, setFirstCardIdx] = useState<number | null>(null);
  const [lockBoard, setLockBoard] = useState(false);
  const [memoryStatus, setMemoryStatus] = useState('');
  const [showReplayBtn, setShowReplayBtn] = useState(false);
  const [isPolaroidVisible, setIsPolaroidVisible] = useState(false);
  const [currentSkyPolaroid, setCurrentSkyPolaroid] = useState<SkyPolaroidItem>(() =>
    pickRandomSkyPolaroid()
  );
  const unflipTimeoutRef = useRef<number | null>(null);
  const polaroidTimeoutRef = useRef<number | null>(null);

  const initMemoryGameForLevel = useCallback((level: MemoryDifficultyLevel) => {
    if (unflipTimeoutRef.current) {
      window.clearTimeout(unflipTimeoutRef.current);
      unflipTimeoutRef.current = null;
    }
    if (polaroidTimeoutRef.current) {
      window.clearTimeout(polaroidTimeoutRef.current);
      polaroidTimeoutRef.current = null;
    }
    const shuffled = createMemoryDeckForLevel(level);
    setMemoryCards(
      shuffled.map((symbol, idx) => ({
        id: idx,
        symbol,
        isFlipped: false,
        isMatched: false,
      }))
    );
    setFirstCardIdx(null);
    setLockBoard(false);
    setMemoryStatus('');
    setShowReplayBtn(false);
    setIsPolaroidVisible(false);
  }, []);

  const initMemoryGame = useCallback(() => {
    initMemoryGameForLevel(memoryLevel);
  }, [initMemoryGameForLevel, memoryLevel]);

  const handleSetMemoryLevel = useCallback(
    (level: MemoryDifficultyLevel) => {
      setMemoryLevel(level);
      initMemoryGameForLevel(level);
    },
    [initMemoryGameForLevel]
  );

  const closePolaroid = useCallback(() => {
    setIsPolaroidVisible(false);
    setMemoryStatus('');
    setShowReplayBtn(true);
  }, []);

  const handleFlipMemoryCard = (idx: number) => {
    if (lockBoard) return;
    const clicked = memoryCards[idx];
    if (!clicked || clicked.isFlipped || clicked.isMatched || idx === firstCardIdx) return;

    const nextCards = memoryCards.map((c, i) =>
      i === idx ? { ...c, isFlipped: true } : c
    );
    setMemoryCards(nextCards);

    if (firstCardIdx === null) {
      setFirstCardIdx(idx);
      return;
    }

    const firstCard = nextCards[firstCardIdx];
    const secondCard = nextCards[idx];

    if (firstCard.symbol === secondCard.symbol) {
      const matchedCards = nextCards.map((c, i) =>
        i === firstCardIdx || i === idx ? { ...c, isMatched: true } : c
      );
      setMemoryCards(matchedCards);
      setFirstCardIdx(null);
      setLockBoard(false);

      const matchedPairs = matchedCards.filter((c) => c.isMatched).length / 2;
      const totalPairs = getPairCountForLevel(memoryLevel);
      if (matchedPairs === totalPairs) {
        setMemoryStatus('Trọn vẹn rồi... ✨');
        setShowReplayBtn(false);
        setCurrentSkyPolaroid((prev) => pickRandomSkyPolaroid(prev.id));
        polaroidTimeoutRef.current = window.setTimeout(() => {
          setIsPolaroidVisible(true);
          polaroidTimeoutRef.current = null;
        }, 500);
      }
    } else {
      setLockBoard(true);
      const prevFirst = firstCardIdx;
      unflipTimeoutRef.current = window.setTimeout(() => {
        setMemoryCards((prev) =>
          prev.map((c, i) =>
            i === prevFirst || i === idx ? { ...c, isFlipped: false } : c
          )
        );
        setFirstCardIdx(null);
        setLockBoard(false);
        unflipTimeoutRef.current = null;
      }, 800);
    }
  };

  // ==========================================
  // GAME 3: LỌ GOM SAO (DI CHUYỂN LỌ + BAN PHƯỚC LẤP LÁNH)
  // ==========================================
  const [starScore, setStarScore] = useState<number>(() => {
    const saved = layTuKho<unknown>('diemGomSao');
    if (typeof saved === 'number' && Number.isFinite(saved) && saved >= 0) {
      return Math.min(15, Math.floor(saved));
    }
    return 0;
  });
  const [isStarGameRunning, setIsStarGameRunning] = useState(false);
  const [hasPlayedStarGame, setHasPlayedStarGame] = useState(false);
  const [starResult, setStarResult] = useState('');
  const [fallingStars, setFallingStars] = useState<FallingStarItem[]>([]);
  const [jarLeftStyle, setJarLeftStyle] = useState<string>('50%');
  const [isJarGlowing, setIsJarGlowing] = useState(false);

  const starSkyRef = useRef<HTMLDivElement | null>(null);
  const catcherJarRef = useRef<HTMLDivElement | null>(null);
  const starSpawnIntervalRef = useRef<number | null>(null);
  const gameLoopIntervalRef = useRef<number | null>(null);
  const jarGlowTimeoutRef = useRef<number | null>(null);
  const starIdCounterRef = useRef(0);
  const starScoreRef = useRef(starScore);
  const starsRef = useRef<FallingStarItem[]>([]);
  const blessingCleanupRef = useRef<(() => void) | null>(null);

  const stopStarGameLoops = useCallback(() => {
    if (starSpawnIntervalRef.current) {
      window.clearInterval(starSpawnIntervalRef.current);
      starSpawnIntervalRef.current = null;
    }
    if (gameLoopIntervalRef.current) {
      window.clearInterval(gameLoopIntervalRef.current);
      gameLoopIntervalRef.current = null;
    }
  }, []);

  const triggerStarBlessing = useCallback(() => {
    if (blessingCleanupRef.current) {
      blessingCleanupRef.current();
      blessingCleanupRef.current = null;
    }

    document.body.classList.add('star-blessing');

    const existing = document.querySelectorAll('.cursor-blessing');
    existing.forEach((el) => el.remove());

    const blessingText = document.createElement('div');
    blessingText.className = 'cursor-blessing';
    blessingText.innerText = 'Vũ trụ đang ôm cậu vào lòng...';
    document.body.appendChild(blessingText);

    const followCursor = (e: MouseEvent) => {
      blessingText.style.left = `${e.clientX + 15}px`;
      blessingText.style.top = `${e.clientY + 15}px`;
    };
    document.addEventListener('mousemove', followCursor);

    let fadeTimeoutId: number | null = null;
    const expireTimeoutId = window.setTimeout(() => {
      document.body.classList.remove('star-blessing');
      blessingText.style.opacity = '0';
      fadeTimeoutId = window.setTimeout(() => {
        document.removeEventListener('mousemove', followCursor);
        blessingText.remove();
      }, 800);
    }, 4000);

    blessingCleanupRef.current = () => {
      window.clearTimeout(expireTimeoutId);
      if (fadeTimeoutId) window.clearTimeout(fadeTimeoutId);
      document.removeEventListener('mousemove', followCursor);
      document.body.classList.remove('star-blessing');
      blessingText.remove();
    };
  }, []);

  const endGameStar = useCallback(() => {
    stopStarGameLoops();
    starsRef.current = [];
    setFallingStars([]);
    setIsStarGameRunning(false);
    setHasPlayedStarGame(true);
    setStarResult('Đủ đầy rồi. Hãy nhìn ra xung quanh xem... ✨');
    triggerStarBlessing();
  }, [stopStarGameLoops, triggerStarBlessing]);

  const flashJarGlow = useCallback(() => {
    setIsJarGlowing(true);
    if (jarGlowTimeoutRef.current) {
      window.clearTimeout(jarGlowTimeoutRef.current);
    }
    jarGlowTimeoutRef.current = window.setTimeout(() => {
      setIsJarGlowing(false);
      jarGlowTimeoutRef.current = null;
    }, 200);
  }, []);

  const startStarGame = useCallback(() => {
    stopStarGameLoops();
    if (blessingCleanupRef.current) {
      blessingCleanupRef.current();
      blessingCleanupRef.current = null;
    }
    starScoreRef.current = 0;
    starsRef.current = [];
    setStarScore(0);
    catVaoKho('diemGomSao', 0);
    setStarResult('');
    setFallingStars([]);
    setIsStarGameRunning(true);

    // 1. Tạo sao rơi liên tục mỗi 600ms
    starSpawnIntervalRef.current = window.setInterval(() => {
      if (isStarJarComplete(starScoreRef.current, 15)) return;
      starIdCounterRef.current += 1;
      const newStar: FallingStarItem = {
        id: starIdCounterRef.current,
        leftPercent: Math.random() * 80 + 10, // Rơi từ 10% đến 90% chiều ngang
        topPx: -20,
        speed: Math.random() * 2 + 1.5, // Tốc độ rơi ngẫu nhiên
      };
      starsRef.current = [...starsRef.current, newStar];
      setFallingStars(starsRef.current);
    }, 600);

    // 2. Vòng lặp kiểm tra va chạm (60 FPS)
    gameLoopIntervalRef.current = window.setInterval(() => {
      const skyEl = starSkyRef.current;
      const jarEl = catcherJarRef.current;
      if (!skyEl || !jarEl) return;

      const skyRect = skyEl.getBoundingClientRect();
      const jarRect = jarEl.getBoundingClientRect();

      let caughtCount = 0;
      const remainingStars: FallingStarItem[] = [];

      for (const star of starsRef.current) {
        const nextTop = star.topPx + star.speed;
        const starCenterX = skyRect.left + (star.leftPercent / 100) * skyRect.width;
        const starLeft = starCenterX - 10;
        const starRight = starCenterX + 10;
        const starTop = skyRect.top + nextTop;
        const starBottom = starTop + 20;

        // Kiểm tra nếu sao chạm vào miệng lọ
        if (
          starBottom >= jarRect.top + 10 &&
          starTop <= jarRect.bottom &&
          starRight >= jarRect.left &&
          starLeft <= jarRect.right
        ) {
          caughtCount += 1;
          continue;
        }

        // Xóa sao nếu rơi quá đáy bầu trời (280px)
        if (nextTop > 280) {
          continue;
        }

        remainingStars.push({
          ...star,
          topPx: nextTop,
        });
      }

      starsRef.current = remainingStars;
      setFallingStars(remainingStars);

      if (caughtCount > 0) {
        const nextScore = Math.min(15, starScoreRef.current + caughtCount);
        starScoreRef.current = nextScore;
        setStarScore(nextScore);
        catVaoKho('diemGomSao', nextScore);
        flashJarGlow();

        if (isStarJarComplete(nextScore, 15)) {
          endGameStar();
        }
      }
    }, 1000 / 60);
  }, [stopStarGameLoops, flashJarGlow, endGameStar]);

  const updateJarPosition = useCallback((clientX: number) => {
    const skyEl = starSkyRef.current;
    if (!skyEl) return;
    const rect = skyEl.getBoundingClientRect();
    let x = clientX - rect.left;
    if (x < 20) x = 20;
    if (x > rect.width - 20) x = rect.width - 20;
    setJarLeftStyle(`${x}px`);
  }, []);

  // ==========================================
  // SAO LƯU & KHÔI PHỤC KÝ ỨC (GÓI GÉM & TÌM LẠI)
  // ==========================================
  const handleSaoLuuKyUc = useCallback(() => {
    const duLieuBaoMat = buildKyUcBackupPayload();
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(duLieuBaoMat));
    const nutTai = document.createElement('a');
    nutTai.setAttribute('href', dataStr);
    nutTai.setAttribute('download', 'GocCuaChoco_KyUc.json');
    document.body.appendChild(nutTai);
    nutTai.click();
    nutTai.remove();
    setHubBackupNotice({
      text: 'Đã cất giữ ký ức an toàn vào máy tính của cậu. 🤎',
      isError: false,
    });
  }, []);

  const handleKhoiPhucKyUc = useCallback(
    (event: React.ChangeEvent<HTMLInputElement> | { target?: { files?: FileList | null; value?: string } }) => {
      const file = event?.target?.files?.[0];
      if (!file) return;

      const docFile = new FileReader();
      docFile.onload = (e) => {
        const rawText = typeof e.target?.result === 'string' ? e.target.result : '';
        const result = parseKyUcRestorePayload(rawText);
        if (!result.valid) {
          setHubBackupNotice({
            text: result.error || 'Hình như đây không phải là chiếc hộp ký ức của Choco...',
            isError: true,
          });
          return;
        }

        const restoredMemories = (Array.isArray(result.kyUc) ? result.kyUc : []) as DiaryMemoryItem[];
        catVaoKho('chocoMemories', restoredMemories);
        catVaoKho('diemGomSao', result.diemSao);
        if (typeof result.diemSao === 'number' && Number.isFinite(result.diemSao)) {
          const clamped = Math.min(15, Math.max(0, Math.floor(result.diemSao)));
          starScoreRef.current = clamped;
          setStarScore(clamped);
        }
        onRestoreMemories?.(restoredMemories, result.diemSao);
        setHubBackupNotice({
          text: 'Ký ức đã quay về! ✨',
          isError: false,
        });
      };
      docFile.readAsText(file);
      if (event.target && 'value' in event.target) {
        event.target.value = '';
      }
    },
    [onRestoreMemories]
  );

  // ==========================================
  // QUẢN LÝ ĐÓNG MỞ PHÒNG GAME
  // ==========================================
  const openGameModal = useCallback(
    (gameId: MinigameRoomId) => {
      onClose(); // Đóng menu tổng (#game-hub-modal)
      setActiveRoom(gameId);
      if (gameId === 'riddle') {
        initRiddleGame();
      } else if (gameId === 'memory') {
        initMemoryGameForLevel(memoryLevel);
      }
    },
    [onClose, initRiddleGame, initMemoryGameForLevel, memoryLevel]
  );

  const closeGameModal = useCallback(
    (gameId: MinigameRoomId) => {
      if (gameId === 'star') {
        stopStarGameLoops();
        if (blessingCleanupRef.current) {
          blessingCleanupRef.current();
          blessingCleanupRef.current = null;
        }
        starsRef.current = [];
        setFallingStars([]);
        setIsStarGameRunning(false);
        setStarResult('');
      }
      setActiveRoom((prev) => (prev === gameId ? null : prev));
    },
    [stopStarGameLoops]
  );

  useEffect(() => {
    const win = window as unknown as {
      openGameModal?: (id: MinigameRoomId) => void;
      closeGameModal?: (id: MinigameRoomId) => void;
      initRiddleGame?: () => void;
      checkRiddle?: () => void;
      closeRewardLetter?: () => void;
      setMemoryLevel?: (level: MemoryDifficultyLevel) => void;
      initMemoryGame?: () => void;
      closePolaroid?: () => void;
      startStarGame?: () => void;
      catVaoKho?: typeof catVaoKho;
      layTuKho?: typeof layTuKho;
      saoLuuKyUc?: () => void;
      khoiPhucKyUc?: typeof handleKhoiPhucKyUc;
    };
    win.openGameModal = openGameModal;
    win.closeGameModal = closeGameModal;
    win.initRiddleGame = initRiddleGame;
    win.checkRiddle = handleCheckRiddle;
    win.closeRewardLetter = closeRewardLetter;
    win.setMemoryLevel = handleSetMemoryLevel;
    win.initMemoryGame = initMemoryGame;
    win.closePolaroid = closePolaroid;
    win.startStarGame = startStarGame;
    win.catVaoKho = catVaoKho;
    win.layTuKho = layTuKho;
    win.saoLuuKyUc = handleSaoLuuKyUc;
    win.khoiPhucKyUc = handleKhoiPhucKyUc;
    return () => {
      delete win.openGameModal;
      delete win.closeGameModal;
      delete win.initRiddleGame;
      delete win.checkRiddle;
      delete win.closeRewardLetter;
      delete win.setMemoryLevel;
      delete win.initMemoryGame;
      delete win.closePolaroid;
      delete win.startStarGame;
      delete win.catVaoKho;
      delete win.layTuKho;
      delete win.saoLuuKyUc;
      delete win.khoiPhucKyUc;
    };
  }, [
    openGameModal,
    closeGameModal,
    initRiddleGame,
    handleCheckRiddle,
    closeRewardLetter,
    handleSetMemoryLevel,
    initMemoryGame,
    closePolaroid,
    startStarGame,
    handleSaoLuuKyUc,
    handleKhoiPhucKyUc,
  ]);

  useEffect(() => {
    return () => {
      stopStarGameLoops();
      if (unflipTimeoutRef.current) {
        window.clearTimeout(unflipTimeoutRef.current);
      }
      if (polaroidTimeoutRef.current) {
        window.clearTimeout(polaroidTimeoutRef.current);
      }
      if (jarGlowTimeoutRef.current) {
        window.clearTimeout(jarGlowTimeoutRef.current);
      }
      if (blessingCleanupRef.current) {
        blessingCleanupRef.current();
      }
    };
  }, [stopStarGameLoops]);

  useEffect(() => {
    if (!isOpen && !activeRoom && !isRewardLetterOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRewardLetterOpen) {
          closeRewardLetter();
        } else if (activeRoom) {
          closeGameModal(activeRoom);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeRoom, isRewardLetterOpen, closeRewardLetter, closeGameModal, onClose]);

  const memoryGridModeClass =
    memoryLevel === 'easy'
      ? 'easy-mode'
      : memoryLevel === 'medium'
        ? 'medium-mode'
        : 'hard-mode';

  return (
    <>
      {/* GIAO DIỆN KHU VƯỜN TRÒ CHƠI (Ban đầu tàng hình) */}
      <div
        id="game-hub-modal"
        className={`game-modal ${isOpen ? 'show-hub' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-hub-title"
        aria-hidden={!isOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="game-container" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="close-game"
            onClick={onClose}
            aria-label="Đóng Khu Vườn Trò Chơi"
          >
            ✖
          </button>
          <h2 id="game-hub-title" className="game-title text-2xl font-bold">
            Khu Vườn Tĩnh Lặng 🌙
          </h2>
          <p className="game-subtitle">Chọn một góc nhỏ để thả lỏng tâm trí...</p>

          <div className="game-list">
            <div
              className="game-card"
              role="button"
              tabIndex={isOpen ? 0 : -1}
              onClick={() => openGameModal('riddle')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openGameModal('riddle');
                }
              }}
            >
              <h3>📜 Mật Ngữ Giấu Kín</h3>
              <p>Mùa thu đè nặng lên trái tim, sinh ra chữ gì?</p>
            </div>

            <div
              className="game-card"
              role="button"
              tabIndex={isOpen ? 0 : -1}
              onClick={() => openGameModal('memory')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openGameModal('memory');
                }
              }}
            >
              <h3>🎴 Lật Thẻ Ký Ức</h3>
              <p>Tìm lại những mảnh ghép đã quên.</p>
            </div>

            <div
              className="game-card"
              role="button"
              tabIndex={isOpen ? 0 : -1}
              onClick={() => openGameModal('star')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openGameModal('star');
                }
              }}
            >
              <h3>✨ Lọ Gom Sao</h3>
              <p>Hứng trọn những bình yên rơi rớt.</p>
            </div>
          </div>

          {/* Nút cất giữ & khôi phục ký ức */}
          <div className="mt-5 pt-4 border-t border-[#5c4033] flex flex-wrap items-center justify-center gap-2.5">
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

          {hubBackupNotice && (
            <div
              role="status"
              className={`mt-3 p-2 rounded-lg text-xs text-center font-medium border ${
                hubBackupNotice.isError
                  ? 'bg-rose-950/60 text-rose-200 border-rose-700/60'
                  : 'bg-[#8b5a2b]/25 text-[#fdf6e3] border-[#d4a373]/50'
              }`}
            >
              {hubBackupNotice.text}
            </div>
          )}
        </div>
      </div>

      {/* 1. PHÒNG GAME MẬT NGỮ */}
      <div
        id="game-riddle"
        className={`game-room hidden-modal ${activeRoom === 'riddle' ? 'show-room' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-riddle-title"
        aria-hidden={activeRoom !== 'riddle'}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeGameModal('riddle');
          }
        }}
      >
        <div className="game-board" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="close-game"
            onClick={() => closeGameModal('riddle')}
            aria-label="Đóng trò chơi Mật Ngữ"
          >
            ✖
          </button>
          <h3 id="game-riddle-title" className="text-lg font-bold text-[#d4a373]">
            Mật Ngữ Giấu Kín
          </h3>
          <p
            id="riddle-question"
            className="italic text-[#a8948a] my-[15px] text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: currentRiddle.cauDo }}
          />
          <input
            type="text"
            id="riddle-input"
            value={riddleInput}
            onChange={(e) => setRiddleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCheckRiddle();
              }
            }}
            placeholder="Nhập đáp án (1 chữ)..."
            aria-label="Nhập đáp án mật ngữ"
            autoComplete="off"
          />
          <button type="button" className="btn-play" onClick={handleCheckRiddle}>
            Giải Mã
          </button>
          <p
            id="riddle-result"
            style={{ color: riddleResult ? riddleResult.color : undefined }}
          >
            {riddleResult?.message || ''}
          </p>
        </div>
      </div>

      {/* PHẦN THƯỞNG GAME 1: LÁ THƯ BÍ MẬT */}
      <div
        id="reward-letter-modal"
        className={`game-room hidden-modal ${isRewardLetterOpen ? 'show-room' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Thư tay bí mật"
        aria-hidden={!isRewardLetterOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeRewardLetter();
          }
        }}
      >
        <div className="reward-letter-paper" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="close-game"
            style={{ color: '#8b5a2b' }}
            onClick={closeRewardLetter}
            aria-label="Đóng thư tay bí mật"
          >
            ✖
          </button>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💌</div>
          <p id="reward-letter-content" className="letter-content">
            {rewardLetterContent}
          </p>
          <p
            style={{
              textAlign: 'right',
              color: '#8b5a2b',
              fontStyle: 'italic',
              marginTop: '20px',
              fontSize: '0.9rem',
            }}
          >
            - Gửi từ một ngày bề bộn -
          </p>
        </div>
      </div>

      {/* 2. PHÒNG GAME LẬT THẺ KÝ ỨC (ĐÃ NÂNG CẤP) */}
      <div
        id="game-memory"
        className={`game-room hidden-modal ${activeRoom === 'memory' ? 'show-room' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-memory-title"
        aria-hidden={activeRoom !== 'memory'}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeGameModal('memory');
          }
        }}
      >
        <div
          className="game-board !max-w-[420px] min-h-[340px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="close-game"
            onClick={() => closeGameModal('memory')}
            aria-label="Đóng trò chơi Lật Thẻ"
          >
            ✖
          </button>
          <h3 id="game-memory-title" className="text-lg font-bold text-[#d4a373]">
            Lật Thẻ Ký Ức
          </h3>

          {/* Nút chọn mức độ */}
          <div className="level-selector" style={{ margin: '15px 0' }}>
            <button
              type="button"
              id="btn-easy"
              className={`btn-level ${memoryLevel === 'easy' ? 'active' : ''}`}
              onClick={() => handleSetMemoryLevel('easy')}
            >
              Thoảng Qua
            </button>
            <button
              type="button"
              id="btn-medium"
              className={`btn-level ${memoryLevel === 'medium' ? 'active' : ''}`}
              onClick={() => handleSetMemoryLevel('medium')}
            >
              Lưu Giữ
            </button>
            <button
              type="button"
              id="btn-hard"
              className={`btn-level ${memoryLevel === 'hard' ? 'active' : ''}`}
              onClick={() => handleSetMemoryLevel('hard')}
            >
              Khắc Sâu
            </button>
          </div>

          <div id="memory-grid" className={`memory-grid ${memoryGridModeClass}`}>
            {memoryCards.map((card, index) => (
              <div
                key={`${memoryLevel}-${card.id}`}
                role="button"
                tabIndex={activeRoom === 'memory' ? 0 : -1}
                aria-label={`Thẻ ký ức ${index + 1}`}
                data-symbol={card.symbol}
                className={`mem-card ${card.isFlipped ? 'flipped' : ''} ${
                  card.isMatched ? 'matched' : ''
                }`}
                onClick={() => handleFlipMemoryCard(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleFlipMemoryCard(index);
                  }
                }}
              >
                {card.isFlipped || card.isMatched ? (
                  <span
                    className={
                      card.isFlipped ? 'inline-block [transform:rotateY(180deg)]' : 'inline-block'
                    }
                  >
                    {card.symbol}
                  </span>
                ) : (
                  ''
                )}
              </div>
            ))}
          </div>

          <p id="memory-status" className="mt-[15px] text-[#e8d0bd] text-sm">
            {memoryStatus}
            {showReplayBtn && (
              <button type="button" className="btn-play" onClick={initMemoryGame}>
                Chơi lại ván mới
              </button>
            )}
          </p>

          {/* PHẦN THƯỞNG GAME 2: ẢNH POLAROID TRƯỢT XUỐNG */}
          <div
            id="reward-polaroid"
            className={`polaroid-frame ${isPolaroidVisible ? 'show-polaroid' : ''}`}
          >
            <img
              src={currentSkyPolaroid.imageUrl}
              alt={currentSkyPolaroid.label}
              style={{
                backgroundImage: `url("${currentSkyPolaroid.svgDataUri}")`,
              }}
              onError={(e) => {
                e.currentTarget.src = currentSkyPolaroid.svgDataUri;
              }}
            />
            <p className="polaroid-text">
              &ldquo;Ký ức giữ lại rồi, giờ thì bình an tiến về phía trước nhé.&rdquo;
            </p>
            <button type="button" className="close-polaroid" onClick={closePolaroid}>
              Cất vào hộp gỗ
            </button>
          </div>
        </div>
      </div>

      {/* 3. PHÒNG GAME LỌ GOM SAO (ĐÃ NÂNG CẤP) */}
      <div
        id="game-star"
        className={`game-room hidden-modal ${activeRoom === 'star' ? 'show-room' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-star-title"
        aria-hidden={activeRoom !== 'star'}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeGameModal('star');
          }
        }}
      >
        <div className="game-board" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="close-game"
            onClick={() => closeGameModal('star')}
            aria-label="Đóng trò chơi Lọ Gom Sao"
          >
            ✖
          </button>
          <h3 id="game-star-title" className="text-lg font-bold text-[#d4a373]">
            Lọ Gom Sao
          </h3>
          <p className="text-[#a8948a] mb-[10px] text-sm">
            Di chuyển lọ để hứng sao rơi. (Đã gom:{' '}
            <span id="star-score" className="text-[#ffb6b9] font-mono-num">
              {starScore}
            </span>
            /15)
          </p>
          <div
            id="star-sky"
            ref={starSkyRef}
            className="star-sky"
            onMouseMove={(e) => updateJarPosition(e.clientX)}
            onTouchMove={(e) => {
              if (e.touches.length > 0) {
                updateJarPosition(e.touches[0].clientX);
              }
            }}
          >
            {fallingStars.map((star) => (
              <div
                key={star.id}
                className="falling-star"
                style={{
                  left: `${star.leftPercent}%`,
                  top: `${star.topPx}px`,
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 pointer-events-none drop-shadow-[0_0_5px_#ffb6b9]"
                  aria-hidden="true"
                >
                  <path d="M12 2L14.6 9.4L22 12L14.6 14.6L12 22L9.4 14.6L2 12L9.4 9.4L12 2Z" />
                </svg>
              </div>
            ))}

            {/* Chiếc lọ hứng sao nằm ở đáy */}
            <div
              id="catcher-jar"
              ref={catcherJarRef}
              className={`catcher-jar ${isJarGlowing ? 'glow' : ''}`}
              style={{ left: jarLeftStyle }}
            >
              🫙
            </div>
          </div>
          {!isStarGameRunning && (
            <button
              type="button"
              id="btn-start-star"
              className="btn-play"
              onClick={startStarGame}
            >
              {hasPlayedStarGame ? 'Gom lại' : 'Bắt đầu hứng'}
            </button>
          )}
          <p id="star-result" className="text-[#e8d0bd] text-sm mt-2">
            {starResult}
          </p>
        </div>
      </div>
    </>
  );
};
