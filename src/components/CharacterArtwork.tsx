import React, { useState } from 'react';
import type { CharacterProfile } from '../types/character';

interface CharacterArtworkProps {
  character: CharacterProfile;
  className?: string;
  priority?: boolean;
}

export const CharacterArtwork: React.FC<CharacterArtworkProps> = ({
  character,
  className = 'w-full h-full',
}) => {
  const [imgError, setImgError] = useState(false);

  if (character.customAvatarUrl && !imgError) {
    return (
      <div className={`relative overflow-hidden bg-[#18181B] ${className}`}>
        <img
          src={character.customAvatarUrl}
          alt={`Chân dung nhân vật ${character.name}`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden select-none ${className}`}
      role="img"
      aria-label={`Minh họa chân dung ${character.name} (${character.creatorHandle})`}
    >
      {renderEditorialPortraitSvg(character)}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
    </div>
  );
};

function renderEditorialPortraitSvg(character: CharacterProfile) {
  switch (character.avatarKey) {
    case 'linh_dan':
      return (
        <svg
          viewBox="0 0 400 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="bg-linh-dan" x1="0" y1="0" x2="400" y2="520" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#131C2E" />
              <stop offset="55%" stopColor="#1F2937" />
              <stop offset="100%" stopColor="#3B1D14" />
            </linearGradient>
            <radialGradient id="lantern-glow" cx="0.72" cy="0.34" r="0.42">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#D97706" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#9A3412" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="520" fill="url(#bg-linh-dan)" />
          <circle cx="290" cy="175" r="165" fill="url(#lantern-glow)" />
          {/* Wooden lattice window frame */}
          <g stroke="#FDE68A" strokeOpacity="0.14" strokeWidth="1.5">
            <line x1="48" y1="0" x2="48" y2="520" />
            <line x1="112" y1="0" x2="112" y2="520" />
            <line x1="0" y1="90" x2="160" y2="90" />
            <line x1="0" y1="180" x2="160" y2="180" />
            <line x1="0" y1="270" x2="160" y2="270" />
          </g>
          {/* Hanging Silk Lantern */}
          <line x1="292" y1="0" x2="292" y2="128" stroke="#FBBF24" strokeOpacity="0.6" strokeWidth="2" />
          <rect x="266" y="128" width="52" height="72" rx="22" fill="#F59E0B" fillOpacity="0.9" stroke="#FEF3C7" strokeWidth="1.5" />
          <rect x="276" y="122" width="32" height="8" rx="2" fill="#78350F" />
          <rect x="276" y="198" width="32" height="8" rx="2" fill="#78350F" />
          <line x1="292" y1="206" x2="292" y2="236" stroke="#F59E0B" strokeWidth="2" />
          {/* Botanical branches */}
          <path d="M380 60 C310 90, 260 85, 210 120" stroke="#FDE68A" strokeOpacity="0.35" strokeWidth="2" fill="none" />
          <ellipse cx="245" cy="96" rx="12" ry="5" transform="rotate(-25 245 96)" fill="#FDE68A" fillOpacity="0.3" />
          <ellipse cx="220" cy="112" rx="10" ry="4" transform="rotate(-15 220 112)" fill="#FDE68A" fillOpacity="0.25" />
          {/* Character Silhouette & Portrait */}
          <path d="M85 520 C92 410, 130 355, 192 350 C254 355, 290 410, 302 520 Z" fill="#1E293B" stroke="#F59E0B" strokeOpacity="0.35" strokeWidth="1.5" />
          {/* Traditional Collar */}
          <path d="M158 352 L192 412 L226 352" stroke="#FDE68A" strokeOpacity="0.65" strokeWidth="2.5" fill="none" />
          {/* Neck & Head */}
          <rect x="179" y="308" width="26" height="48" rx="12" fill="#F3D5B5" fillOpacity="0.9" />
          <ellipse cx="192" cy="264" rx="44" ry="54" fill="#F7DFC4" />
          {/* Hair & Jade Hairpin */}
          <path d="M144 265 C142 210, 168 194, 195 194 C226 194, 244 218, 240 272 C232 242, 210 230, 182 232 C162 234, 150 248, 144 265 Z" fill="#0F172A" />
          <circle cx="164" cy="202" r="24" fill="#0F172A" />
          <line x1="128" y1="214" x2="215" y2="188" stroke="#34D399" strokeWidth="4" strokeLinecap="round" />
          <circle cx="126" cy="215" r="5" fill="#6EE7B7" />
          <circle cx="126" cy="227" r="3" fill="#A7F3D0" />
          {/* Subtle facial features */}
          <path d="M172 260 Q180 256 186 260" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
          <path d="M202 260 Q210 256 218 260" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
          <path d="M188 292 Q195 296 202 292" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'seraphina':
      return (
        <svg
          viewBox="0 0 400 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="bg-seraphina" x1="0" y1="0" x2="400" y2="520" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#181326" />
              <stop offset="55%" stopColor="#261C35" />
              <stop offset="100%" stopColor="#3B1F2B" />
            </linearGradient>
          </defs>
          <rect width="400" height="520" fill="url(#bg-seraphina)" />
          {/* Astrolabe Celestial Rings */}
          <g stroke="#FDE68A" strokeOpacity="0.28" strokeWidth="1.2">
            <circle cx="200" cy="240" r="145" />
            <circle cx="200" cy="240" r="115" strokeDasharray="6 6" />
            <ellipse cx="200" cy="240" rx="145" ry="52" transform="rotate(-24 200 240)" />
            <ellipse cx="200" cy="240" rx="145" ry="52" transform="rotate(32 200 240)" />
            <line x1="200" y1="65" x2="200" y2="415" strokeOpacity="0.18" />
          </g>
          {/* Star points */}
          <circle cx="95" cy="140" r="3" fill="#FDE68A" fillOpacity="0.7" />
          <circle cx="315" cy="130" r="2.5" fill="#FDE68A" fillOpacity="0.6" />
          <circle cx="328" cy="295" r="3.5" fill="#FDE68A" fillOpacity="0.5" />
          {/* Archivist Cloak & Portrait */}
          <path d="M82 520 C96 402, 138 352, 200 352 C262 352, 304 402, 318 520 Z" fill="#1E1B2E" stroke="#FDE68A" strokeOpacity="0.4" strokeWidth="1.5" />
          <path d="M166 354 L200 425 L234 354" fill="#F8FAFC" fillOpacity="0.9" />
          <circle cx="200" cy="390" r="7" fill="#D97706" stroke="#FEF3C7" strokeWidth="1.5" />
          <rect x="187" y="308" width="26" height="48" rx="12" fill="#F3D9CA" />
          <ellipse cx="200" cy="260" rx="45" ry="55" fill="#FAE5D8" />
          {/* Braided Dark Hair */}
          <path d="M152 262 C150 202, 174 188, 200 188 C228 188, 250 204, 248 262 C238 232, 218 224, 200 224 C180 224, 162 234, 152 262 Z" fill="#1E1B4B" />
          <path d="M232 285 C242 330, 238 380, 226 425" stroke="#1E1B4B" strokeWidth="16" strokeLinecap="round" />
          {/* Silver Spectacles */}
          <circle cx="182" cy="262" r="13" stroke="#E2E8F0" strokeWidth="2.2" fill="#FFFFFF" fillOpacity="0.12" />
          <circle cx="218" cy="262" r="13" stroke="#E2E8F0" strokeWidth="2.2" fill="#FFFFFF" fillOpacity="0.12" />
          <line x1="195" y1="262" x2="205" y2="262" stroke="#E2E8F0" strokeWidth="2" />
          <path d="M194 294 Q200 297 206 294" stroke="#9F1239" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'kaelen':
      return (
        <svg
          viewBox="0 0 400 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="bg-kaelen" x1="0" y1="0" x2="400" y2="520" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#090D16" />
              <stop offset="60%" stopColor="#111827" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
          </defs>
          <rect width="400" height="520" fill="url(#bg-kaelen)" />
          {/* Venetian blind light slats */}
          <g fill="#F59E0B" fillOpacity="0.11">
            <polygon points="0,70 400,120 400,138 0,88" />
            <polygon points="0,115 400,165 400,183 0,133" />
            <polygon points="0,160 400,210 400,228 0,178" />
            <polygon points="0,205 400,255 400,273 0,223" />
          </g>
          {/* Harbor Streetlamp halo */}
          <circle cx="92" cy="150" r="64" fill="#F59E0B" fillOpacity="0.18" />
          <circle cx="92" cy="150" r="14" fill="#FDE68A" fillOpacity="0.75" />
          {/* Trench coat silhouette */}
          <path d="M72 520 C86 392, 134 344, 204 344 C274 344, 318 392, 334 520 Z" fill="#1F2937" stroke="#94A3B8" strokeOpacity="0.3" strokeWidth="1.5" />
          {/* Trench Coat Lapels */}
          <path d="M148 346 L204 438 L260 346" fill="#0F172A" stroke="#CBD5E1" strokeOpacity="0.35" strokeWidth="1.5" />
          <path d="M196 368 L204 428 L212 368 Z" fill="#78350F" />
          {/* Head & Fedora / Sharp Hair */}
          <rect x="190" y="302" width="28" height="48" rx="10" fill="#E2C2A8" />
          <path d="M156 246 C156 205, 178 190, 204 190 C230 190, 252 205, 252 246 C252 288, 232 314, 204 314 C176 314, 156 288, 156 246 Z" fill="#EBD0B9" />
          <path d="M150 236 C152 192, 176 178, 208 180 C238 182, 256 202, 254 238 C240 216, 218 210, 192 214 C172 216, 158 224, 150 236 Z" fill="#0F172A" />
          {/* Sharp Noir Eyes & Pocket Watch Motif */}
          <line x1="176" y1="252" x2="194" y2="254" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="214" y1="254" x2="232" y2="252" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="194" y1="288" x2="214" y2="287" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'julian':
      return (
        <svg
          viewBox="0 0 400 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="bg-julian" x1="0" y1="0" x2="400" y2="520" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1C1210" />
              <stop offset="55%" stopColor="#2D1B15" />
              <stop offset="100%" stopColor="#18181B" />
            </linearGradient>
          </defs>
          <rect width="400" height="520" fill="url(#bg-julian)" />
          {/* Clockwork Horology Gear Rings */}
          <g stroke="#F59E0B" strokeOpacity="0.24" strokeWidth="1.5">
            <circle cx="200" cy="230" r="136" />
            <circle cx="200" cy="230" r="104" strokeDasharray="12 8" />
            <circle cx="200" cy="230" r="72" />
            <line x1="200" y1="94" x2="200" y2="160" />
            <line x1="200" y1="230" x2="295" y2="175" strokeWidth="2" />
          </g>
          {/* Symphony Waistcoat Silhouette */}
          <path d="M84 520 C98 400, 140 348, 200 348 C260 348, 302 400, 316 520 Z" fill="#18181B" stroke="#FBBF24" strokeOpacity="0.35" strokeWidth="1.5" />
          <path d="M168 348 L200 434 L232 348" fill="#FAF8F5" />
          <rect x="186" y="304" width="28" height="46" rx="10" fill="#F2D7C2" />
          <ellipse cx="200" cy="256" rx="45" ry="56" fill="#F7E1D0" />
          {/* Tousled Maestro Hair */}
          <path d="M150 248 C148 196, 175 182, 204 182 C234 182, 254 202, 250 252 C236 220, 212 214, 188 218 C170 220, 158 232, 150 248 Z" fill="#1C1917" />
          {/* Conductor Baton diagonal line */}
          <line x1="95" y1="435" x2="310" y2="335" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'astraea':
      return (
        <svg
          viewBox="0 0 400 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="bg-astraea" x1="0" y1="0" x2="400" y2="520" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#081C24" />
              <stop offset="50%" stopColor="#0F293A" />
              <stop offset="100%" stopColor="#1E1B4B" />
            </linearGradient>
          </defs>
          <rect width="400" height="520" fill="url(#bg-astraea)" />
          {/* Ringed Planet & Nebula Backdrop */}
          <circle cx="285" cy="145" r="46" fill="#F59E0B" fillOpacity="0.28" />
          <ellipse cx="285" cy="145" rx="92" ry="22" transform="rotate(-18 285 145)" stroke="#38BDF8" strokeOpacity="0.45" strokeWidth="2" />
          <circle cx="90" cy="110" r="2" fill="#E0F2FE" />
          <circle cx="140" cy="80" r="2.5" fill="#FDE68A" />
          <circle cx="335" cy="240" r="2" fill="#E0F2FE" />
          {/* Flight Jacket Silhouette */}
          <path d="M80 520 C94 398, 138 350, 200 350 C262 350, 306 398, 320 520 Z" fill="#1E293B" stroke="#38BDF8" strokeOpacity="0.4" strokeWidth="1.5" />
          <path d="M156 350 L200 415 L244 350" stroke="#F59E0B" strokeOpacity="0.7" strokeWidth="2.5" fill="#0F172A" />
          <rect x="187" y="304" width="26" height="48" rx="11" fill="#F3D2BE" />
          <ellipse cx="200" cy="258" rx="44" ry="54" fill="#F9DEC9" />
          {/* Auburn Navigator Hair */}
          <path d="M152 252 C152 198, 178 186, 202 186 C230 186, 250 204, 248 252 C234 226, 212 220, 188 222 C168 224, 158 236, 152 252 Z" fill="#7C2D12" />
          <path d="M192 290 Q200 296 210 290" stroke="#9A3412" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case 'minh_triet':
    default:
      return (
        <svg
          viewBox="0 0 400 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="bg-minh-triet" x1="0" y1="0" x2="400" y2="520" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#27211D" />
              <stop offset="55%" stopColor="#3E322B" />
              <stop offset="100%" stopColor="#1F2421" />
            </linearGradient>
          </defs>
          <rect width="400" height="520" fill="url(#bg-minh-triet)" />
          {/* Architectural Arch & Golden Autumn Window */}
          <path d="M96 360 L96 145 A104 104 0 0 1 304 145 L304 360 Z" fill="#F59E0B" fillOpacity="0.14" stroke="#FDE68A" strokeOpacity="0.3" strokeWidth="1.5" />
          <line x1="200" y1="41" x2="200" y2="360" stroke="#FDE68A" strokeOpacity="0.2" strokeWidth="1.2" />
          <line x1="96" y1="185" x2="304" y2="185" stroke="#FDE68A" strokeOpacity="0.2" strokeWidth="1.2" />
          {/* Portrait Silhouette */}
          <path d="M84 520 C98 400, 140 350, 200 350 C260 350, 302 400, 316 520 Z" fill="#292524" stroke="#D6D3D1" strokeOpacity="0.3" strokeWidth="1.5" />
          <rect x="187" y="304" width="26" height="48" rx="11" fill="#EED2B8" />
          <ellipse cx="200" cy="258" rx="44" ry="54" fill="#F5DEC9" />
          <path d="M154 248 C154 198, 178 186, 204 186 C230 186, 250 202, 248 248 C236 222, 214 216, 188 218 C168 220, 158 232, 154 248 Z" fill="#1C1917" />
          {/* Tortoiseshell Glasses */}
          <rect x="167" y="248" width="26" height="19" rx="5" stroke="#B45309" strokeWidth="2.4" fill="#FFFFFF" fillOpacity="0.1" />
          <rect x="207" y="248" width="26" height="19" rx="5" stroke="#B45309" strokeWidth="2.4" fill="#FFFFFF" fillOpacity="0.1" />
          <line x1="193" y1="256" x2="207" y2="256" stroke="#B45309" strokeWidth="2.2" />
        </svg>
      );
  }
}
