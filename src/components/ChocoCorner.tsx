import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Home, Mail, Sparkles, X } from 'lucide-react';
import type { CharacterProfile } from '../types/character';

export const SECRET_WHISPER_QUOTES: string[] = [
  'Mọi muộn phiền rồi cũng sẽ tan đi như lớp sương này vậy. Hôm nay cậu vất vả rồi! ☁️',
  'Dù thế giới ngoài kia có ồn ào thế nào, ở đây vẫn luôn có một góc nhỏ bình yên dành cho cậu.',
  'Hít một hơi thật sâu nào... Cậu đang làm rất tốt, đừng tự tạo áp lực cho mình quá nhé! 🤎',
  'Phần thưởng cho sự tò mò của cậu là một cái ôm vô hình từ Choco. Chúc cậu một ngày êm đềm!',
  'Có những tâm sự chỉ đành giấu vào đêm đen, và có những nỗi buồn rồi sẽ mờ như sương khói.',
  'Thức khuya không tốt đâu, nhưng nếu lỡ thao thức rồi thì cứ nán lại đây nghe nhạc cùng Choco nhé.',
  'Sương tan rồi, cậu đã tìm thấy chút bình yên nào cho đêm nay chưa? 🌙',
  'Ú òa! Bắt được một người tò mò đang lén lau kính để nhìn trộm nhà Choco nè! (≧◡≦)',
  'Sương mù tan hết rồi, giờ thì đi pha một cốc sữa nóng rồi đi ngủ sớm đi nha!',
  "Chúc mừng bạn đã đăng ký thành công gói 'Nhìn trộm Choco' với giá 50.000đ/lần. Tiền sẽ tự trừ vào tài khoản! 💸",
  'Nội dung này đã bị khóa vì quá chất lượng. Vui lòng nạp lần đầu hoặc ting ting để mở khóa! 💅',
  'Bạn đã mở khóa lời nguyền: Phải bao Choco một ly trà sữa thì mới thoát ra được! 🧋',
  'Tưởng có kho báu hả? Không có đâu, chỉ có nợ nần và những deadline đang chờ bạn thôi. Mau bấm nút quay lại lẹ! 🏃‍♂️💨',
  'Hôm nay Choco mong bạn có một giấc ngủ thật ngon ☁️🌙',
];

export const SECRET_LETTERS: string[] = [
  'Gửi người đang đọc,\nTrái đất hình cầu,\nCòn đầu cậu thì toàn hình bóng crush mà người ta đâu có thích cậu! Khóc đi, Choco đưa giấy ăn cho. 🤧',
  'Ê!\nMở thư ra làm gì thế? Tò mò quá đáng!\nGiờ lỡ mở rồi thì đóng lại cẩn thận, đừng làm nhàu giấy của Choco nha! 😤',
  'Gửi cậu,\nBí mật lớn nhất trên đời là...\nLá thư này thực ra chẳng có bí mật gì cả. Choco chỉ viết ra để xem có ai tò mò mở ra không thôi. Lêu lêu! 🤪',
  'Chào người mở thư,\nBói cho cậu một quẻ hôm nay: Đường tình duyên thì lận đận, nhưng đường ăn uống thì thăng hoa.\nThôi bỏ tình yêu đi, đi ăn lẩu với Choco không? 🍲',
  'Gửi cậu,\nCậu tưởng trong này có lời tỏ tình hả?\nTỉnh lại đi, làm gì có ai yêu cậu đâu mà mơ mộng! Gập thư lại rồi đi ngủ sớm giùm Choco cái! 💔🏃‍♂️',
  'Chúc mừng! 🥳\nCậu là vị khách thứ 999 của tiệm.\nPhần thưởng của cậu là một tràng pháo tay siêu to khổng lồ 👏. Chỉ có thế thôi, không có quà đâu, đừng tìm!',
  'Gửi cậu,\nCảm ơn vì đã dừng chân tại góc nhỏ này của Choco.\nMong cậu một đời an yên, vui vẻ! 🤎',
];

// Kho chứa các câu thông báo siêu đáng yêu cho 3 ô Menu
export const CLOUD_MESSAGES: string[] = [
  'Poof! Một đám mây kẹo bông vừa sà xuống xoa cái đầu nhỏ của cậu nè! Ngoan ngoan~ (◍•ᴗ•◍)❤',
  'Úm ba la xì bùa! Đám mây biến ra 1000 nụ hôn chụt chụt dán lên má cậu! (´｡• ᵕ •｡`)',
  "Mây biến thành chiếc mèo trắng mềm xèo, dụi dụi vào tay cậu. 'Cậu giỏi nhất đời luôn á!' (₌ ᵕ̣̣̣̣̣ ᆽ ᵕ̣̣̣̣̣₌)🐾",
  'Bíp bíp! Đám mây phát hiện một người đang mệt mỏi. Truyền ngay 1000 tia năng lượng tích cực! ✨',
  'Hôm nay cậu đã vất vả nhiều rồi! Giỏi lắm, xoa đầu ngoan ngoan nè (っ´ω`)ﾉ(╥ω╥)',
];

export const HUG_MESSAGES: string[] = [
  'Éccccc! Choco ôm chầm lấy cậu chặt cứng luôn! Lắc lắc nạp đầy năng lượng dâu tây! (≧◡≦)',
  'Ủa ai mệt mà rớt ở đây dạ? Phải bế lên ôm một cái thật to mới được! Sạc đầy 100% sự dính người rùi nha! (づ ᴗ _ᴗ)づ♡',
  'Cún bông Choco vẫy đuôi tít mù bổ nhào vào lòng cậu! *Cọ cọ* Đừng buồn nữa nha! 🐶🤎',
  'Một cú ôm mang hương vị Chocolate bọc Hạnh nhân. Vừa ấm áp, vừa bùi bùi! 🍫🧸',
  '(づ￣ ³￣)づ Ôm cậu một cái thật buồn cười nhưng cực kỳ ấm áp! Đã sạc 100% năng lượng vui vẻ!',
];

export const CANDY_MESSAGES: string[] = [
  "Ting ting! Viên kẹo màu hồng nổ lách tách bảo là: 'Người đang đọc tui là người đáng iu nhứt quả đất!' (´♡‿♡`)",
  'Cậu bốc trúng viên kẹo Vui Vẻ siêu hiếm! Ăn vào là tối nay mỉm cười khanh khách trong mộng luôn á! 🤤🍓',
  'Rột rột... Thỏ con mang đến cho cậu một viên kẹo cà rốt bọc đường! Ăn xong là đôi mắt sáng rực liền! 🐰🥕',
  'Cậu bốc được viên kẹo vị... Trà Sữa Trân Châu! Phép thuật yêu cầu cậu order ngay một ly để tẩm bổ tâm hồn! 🧋',
  '🍬 Ting! Cậu bốc được viên kẹo vị Dâu Tây. Chúc cậu tối nay ngủ thật ngon và mơ đẹp nha!',
];

export type ChocoMenuType = 'cloud' | 'hug' | 'candy';

export interface ChocoMenuItem {
  type: ChocoMenuType;
  icon: string;
  title: string;
  description: string;
  messages: string[];
}

export const CHOCO_MENU_ITEMS: ChocoMenuItem[] = [
  {
    type: 'cloud',
    icon: '☁️',
    title: 'Đám Mây Khen Ngợi',
    description: 'Chạm vào đây để Choco nịnh cậu một câu cho đỡ mệt nha!',
    messages: CLOUD_MESSAGES,
  },
  {
    type: 'hug',
    icon: '🧸',
    title: 'Trạm Sạc Cú Ôm',
    description: 'Dành cho những ngày chênh vênh, ở đây có sẵn một cái ôm.',
    messages: HUG_MESSAGES,
  },
  {
    type: 'candy',
    icon: '🍬',
    title: 'Lọ Kẹo Phép Thuật',
    description: 'Bốc một viên kẹo để xua tan đi vị đắng của ngày dài.',
    messages: CANDY_MESSAGES,
  },
];

interface ChocoCornerProps {
  isOpen: boolean;
  onClose: () => void;
  onGoHome?: () => void;
  characters: CharacterProfile[];
}

export const ChocoCorner: React.FC<ChocoCornerProps> = ({
  isOpen,
  onClose,
  onGoHome,
  characters,
}) => {
  // Secret Whisper State
  const [whisperRevealed, setWhisperRevealed] = useState(false);
  const [whisperIndex, setWhisperIndex] = useState<number>(() =>
    Math.floor(Math.random() * SECRET_WHISPER_QUOTES.length)
  );

  // Envelope Mail State
  const [isMailOpen, setIsMailOpen] = useState(false);
  const [letterIndex, setLetterIndex] = useState<number>(() =>
    Math.floor(Math.random() * SECRET_LETTERS.length)
  );
  const envelopeRef = useRef<HTMLDivElement | null>(null);

  // Menu Alert Popup State
  const [activeAlertMessage, setActiveAlertMessage] = useState<string | null>(null);
  const [activeAlertIcon, setActiveAlertIcon] = useState<string>('🤎');
  const [activeAlertTitle, setActiveAlertTitle] = useState<string>('Thông điệp từ Choco');
  const lastMenuIndexRef = useRef<Record<ChocoMenuType, number>>({
    cloud: -1,
    hug: -1,
    candy: -1,
  });

  // Match Calculator State ("Đo độ hợp cạ giữa anh và bạn")
  const [visitorName, setVisitorName] = useState('');
  const [selectedPartnerName, setSelectedPartnerName] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [matchPercent, setMatchPercent] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const [matchMessage, setMatchMessage] = useState('Đang tính toán nhân phẩm...');
  const [inputError, setInputError] = useState('');

  // Lò sưởi muộn phiền State
  const [sadText, setSadText] = useState('');
  const [sadPlaceholder, setSadPlaceholder] = useState('Viết muộn phiền vào đây...');
  const sadInputRef = useRef<HTMLInputElement | null>(null);

  // Floating dust items
  const dustItems = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        id: i,
        left: `${(i * 4 + 2) % 100}%`,
        size: `${(i % 3) * 2 + 3}px`,
        delay: `${(i * 0.35) % 4}s`,
        duration: `${5 + (i % 4) * 2}s`,
      })),
    []
  );

  // Decorative CSS mist particles inside .secret-whisper
  const whisperMistParticles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${(i * 5.7 + 4) % 94}%`,
        top: `${(i * 17 + 12) % 78}%`,
        size: `${(i % 3) + 2}px`,
        delay: `${(i * 0.28) % 3.5}s`,
        duration: `${3.2 + (i % 4) * 1.1}s`,
      })),
    []
  );

  const mistCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas animation for gentle drifting mist clouds & ethereal particles inside .secret-whisper
  useEffect(() => {
    if (!isOpen) return;
    const canvas = mistCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = (canvas.width = 560);
    const height = (canvas.height = 110);

    // Soft mist clouds
    const clouds = Array.from({ length: 6 }, (_, i) => ({
      x: (i * width) / 5,
      y: height * (0.25 + (i % 3) * 0.25),
      radius: 55 + (i % 3) * 22,
      vx: (i % 2 === 0 ? 1 : -1) * (0.18 + (i % 3) * 0.07),
      phase: i * 1.1,
    }));

    // Glowing micro-particles floating in the mist
    const particles = Array.from({ length: 28 }, (_, i) => ({
      x: (i * 23) % width,
      y: (i * 19) % height,
      r: 1 + (i % 3) * 0.7,
      vx: (i % 2 === 0 ? 1 : -1) * (0.12 + (i % 4) * 0.05),
      vy: -0.08 - (i % 3) * 0.04,
      alpha: 0.25 + (i % 5) * 0.12,
      phase: i * 0.7,
    }));

    let tick = 0;
    const render = () => {
      tick += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Draw drifting mist puffs
      for (const c of clouds) {
        c.x += c.vx;
        if (c.x - c.radius > width) c.x = -c.radius;
        if (c.x + c.radius < 0) c.x = width + c.radius;

        const pulseAlpha = 0.1 + 0.05 * Math.sin(tick + c.phase);
        const grad = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, c.radius);
        grad.addColorStop(0, `rgba(255, 240, 248, ${pulseAlpha})`);
        grad.addColorStop(0.55, `rgba(196, 181, 253, ${pulseAlpha * 0.6})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw gentle floating particles
      for (const p of particles) {
        p.x += p.vx + Math.sin(tick + p.phase) * 0.12;
        p.y += p.vy;

        if (p.y < -4) p.y = height + 4;
        if (p.x < -4) p.x = width + 4;
        if (p.x > width + 4) p.x = -4;

        const twinkle = p.alpha * (0.65 + 0.35 * Math.sin(tick * 1.8 + p.phase));
        ctx.fillStyle = `rgba(255, 248, 252, ${twinkle})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const pickDifferentIndex = (currentIdx: number, length: number): number => {
    if (length <= 1) return 0;
    let next = Math.floor(Math.random() * length);
    while (next === currentIdx) {
      next = Math.floor(Math.random() * length);
    }
    return next;
  };

  // Chạm vào vùng sương mù: đổi sang câu ngẫu nhiên mới và hiện rõ; khi rời khỏi ô hoặc không chạm thì làm mờ đi
  const handleTouchWhisper = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setWhisperIndex((prev) => pickDifferentIndex(prev, SECRET_WHISPER_QUOTES.length));
    setWhisperRevealed(true);
  };

  // Spawn magical sparks shooting out
  const createSpark = (x: number, y: number) => {
    const spark = document.createElement('div');
    spark.classList.add('magic-spark');
    document.body.appendChild(spark);

    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;

    const angle = Math.random() * Math.PI * 2;
    const velocity = 60 + Math.random() * 80;
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity - 50;

    const anim = spark.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 },
      ],
      {
        duration: 800 + Math.random() * 600,
        easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
      }
    );

    anim.onfinish = () => spark.remove();
  };

  const handleToggleMail = () => {
    if (!isMailOpen) {
      // Chọn ngẫu nhiên 1 nội dung bức thư mới mỗi lần mở
      setLetterIndex((prev) => pickDifferentIndex(prev, SECRET_LETTERS.length));
      setIsMailOpen(true);

      if (envelopeRef.current) {
        const rect = envelopeRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2 - 20;

        for (let i = 0; i < 22; i++) {
          createSpark(centerX, centerY);
        }
      }
    } else {
      setIsMailOpen(false);
    }
  };

  // 1. CHỨC NĂNG LÒ SƯỞI MUỘN PHIỀN
  const burnSadness = () => {
    const text = sadText.trim();
    if (!text) {
      setActiveAlertIcon('🔥');
      setActiveAlertTitle('Lò sưởi muộn phiền');
      setActiveAlertMessage('Cậu chưa viết gì mà?');
      return;
    }

    if (sadInputRef.current) {
      const rect = sadInputRef.current.getBoundingClientRect();
      const effect = document.createElement('div');
      effect.innerText = text;
      effect.className = 'hidden-text burning';
      effect.style.left = `${rect.left + rect.width / 2}px`;
      effect.style.top = `${rect.top}px`;
      document.body.appendChild(effect);

      setTimeout(() => effect.remove(), 2000);
    }

    setSadText('');
    setSadPlaceholder('Đã tiêu hủy thành công! 💨');
  };

  // Hàm xử lý khi bấm vào 3 ô Menu: showRandomMessage(type, event)
  const showRandomMessage = (
    type: ChocoMenuType,
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    let selectedArray: string[] = [];
    let icon = '☁️';
    let title = 'Đám Mây Khen Ngợi';

    if (type === 'cloud') {
      selectedArray = CLOUD_MESSAGES;
      icon = '☁️';
      title = 'Đám Mây Khen Ngợi';
    } else if (type === 'hug') {
      selectedArray = HUG_MESSAGES;
      icon = '🧸';
      title = 'Trạm Sạc Cú Ôm';
    } else if (type === 'candy') {
      selectedArray = CANDY_MESSAGES;
      icon = '🍬';
      title = 'Lọ Kẹo Phép Thuật';
    }

    const prevIndex = lastMenuIndexRef.current[type];
    const randomIndex = pickDifferentIndex(prevIndex, selectedArray.length);
    lastMenuIndexRef.current[type] = randomIndex;
    const randomQuote = selectedArray[randomIndex];

    setActiveAlertIcon(icon);
    setActiveAlertTitle(title);
    setActiveAlertMessage(randomQuote);

    for (let i = 0; i < 14; i++) {
      createSpark(event.clientX, event.clientY);
    }
  };

  const handleCalculateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const name = visitorName.trim();
    const partner = selectedPartnerName.trim();

    if (!name) {
      setInputError('Cậu phải nhập tên của mình thì hệ thống mới bói được chứ! 🥺');
      return;
    }
    if (!partner) {
      setInputError('Cậu hãy chọn tên anh trong ngôi nhà ở ô bên dưới nhé! 💖');
      return;
    }

    setInputError('');
    setIsCalculating(true);
    setHasCalculated(true);
    setProgressWidth(0);
    setMatchPercent(0);
    setMatchMessage('Đang dùng siêu máy tính bói toán...');

    // Tạo phần trăm ngẫu nhiên từ 10% đến 100%
    const randomMatch = Math.floor(Math.random() * 91) + 10;

    setTimeout(() => {
      setProgressWidth(randomMatch);

      let currentNum = 0;
      const counter = setInterval(() => {
        if (currentNum >= randomMatch) {
          clearInterval(counter);
          setMatchPercent(randomMatch);

          if (randomMatch >= 90) {
            setMatchMessage(
              `Định mệnh đây rồi! ${name} sinh ra là để dành cho ${partner}! 💖`
            );
          } else if (randomMatch >= 70) {
            setMatchMessage(
              `Hợp cạ phết đấy! ${name} rủ ${partner} đi trà sữa ngay thôi! 🧋`
            );
          } else if (randomMatch >= 40) {
            setMatchMessage(
              `Mức độ tình bạn diệu kỳ. Cần cố gắng nhiều hơn nha ${name} và ${partner}! ☁️`
            );
          } else {
            setMatchMessage(
              `Trái dấu hút nhau? ${name} và ${partner} đúng là oan gia ngõ hẹp! 😹`
            );
          }
          setIsCalculating(false);
        } else {
          currentNum++;
          setMatchPercent(currentNum);
        }
      }, 20);
    }, 500);
  };

  const currentLetterText = SECRET_LETTERS[letterIndex] || SECRET_LETTERS[0];

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="choco-corner-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-5xl bg-gradient-to-b from-[#2b1d18]/95 via-[#1a100c]/95 to-[#09090B]/98 border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-[#FAFAFA]"
        onClick={() => {
          // Nếu bấm ra ngoài vùng sương mù thì làm mờ lại vùng sương mù
          if (whisperRevealed) setWhisperRevealed(false);
        }}
      >
        {/* Top Bar of Standalone Notification Modal */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-white/10 bg-black/40 shrink-0 z-20">
          <div className="flex items-center gap-2 text-xs font-medium text-pink-200/90 tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-pink-300" />
            <span>THÔNG BÁO RIÊNG · GÓC NHỎ CỦA CHOCO</span>
          </div>
          <div className="flex items-center gap-1.5">
            {onGoHome && (
              <button
                type="button"
                onClick={onGoHome}
                aria-label="Về trang chủ"
                title="Về trang chủ"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/15 text-[#FAFAFA] hover:border-pink-300/50 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng Góc Nhỏ Của Choco"
              className="p-2 text-[#A1A1AA] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="relative flex-1 overflow-y-auto p-6 sm:p-10 space-y-9">
          {/* Floating Dust / Fireflies Layer */}
          <div className="dust-container" aria-hidden="true">
            {dustItems.map((dust) => (
              <span
                key={dust.id}
                className="dust"
                style={{
                  left: dust.left,
                  width: dust.size,
                  height: dust.size,
                  animationDelay: dust.delay,
                  animationDuration: dust.duration,
                }}
              />
            ))}
          </div>

          {/* Header section with updated quote */}
          <div className="relative z-10 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>GÓC THƯ THÁI BÍ MẬT</span>
            </div>
            <h2
              id="choco-corner-title"
              className="text-3xl sm:text-4xl font-editorial font-bold text-white tracking-tight glow-text"
            >
              Góc Nhỏ Của Choco
            </h2>

            {/* Khối chứa câu Quote theo đúng yêu cầu */}
            <div className="quote-container">
              <p className="choco-quote">
                &ldquo;Pha một chút đắng vào đời, để thấy bình yên thêm ngọt ngào.&rdquo;
              </p>
            </div>
          </div>

          {/* Secret Whisper Bar - Chỉ hiện "Chạm vào vùng sương mù này...", mỗi lần chạm đổi câu mới, không chạm thì làm mờ đi kèm hiệu ứng sương mù & particles */}
          <div className="relative z-10 max-w-2xl mx-auto">
            <div
              onClick={handleTouchWhisper}
              onMouseLeave={() => setWhisperRevealed(false)}
              className={`secret-whisper ${whisperRevealed ? 'revealed' : ''}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTouchWhisper(e);
                }
              }}
              onBlur={() => setWhisperRevealed(false)}
              aria-label="Chạm vào vùng sương mù này"
            >
              {/* Canvas mô phỏng sương mù và hạt sáng chuyển động nhẹ nhàng */}
              <canvas
                ref={mistCanvasRef}
                className="whisper-mist-canvas"
                aria-hidden="true"
              />

              {/* Lớp mây sương mù & particles CSS huyền ảo khi chưa chạm vào */}
              <div className="whisper-fog-overlay" aria-hidden="true">
                <div className="mist-cloud mist-cloud-1" />
                <div className="mist-cloud mist-cloud-2" />
                <div className="mist-cloud mist-cloud-3" />
                {whisperMistParticles.map((pt) => (
                  <span
                    key={pt.id}
                    className="mist-particle"
                    style={{
                      left: pt.left,
                      top: pt.top,
                      width: pt.size,
                      height: pt.size,
                      animationDelay: pt.delay,
                      animationDuration: pt.duration,
                    }}
                  />
                ))}
              </div>

              <p className="hint-text">Chạm vào vùng sương mù này...</p>
              <div className="blurred-content px-2">
                {SECRET_WHISPER_QUOTES[whisperIndex]}
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Tách trà bốc khói & Menu 3 ô tương tác */}
            <div className="lg:col-span-6 flex flex-col items-center">
              {/* Tách trà bốc khói */}
              <div className="cup-container">
                <div className="steam-group">
                  <div className="steam steam-1"></div>
                  <div className="steam steam-2"></div>
                  <div className="steam steam-3"></div>
                </div>
                <div className="cup-icon">☕</div>
              </div>

              {/* Khung giao diện Menu Góc của Choco */}
              <div className="choco-container">
                <h3 className="font-editorial text-2xl text-[#e8d0bd] font-medium tracking-wide mb-1">
                  Góc của Choco
                </h3>
                <p className="text-xs text-[#a8948a] font-editorial italic mb-6">
                  &ldquo;Pha một chút đắng vào đời, để thấy bình yên thêm ngọt ngào.&rdquo;
                </p>

                <div className="menu-list">
                  {/* Ô 1: Đám mây */}
                  <a
                    href="#cloud"
                    onClick={(e) => showRandomMessage('cloud', e)}
                    className="menu-item cursor-pointer"
                  >
                    <div className="item-icon">☁️</div>
                    <div className="item-info">
                      <h3>Đám Mây Khen Ngợi</h3>
                      <p>Chạm vào đây để Choco nịnh cậu một câu cho đỡ mệt nha!</p>
                    </div>
                  </a>

                  {/* Ô 2: Trạm sạc */}
                  <a
                    href="#hug"
                    onClick={(e) => showRandomMessage('hug', e)}
                    className="menu-item cursor-pointer"
                  >
                    <div className="item-icon">🧸</div>
                    <div className="item-info">
                      <h3>Trạm Sạc Cú Ôm</h3>
                      <p>Dành cho những ngày chênh vênh, ở đây có sẵn một cái ôm.</p>
                    </div>
                  </a>

                  {/* Ô 3: Lọ kẹo */}
                  <a
                    href="#candy"
                    onClick={(e) => showRandomMessage('candy', e)}
                    className="menu-item cursor-pointer"
                  >
                    <div className="item-icon">🍬</div>
                    <div className="item-info">
                      <h3>Lọ Kẹo Phép Thuật</h3>
                      <p>Bốc một viên kẹo để xua tan đi vị đắng của ngày dài.</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* 1. Lò sưởi tiêu hủy muộn phiền */}
              <div className="wishing-well">
                <h3 className="font-editorial text-[#e8d0bd] text-[1.15rem] font-semibold">
                  🔥 Lò sưởi muộn phiền
                </h3>
                <input
                  ref={sadInputRef}
                  type="text"
                  id="sad-text"
                  value={sadText}
                  onChange={(e) => setSadText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      burnSadness();
                    }
                  }}
                  placeholder={sadPlaceholder}
                  autoComplete="off"
                />
                <button type="button" onClick={burnSadness}>
                  Thổi bay 💨
                </button>
                <div id="burn-effect" className="hidden-text" />
              </div>
            </div>

            {/* Right Column: Phong thư bí mật (To + Mờ khi đóng + Random) + Đo độ hợp cạ giữa anh và bạn */}
            <div className="lg:col-span-6 space-y-6">
              {/* Phong thư bí mật */}
              <div className="glass-box p-6 sm:p-7 text-center overflow-visible">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-pink-300" />
                  <h4 className="text-base font-editorial font-bold text-white tracking-wide">
                    Phong Thư Bí Mật Của Choco
                  </h4>
                </div>

                <div
                  id="choco-mail"
                  ref={envelopeRef}
                  onClick={handleToggleMail}
                  className={`envelope-container ${isMailOpen ? 'open' : ''}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleMail();
                    }
                  }}
                  aria-label="Mở hoặc đóng phong thư bí mật"
                >
                  <div className="envelope">
                    <div className="flap"></div>
                    <div className="pocket"></div>
                    <div className="letter">
                      <p className="leading-relaxed whitespace-pre-line font-medium">
                        {currentLetterText}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mail-hint">
                  {isMailOpen ? 'Thư đã được mở...' : 'Chạm để mở thư bí mật'}
                </p>
              </div>

              {/* Mini-game: Đo độ hợp cạ giữa anh và bạn */}
              <div className="match-container glass-box">
                <h3 className="match-title font-editorial">
                  <Heart className="w-4 h-4 inline-block mr-1.5 text-pink-400 fill-current" />
                  <span>💘 Đo độ hợp cạ giữa anh và bạn</span>
                </h3>

                <form onSubmit={handleCalculateMatch} className="input-group">
                  {/* Ô trên: Điền tên mình */}
                  <input
                    type="text"
                    id="visitor-name"
                    placeholder="Nhập tên của bạn vào đây..."
                    value={visitorName}
                    onChange={(e) => {
                      setVisitorName(e.target.value);
                      if (inputError) setInputError('');
                    }}
                    autoComplete="off"
                    disabled={isCalculating}
                    aria-label="Tên của bạn"
                  />

                  {/* Ô dưới: Chọn tên anh trong các thành viên của ngôi nhà */}
                  <select
                    id="partner-name"
                    value={selectedPartnerName}
                    onChange={(e) => {
                      setSelectedPartnerName(e.target.value);
                      if (inputError) setInputError('');
                    }}
                    disabled={isCalculating}
                    aria-label="Chọn tên anh trong ngôi nhà"
                  >
                    <option value="">-- Chọn tên anh trong ngôi nhà --</option>
                    {characters.map((char) => (
                      <option key={char.id} value={char.name}>
                        {char.name} ({char.creatorHandle})
                      </option>
                    ))}
                  </select>

                  {inputError && (
                    <div className="text-xs text-rose-300 font-medium">{inputError}</div>
                  )}

                  <button
                    id="match-btn"
                    type="submit"
                    disabled={isCalculating}
                    className="magic-btn"
                  >
                    {isCalculating ? 'Đang bói toán...' : 'Xem độ Match'}
                  </button>
                </form>

                {/* Khu vực hiển thị kết quả */}
                {hasCalculated && (
                  <div id="result-area">
                    <div className="progress-bg">
                      <div
                        className="progress-fill"
                        id="progress-fill"
                        style={{ width: `${progressWidth}%` }}
                      ></div>
                    </div>
                    <div className="percent-text font-mono-num">
                      <span id="percent-number">{matchPercent}</span>%
                    </div>
                    <p className="match-message" id="match-message">
                      {matchMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Cute Alert Modal for showRandomMessage */}
        {activeAlertMessage && (
          <div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="choco-alert-title"
            onClick={() => setActiveAlertMessage(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-gradient-to-b from-[#3a2620] to-[#1f1410] border border-[#e8d0bd]/40 p-6 text-center shadow-2xl space-y-4 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-4xl">{activeAlertIcon}</div>
              <h4
                id="choco-alert-title"
                className="font-editorial text-xl font-bold text-[#e8d0bd]"
              >
                {activeAlertTitle}
              </h4>
              <p className="text-sm text-[#fdf6e3] leading-relaxed">
                {activeAlertMessage}
              </p>
              <button
                type="button"
                onClick={() => setActiveAlertMessage(null)}
                className="magic-btn px-6 py-2 text-sm"
              >
                Cảm ơn Choco nha 🤎
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
