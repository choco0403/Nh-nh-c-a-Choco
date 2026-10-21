import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Music, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import {
  calculateAudioProgressPercent,
  formatAudioTime,
  getNextTrackIndex,
  partitionTracksByVibe,
  type MusicVibeType,
} from '../utils/characterLogic';
import {
  INITIAL_ACTIVE_VIBE,
  INITIAL_VIBE_OVERRIDES,
} from '../data/persistedDefaults';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  type: MusicVibeType;
  musicUrl: string;
  youtubeVideoId: string;
  defaultDuration: number;
}

const STORAGE_KEY_VIBE_OVERRIDES = 'choco_house_music_vibe_overrides_v1';

// ==========================================
// 1. DANH SÁCH BÀI HÁT CỐ ĐỊNH (dsBaiHat)
// Quy tắc: Bài nào tươi thì để type: "light", bài nào suy thì để type: "dark"
// ==========================================
export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'congb-cho-chut',
    title: 'chờ chút...',
    artist: 'CONGB',
    type: 'light',
    musicUrl: 'https://www.youtube.com/watch?v=GczyPW3vbrc&list=RDGczyPW3vbrc&start_radio=1',
    youtubeVideoId: 'GczyPW3vbrc',
    defaultDuration: 195,
  },
  {
    id: 'izara-moianh',
    title: 'moianh',
    artist: 'IZARA',
    type: 'dark',
    musicUrl: 'https://youtu.be/Y02OdLj_hqE?si=CCEzhcttmdF1Tna2',
    youtubeVideoId: 'Y02OdLj_hqE',
    defaultDuration: 173,
  },
  {
    id: 'coolkid-sau-con-mua',
    title: 'Sau Cơn Mưa',
    artist: 'COOLKID, RHYDER',
    type: 'light',
    musicUrl: 'https://youtu.be/iFoLKvdqXk8?si=eXckAgfnIVdyOVrV',
    youtubeVideoId: 'iFoLKvdqXk8',
    defaultDuration: 198,
  },
  {
    id: 'izara-wish-u-back',
    title: 'wish u back',
    artist: 'IZARA, Lil Liem',
    type: 'dark',
    musicUrl: 'https://www.youtube.com/watch?v=QthbqNVBWxA&list=RDQthbqNVBWxA&start_radio=1',
    youtubeVideoId: 'QthbqNVBWxA',
    defaultDuration: 222,
  },
  {
    id: 'kimlong-let-me-go',
    title: 'let me go',
    artist: 'KIMLONG',
    type: 'dark',
    musicUrl: 'https://www.youtube.com/watch?v=M1_ya05SvH8&list=RDM1_ya05SvH8&start_radio=1',
    youtubeVideoId: 'M1_ya05SvH8',
    defaultDuration: 176,
  },
  {
    id: 'haanhuy-nhuctiemthuc',
    title: 'Nhức Tiềm Thức',
    artist: 'Hà An Huy',
    type: 'dark',
    musicUrl: 'https://www.youtube.com/watch?v=69b7C04OzRk&list=RD69b7C04OzRk&start_radio=1',
    youtubeVideoId: '69b7C04OzRk',
    defaultDuration: 215,
  },
  {
    id: 'youngpuppy-wrong-times',
    title: 'Wrong Times Remake',
    artist: 'YoungPuppy, Đangrangto',
    type: 'light',
    musicUrl: 'https://www.youtube.com/watch?v=h4xDaP2EiuU&list=RDh4xDaP2EiuU&start_radio=1',
    youtubeVideoId: 'h4xDaP2EiuU',
    defaultDuration: 188,
  },
  {
    id: 'mrt-tinh-ha-say-hi',
    title: 'MRT',
    artist: 'XUÂN ĐỊNH K.Y, buitruonglinh, CAPTAIN BOY, HYO',
    type: 'light',
    musicUrl: 'https://www.youtube.com/watch?v=ZTbziS5_eso&list=RDZTbziS5_eso&start_radio=1',
    youtubeVideoId: 'ZTbziS5_eso',
    defaultDuration: 185,
  },
  {
    id: 'dangrangto-xuong-rong',
    title: 'xương rồng (intro)',
    artist: 'Đangrangto',
    type: 'light',
    musicUrl: 'https://www.youtube.com/watch?v=PWRlaRB2F_g&list=RDPWRlaRB2F_g&start_radio=1',
    youtubeVideoId: 'PWRlaRB2F_g',
    defaultDuration: 145,
  },
];

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (
    videoIdOrOptions: string | { videoId: string; startSeconds?: number }
  ) => void;
  cueVideoById: (
    videoIdOrOptions: string | { videoId: string; startSeconds?: number }
  ) => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        config: {
          width?: string | number;
          height?: string | number;
          videoId?: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface AmbientMusicPlayerProps {
  autoPlayTrigger?: number;
}

export const AmbientMusicPlayer: React.FC<AmbientMusicPlayerProps> = ({
  autoPlayTrigger = 0,
}) => {
  // Null initially so the track subtitle under "Nhạc nền web" only appears after a track is chosen
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [activeVibe, setActiveVibe] = useState<MusicVibeType>(() => {
    try {
      const saved = localStorage.getItem('choco_house_active_music_vibe_v1');
      return saved === 'dark' || saved === 'light' ? saved : INITIAL_ACTIVE_VIBE;
    } catch {
      return INITIAL_ACTIVE_VIBE;
    }
  });
  const [vibeOverrides, setVibeOverrides] = useState<Record<string, MusicVibeType>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VIBE_OVERRIDES);
      return saved ? { ...INITIAL_VIBE_OVERRIDES, ...JSON.parse(saved) } : INITIAL_VIBE_OVERRIDES;
    } catch {
      return INITIAL_VIBE_OVERRIDES;
    }
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const ytMountRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const isPlayerReadyRef = useRef<boolean>(false);
  const loadedVideoIdRef = useRef<string>(MUSIC_TRACKS[0].youtubeVideoId);
  const pendingActionRef = useRef<{
    videoId: string;
    play: boolean;
    seekSeconds?: number;
  } | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const selectedTrackIdRef = useRef<string | null>(null);
  const lastAutoAdvanceTimeRef = useRef<number>(0);
  const advanceToNextTrackRef = useRef<() => void>(() => {});

  const { lightTracks, darkTracks } = useMemo(
    () => partitionTracksByVibe(MUSIC_TRACKS, vibeOverrides),
    [vibeOverrides]
  );

  // Ordered playlist matching Light Vibe then Dark Vibe
  const orderedTracks = useMemo(
    () => [...lightTracks, ...darkTracks],
    [lightTracks, darkTracks]
  );

  const selectedTrack = selectedTrackId
    ? orderedTracks.find((t) => t.id === selectedTrackId) || null
    : null;

  const effectiveDuration =
    duration > 0
      ? duration
      : selectedTrack
      ? selectedTrack.defaultDuration
      : MUSIC_TRACKS[0].defaultDuration;

  const progressPercent = calculateAudioProgressPercent(currentTime, effectiveDuration);

  const hasMountedOverridesRef = useRef(false);
  const hasMountedVibeRef = useRef(false);
  const isSyncingFromStorageRef = useRef(false);

  useEffect(() => {
    if (!hasMountedOverridesRef.current) {
      hasMountedOverridesRef.current = true;
      return;
    }
    if (isSyncingFromStorageRef.current) {
      isSyncingFromStorageRef.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY_VIBE_OVERRIDES, JSON.stringify(vibeOverrides));
      window.dispatchEvent(new CustomEvent('choco-music-state-changed'));
    } catch {
      // Ignore storage errors
    }
  }, [vibeOverrides]);

  useEffect(() => {
    if (!hasMountedVibeRef.current) {
      hasMountedVibeRef.current = true;
      return;
    }
    if (isSyncingFromStorageRef.current) {
      return;
    }
    try {
      localStorage.setItem('choco_house_active_music_vibe_v1', activeVibe);
      window.dispatchEvent(new CustomEvent('choco-music-state-changed'));
    } catch {
      // Ignore storage errors
    }
  }, [activeVibe]);

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        isSyncingFromStorageRef.current = true;
        const rawOverrides = localStorage.getItem(STORAGE_KEY_VIBE_OVERRIDES);
        if (rawOverrides) {
          const parsed = JSON.parse(rawOverrides);
          if (parsed && typeof parsed === 'object') {
            setVibeOverrides((prev) =>
              JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed
            );
          }
        }
        const rawActive = localStorage.getItem('choco_house_active_music_vibe_v1');
        if (rawActive === 'light' || rawActive === 'dark') {
          setActiveVibe((prev) => (prev === rawActive ? prev : rawActive));
        }
      } catch {
        // Ignore
      } finally {
        window.setTimeout(() => {
          isSyncingFromStorageRef.current = false;
        }, 0);
      }
    };
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('choco-state-hydrated', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('choco-state-hydrated', syncFromStorage);
    };
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    selectedTrackIdRef.current = selectedTrackId;
  }, [selectedTrackId]);

  useEffect(() => {
    isMutedRef.current = isMuted;
    const player = ytPlayerRef.current;
    if (player && isPlayerReadyRef.current) {
      try {
        if (isMuted) {
          player.mute();
        } else {
          player.unMute();
          player.setVolume(100);
        }
      } catch {
        // Ignore player state errors
      }
    }
  }, [isMuted]);

  // Pre-initialize official YouTube IFrame Player for exact full-song playback
  useEffect(() => {
    let isUnmounted = false;

    const createPlayer = () => {
      if (isUnmounted || !ytMountRef.current || !window.YT || !window.YT.Player) return;
      if (ytPlayerRef.current) return;

      ytPlayerRef.current = new window.YT.Player(ytMountRef.current, {
        width: '200',
        height: '200',
        videoId: MUSIC_TRACKS[0].youtubeVideoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (isUnmounted) return;
            isPlayerReadyRef.current = true;
            const player = event.target;
            try {
              player.setVolume(100);
              if (isMutedRef.current) {
                player.mute();
              } else {
                player.unMute();
              }
              const d = player.getDuration();
              if (Number.isFinite(d) && d > 0) {
                setDuration(d);
              }
            } catch {
              // Ignore
            }

            if (pendingActionRef.current) {
              const pending = pendingActionRef.current;
              pendingActionRef.current = null;
              try {
                loadedVideoIdRef.current = pending.videoId;
                if (pending.play) {
                  player.loadVideoById({
                    videoId: pending.videoId,
                    startSeconds: pending.seekSeconds ?? 0,
                  });
                  player.playVideo();
                } else {
                  player.cueVideoById({
                    videoId: pending.videoId,
                    startSeconds: pending.seekSeconds ?? 0,
                  });
                }
              } catch {
                // Ignore
              }
            }
          },
          onStateChange: (event) => {
            if (isUnmounted) return;
            const player = event.target;
            try {
              const d = player.getDuration();
              if (Number.isFinite(d) && d > 0) {
                setDuration(d);
              }
              const t = player.getCurrentTime();
              if (Number.isFinite(t) && t >= 0) {
                setCurrentTime(t);
              }
            } catch {
              // Ignore
            }

            // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
            if (event.data === 1) {
              setIsPlaying(true);
            } else if (event.data === 2) {
              setIsPlaying(false);
            } else if (event.data === 0) {
              // Phát hết bài này thì tự động phát bài tiếp theo của danh sách
              advanceToNextTrackRef.current();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        document.head.appendChild(tag);
      }
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        createPlayer();
      };
    }

    return () => {
      isUnmounted = true;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // Ignore
        }
        ytPlayerRef.current = null;
      }
      isPlayerReadyRef.current = false;
    };
  }, []);

  // Poll playback progress smoothly while playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      const player = ytPlayerRef.current;
      if (player && isPlayerReadyRef.current) {
        try {
          const state = player.getPlayerState();
          const d = player.getDuration();
          if (Number.isFinite(d) && d > 0) {
            setDuration(d);
          }
          const t = player.getCurrentTime();
          if (Number.isFinite(t) && t >= 0 && state === 1) {
            setCurrentTime(t);
            return;
          }
        } catch {
          // Ignore
        }
      }
      // Fallback visual clock tick when iframe is buffering or in headless environment
      setCurrentTime((prev) => {
        const next = prev + 0.25;
        if (next >= effectiveDuration) {
          window.setTimeout(() => {
            advanceToNextTrackRef.current();
          }, 0);
          return 0;
        }
        return next;
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, [isPlaying, effectiveDuration]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const startOrSwitchTrack = (track: MusicTrack, seekSeconds?: number) => {
    selectedTrackIdRef.current = track.id;
    setSelectedTrackId(track.id);
    setActiveVibe(track.type);
    const startSec = seekSeconds ?? 0;
    setCurrentTime(startSec);
    setDuration(track.defaultDuration);
    setIsPlaying(true);

    const player = ytPlayerRef.current;
    if (player && isPlayerReadyRef.current) {
      try {
        if (!isMuted) {
          player.unMute();
          player.setVolume(100);
        }
        if (loadedVideoIdRef.current !== track.youtubeVideoId) {
          loadedVideoIdRef.current = track.youtubeVideoId;
          player.loadVideoById({
            videoId: track.youtubeVideoId,
            startSeconds: startSec,
          });
        } else if (seekSeconds !== undefined) {
          player.seekTo(startSec, true);
        }
        player.playVideo();
      } catch {
        // Ignore
      }
    } else {
      pendingActionRef.current = {
        videoId: track.youtubeVideoId,
        play: true,
        seekSeconds: startSec,
      };
    }
  };

  advanceToNextTrackRef.current = () => {
    const now = Date.now();
    if (now - lastAutoAdvanceTimeRef.current < 400) return;
    lastAutoAdvanceTimeRef.current = now;
    const nextIdx = getNextTrackIndex(selectedTrackIdRef.current, orderedTracks);
    if (nextIdx >= 0 && orderedTracks[nextIdx]) {
      startOrSwitchTrack(orderedTracks[nextIdx], 0);
    }
  };

  const pauseCurrentTrack = () => {
    setIsPlaying(false);
    const player = ytPlayerRef.current;
    if (player && isPlayerReadyRef.current) {
      try {
        player.pauseVideo();
      } catch {
        // Ignore
      }
    } else if (pendingActionRef.current) {
      pendingActionRef.current.play = false;
    }
  };

  const resumeCurrentTrack = (track: MusicTrack) => {
    setIsPlaying(true);
    const player = ytPlayerRef.current;
    if (player && isPlayerReadyRef.current) {
      try {
        if (!isMuted) {
          player.unMute();
          player.setVolume(100);
        }
        if (loadedVideoIdRef.current !== track.youtubeVideoId) {
          loadedVideoIdRef.current = track.youtubeVideoId;
          player.loadVideoById({
            videoId: track.youtubeVideoId,
            startSeconds: currentTime,
          });
        }
        player.playVideo();
      } catch {
        // Ignore
      }
    } else {
      pendingActionRef.current = {
        videoId: track.youtubeVideoId,
        play: true,
        seekSeconds: currentTime,
      };
    }
  };

  const handleTogglePlay = () => {
    if (!selectedTrack) {
      const currentVibeList = activeVibe === 'light' ? lightTracks : darkTracks;
      const firstTrack = currentVibeList[0] || orderedTracks[0];
      if (firstTrack) {
        startOrSwitchTrack(firstTrack, 0);
      }
    } else if (isPlaying) {
      pauseCurrentTrack();
    } else {
      resumeCurrentTrack(selectedTrack);
    }
  };

  const handleSelectTrack = (track: MusicTrack) => {
    if (selectedTrackId !== track.id) {
      startOrSwitchTrack(track, 0);
    } else if (isPlaying) {
      pauseCurrentTrack();
    } else {
      resumeCurrentTrack(track);
    }
  };

  // ==========================================
  // 3. HÀM CHUYỂN QUA LẠI GIỮA 2 TAB ☀️ / 🌙
  // ==========================================
  const switchVibe = (vibe: MusicVibeType) => {
    setActiveVibe(vibe);
  };

  const handleToggleTrackVibe = (e: React.MouseEvent, track: MusicTrack) => {
    e.stopPropagation();
    const nextVibe: MusicVibeType = track.type === 'light' ? 'dark' : 'light';
    setVibeOverrides((prev) => ({
      ...prev,
      [track.id]: nextVibe,
    }));
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(e.target.value);
    if (!Number.isFinite(nextTime)) return;
    setCurrentTime(nextTime);

    if (!selectedTrack) {
      const currentVibeList = activeVibe === 'light' ? lightTracks : darkTracks;
      const firstTrack = currentVibeList[0] || orderedTracks[0];
      if (firstTrack) {
        startOrSwitchTrack(firstTrack, nextTime);
      }
      return;
    }

    const player = ytPlayerRef.current;
    if (player && isPlayerReadyRef.current) {
      try {
        player.seekTo(nextTime, true);
      } catch {
        // Ignore
      }
    }
  };

  useEffect(() => {
    if (autoPlayTrigger > 0) {
      const targetTrack = selectedTrack || orderedTracks[0];
      if (targetTrack) {
        startOrSwitchTrack(targetTrack, 0);
      }
    }
  }, [autoPlayTrigger]);

  const renderSongItem = (track: MusicTrack) => {
    const isSelected = track.id === selectedTrackId;
    const trackDurationText = formatAudioTime(
      isSelected && duration > 0 ? duration : track.defaultDuration
    );
    return (
      <div
        key={track.id}
        role="button"
        tabIndex={0}
        data-music-url={track.musicUrl}
        data-youtube-id={track.youtubeVideoId}
        data-vibe-type={track.type}
        aria-label={`Phát bài ${track.title} - ${track.artist}`}
        onClick={() => handleSelectTrack(track)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelectTrack(track);
          }
        }}
        className={`song-item cursor-pointer ${isSelected && isPlaying ? 'playing' : ''}`}
      >
        <div className="song-info">
          <h4>{track.title}</h4>
          <p>
            {track.artist} · <span className="font-mono-num">{trackDurationText}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => handleToggleTrackVibe(e, track)}
            title={
              track.type === 'light'
                ? 'Chuyển bài này sang 🌙 Cà phê đen'
                : 'Chuyển bài này sang ☀️ Cacao ấm'
            }
            aria-label={
              track.type === 'light'
                ? `Chuyển ${track.title} sang Cà phê đen`
                : `Chuyển ${track.title} sang Cacao ấm`
            }
            className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] flex items-center justify-center transition-colors"
          >
            {track.type === 'light' ? '☀️' : '🌙'}
          </button>
          <span className="play-icon" aria-hidden="true">
            {isSelected && isPlaying ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 ml-0.5 fill-current" />
            )}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative inline-block music-player">
      {/* In-viewport 200x200 container required by YouTube IFrame API so full original songs play without autoplay block */}
      <div
        aria-hidden="true"
        className="fixed bottom-0 right-0 w-[200px] h-[200px] opacity-[0.01] pointer-events-none overflow-hidden -z-50"
      >
        <div ref={ytMountRef} />
      </div>

      {/* Musical Note Icon inside a Rounded Square Box */}
      <button
        type="button"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-label="Mở trình chỉnh nhạc nền (Nốt nhạc)"
        aria-expanded={isMenuOpen}
        title={
          selectedTrack
            ? `${selectedTrack.title} - ${selectedTrack.artist} (${formatAudioTime(currentTime)} / ${formatAudioTime(effectiveDuration)})`
            : 'Nhạc nền web — Nhấp để chọn nhạc'
        }
        className={`w-10 h-10 rounded-xl border border-[#3F3F46] bg-[#18181B] text-[#FFFFFF] flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 hover:bg-[#18181B] hover:border-[#71717A] hover:shadow-lg hover:shadow-white/10 ${
          isPlaying ? 'shadow-lg shadow-white/10 border-[#71717A]' : ''
        }`}
      >
        <span id="record" className={`inline-flex items-center justify-center ${isPlaying ? 'spinning' : ''}`}>
          <Music className="w-4 h-4 text-[#FFFFFF]" />
        </span>
      </button>
      <span className="now-playing sr-only">{isPlaying ? 'Now playing...' : 'Paused'}</span>

      {/* Dropdown Popover for Selecting Track & Controlling Playback */}
      {isMenuOpen && (
        <div
          role="dialog"
          aria-label="Bảng chọn nhạc nền"
          className="absolute left-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-[#121215] border border-[#27272A] shadow-2xl p-4 z-50 text-[#FAFAFA] space-y-3"
        >
          <div className="flex items-center justify-between border-b border-[#27272A] pb-2.5">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span>Hộp nhạc đa cảm</span>
                {isPlaying && (
                  <span className="text-[10px] font-normal text-pink-300 italic">
                    Now playing...
                  </span>
                )}
              </div>
              {selectedTrack && (
                <div className="text-[11px] text-[#A1A1AA] truncate mt-0.5">
                  {selectedTrack.title} — {selectedTrack.artist}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleTogglePlay}
                aria-label={isPlaying ? 'Tạm dừng nhạc' : 'Phát nhạc'}
                className={`w-8 h-8 rounded-lg border border-[#3F3F46] bg-[#18181B] text-[#FFFFFF] flex items-center justify-center transition-all duration-200 cursor-pointer hover:bg-[#18181B] hover:border-[#71717A] hover:shadow-lg hover:shadow-white/10 ${
                  isPlaying ? 'shadow-lg shadow-white/10 border-[#71717A]' : ''
                }`}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 text-[#FFFFFF]" />
                ) : (
                  <Play className="w-3.5 h-3.5 ml-0.5 text-[#FFFFFF]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                className="w-8 h-8 rounded-lg bg-[#18181B] hover:bg-[#18181B] text-[#FFFFFF] border border-[#3F3F46] hover:border-[#71717A] hover:shadow-lg hover:shadow-white/10 flex items-center justify-center transition-all duration-200 cursor-pointer"
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-[#FFFFFF]" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#FFFFFF]" />
                )}
              </button>
            </div>
          </div>

          {/* Interactive Audio Playback Progress Bar (Seek & Time Display) */}
          <div className="space-y-1.5 pt-0.5" data-testid="music-progress-section">
            <div className="relative flex items-center h-4">
              <div className="w-full h-1.5 bg-[#27272A] rounded-full overflow-hidden pointer-events-none">
                <div
                  className="h-full bg-white rounded-full transition-[width] duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={effectiveDuration}
                step={0.1}
                value={Math.min(currentTime, effectiveDuration)}
                onChange={handleSeekChange}
                aria-label="Thanh tiến trình phát nhạc"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="pointer-events-none absolute w-3 h-3 rounded-full bg-white border border-[#09090B] shadow-md -translate-x-1/2 transition-[left] duration-150"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono-num text-[#A1A1AA]">
              <span data-testid="music-current-time">{formatAudioTime(currentTime)}</span>
              <span data-testid="music-total-duration">{formatAudioTime(effectiveDuration)}</span>
            </div>
          </div>

          {/* HỘP NHẠC ĐA CẢM (TỰ ĐỘNG PHÂN CHIA) */}
          <div className="vibe-playlist">
            {/* Công tắc chuyển Cacao ấm / Cà phê đen */}
            <div className="vibe-tabs">
              <button
                id="btn-light"
                type="button"
                className={activeVibe === 'light' ? 'active' : ''}
                onClick={() => switchVibe('light')}
              >
                ☀️ Cacao ấm
              </button>
              <button
                id="btn-dark"
                type="button"
                className={activeVibe === 'dark' ? 'active' : ''}
                onClick={() => switchVibe('dark')}
              >
                🌙 Cà phê đen
              </button>
            </div>

            {/* 2 Thùng chứa tự động chia bài hát theo Vibe */}
            <div
              id="list-light"
              className={`song-list music-track-scroll ${
                activeVibe === 'light' ? 'active-list' : ''
              }`}
            >
              {lightTracks.map(renderSongItem)}
            </div>
            <div
              id="list-dark"
              className={`song-list music-track-scroll ${
                activeVibe === 'dark' ? 'active-list' : ''
              }`}
            >
              {darkTracks.map(renderSongItem)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

