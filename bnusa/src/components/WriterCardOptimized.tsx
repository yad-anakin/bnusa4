import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DocumentTextIcon, UserCircleIcon, ArrowLongLeftIcon, PencilSquareIcon, AdjustmentsHorizontalIcon, PaintBrushIcon } from '@heroicons/react/24/outline';

interface WriterCardProps {
  writer: {
    id: string | number;
    name: string;
    bio: string;
    avatar: string;
    articlesCount: number;
    followers: number;
    username?: string;
    role?: 'writer' | 'supervisor' | 'designer';
    designsCount?: number; // For designers
    supervisorText?: string; // For supervisors
  };
  rank?: 1 | 2 | 3; // Optional rank for special styling (1=gold, 2=platinum, 3=bronze)
}

/**
 * Modern writer card component with elegant styling and optimized performance
 */
const WriterCardOptimized = ({ writer, rank }: WriterCardProps) => {
  // Extract initials for fallback avatar
  const initials = writer.name 
    ? writer.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '';
    
  // State to track image loading errors
  const [imageError, setImageError] = React.useState(false);
  
  // Set role-specific styling
  const role = writer.role || 'writer';
  
  // Define rank-specific styles
  const rankStyles = {
    1: { // Gold
      border: 'border-amber-400/70',
      shadow: 'shadow-amber-300/20',
      badge: 'bg-gradient-to-r from-amber-400 to-yellow-300',
      text: 'text-amber-800',
      label: '١',
      icon: '👑', // Crown for first place
      glow: 'from-yellow-300/30 to-amber-500/20'
    },
    2: { // Platinum
      border: 'border-slate-300/70',
      shadow: 'shadow-slate-300/20',
      badge: 'bg-gradient-to-r from-slate-400 to-slate-300',
      text: 'text-slate-700',
      label: '٢',
      icon: '✨', // Sparkles for second place
      glow: 'from-slate-300/30 to-slate-400/20'
    },
    3: { // Bronze
      border: 'border-amber-700/70',
      shadow: 'shadow-amber-700/20',
      badge: 'bg-gradient-to-r from-amber-700 to-amber-600',
      text: 'text-amber-900',
      label: '٣',
      icon: '🏅', // Medal for third place
      glow: 'from-amber-600/30 to-amber-700/20'
    }
  };
  
  // Define role-specific colors and icons
  const roleStyles = {
    writer: {
      gradient: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-500/30',
      hoverBg: 'hover:bg-blue-500',
      icon: <PencilSquareIcon className="h-3.5 w-3.5 ml-1 text-blue-700" />,
      label: 'نووسەر'
    },
    supervisor: {
      gradient: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-700',
      borderColor: 'border-green-500/30',
      hoverBg: 'hover:bg-green-500',
      icon: <AdjustmentsHorizontalIcon className="h-3.5 w-3.5 ml-1 text-green-700" />,
      label: 'سەرپەرشتیار'
    },
    designer: {
      gradient: 'from-purple-500 to-fuchsia-600',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-500/30',
      hoverBg: 'hover:bg-purple-500',
      icon: <PaintBrushIcon className="h-3.5 w-3.5 ml-1 text-purple-700" />,
      label: 'دیزاینەر'
    }
  };
  
  // Get the appropriate style for the current role
  const currentStyle = roleStyles[role];
  
  // Generate a random gradient for avatar background if no image
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
  ];
  
  // Use a hash of the name to consistently pick the same gradient for each writer
  const nameHash = writer.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradientIndex = nameHash % gradients.length;
  const avatarGradient = currentStyle.gradient || gradients[gradientIndex];

  // SVG patterns for decorative elements
  const decorativeCurls = [
    <svg key="curl1" className="absolute -top-4 -left-4 w-16 h-16 text-amber-400/70 transform rotate-45" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 19.5C8.5 19.5 12 17 12 12.5S8.5 5.5 4 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 19.5C15.5 19.5 12 17 12 12.5S15.5 5.5 20 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    <svg key="curl2" className="absolute -top-6 right-8 w-12 h-12 text-slate-300/70 transform -rotate-15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 12C6 7.58 9.58 4 14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 8C18 12.42 14.42 16 10 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    <svg key="curl3" className="absolute -bottom-4 -right-4 w-16 h-16 text-amber-700/70 transform -rotate-45" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 5C8 9.42 11.58 13 16 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 13C16 16.87 12.87 20 9 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ];

  // Generate random stars for decoration
  const renderStars = (count: number, color: string) => {
    return Array.from({ length: count }).map((_, i) => {
      const size = Math.random() * 6 + 2; // 2-8px
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const opacity = Math.random() * 0.5 + 0.2; // 0.2-0.7
      
      return (
        <div 
          key={i}
          className={`absolute ${color} animate-pulse`}
          style={{
            top: `${top}%`,
            left: `${left}%`,
            width: `${size}px`,
            height: `${size}px`,
            opacity,
            borderRadius: '50%',
            boxShadow: `0 0 ${size/2}px ${size/3}px currentColor`
          }}
        />
      );
    });
  };

  // Confetti elements for top ranked cards
  const renderConfetti = (count: number, colors: string[]) => {
    return Array.from({ length: count }).map((_, i) => {
      const size = Math.random() * 8 + 4; // 4-12px
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const colorIndex = Math.floor(Math.random() * colors.length);
      const rotation = Math.random() * 360;
      
      return (
        <div 
          key={i}
          className={`absolute ${colors[colorIndex]} z-0`}
          style={{
            top: `${top}%`,
            left: `${left}%`,
            width: `${size}px`,
            height: `${size/2}px`,
            transform: `rotate(${rotation}deg)`,
            opacity: 0.4
          }}
        />
      );
    });
  };

  // Floating shapes for top ranked cards
  const renderFloatingShapes = (rank: 1 | 2 | 3) => {
    // Different shapes for different ranks
    if (rank === 1) {
      return (
        <>
          {/* Diamond shapes for rank 1 */}
          <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-yellow-300/30 rotate-45 animate-float-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-amber-400/20 rotate-45 animate-float-medium"></div>
          <div className="absolute top-2/3 right-1/3 w-3 h-3 bg-yellow-200/30 rotate-45 animate-float-fast"></div>
          
          {/* Triangular prism effect */}
          <div className="absolute top-10 right-10 animate-float-medium">
            <div className="w-0 h-0 
              border-l-[8px] border-l-transparent
              border-b-[16px] border-b-yellow-300/40
              border-r-[8px] border-r-transparent">
            </div>
          </div>
          
          {/* Circular pulse */}
          <div className="absolute top-1/2 left-1/3 w-8 h-8 rounded-full bg-amber-300/10 animate-pulse-slow"></div>
          
          {/* Sparkling stars */}
          <div className="absolute top-1/4 right-1/3 animate-twinkle">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                fill="rgba(252, 211, 77, 0.3)" stroke="rgba(252, 211, 77, 0.5)" strokeWidth="1" />
            </svg>
          </div>
          <div className="absolute bottom-10 left-10 animate-twinkle-delay">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                fill="rgba(252, 211, 77, 0.3)" stroke="rgba(252, 211, 77, 0.5)" strokeWidth="1" />
            </svg>
          </div>
          
          {/* Floating particles */}
          <div className="absolute top-1/3 right-1/5 w-1 h-1 rounded-full bg-yellow-300/40 animate-particle1"></div>
          <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 rounded-full bg-amber-400/40 animate-particle2"></div>
        </>
      );
    } else if (rank === 2) {
      return (
        <>
          {/* Circles for rank 2 */}
          <div className="absolute top-1/4 right-1/4 w-5 h-5 rounded-full bg-slate-300/30 animate-float-medium"></div>
          <div className="absolute bottom-1/3 left-1/4 w-3 h-3 rounded-full bg-slate-400/20 animate-float-slow"></div>
          <div className="absolute top-2/3 right-1/3 w-4 h-4 rounded-full bg-slate-200/30 animate-float-fast"></div>
          
          {/* Square rotating */}
          <div className="absolute top-20 left-10 w-6 h-6 bg-slate-300/20 animate-spin-slow"></div>
          
          {/* Decorative lines */}
          <div className="absolute top-1/2 left-0 w-12 h-px bg-gradient-to-r from-slate-300/0 via-slate-300/40 to-slate-300/0 animate-width-pulse"></div>
          <div className="absolute bottom-1/3 right-0 w-8 h-px bg-gradient-to-r from-slate-300/0 via-slate-300/30 to-slate-300/0 animate-width-pulse-delay"></div>
          
          {/* Floating triangles */}
          <div className="absolute top-10 right-1/3 animate-float-medium">
            <div className="w-0 h-0 
              border-l-[5px] border-l-transparent
              border-b-[8px] border-b-slate-300/30
              border-r-[5px] border-r-transparent rotate-180">
            </div>
          </div>
          <div className="absolute bottom-12 left-1/3 animate-float-slow">
            <div className="w-0 h-0 
              border-l-[4px] border-l-transparent
              border-b-[7px] border-b-slate-400/30
              border-r-[4px] border-r-transparent">
            </div>
          </div>
          
          {/* Orbiting dot */}
          <div className="absolute top-1/3 left-1/2 w-16 h-16">
            <div className="relative w-full h-full animate-spin-slow">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-400/40"></div>
            </div>
          </div>
          
          {/* Pulsing ring */}
          <div className="absolute top-2/3 left-1/4 w-10 h-10 rounded-full border border-slate-300/20 animate-pulse-slow"></div>
        </>
      );
    } else {
      return (
        <>
          {/* Hexagons for rank 3 */}
          <div className="absolute top-1/3 left-1/5 w-6 h-6 bg-amber-700/20 clip-hexagon animate-float-medium"></div>
          <div className="absolute bottom-1/4 right-1/5 w-4 h-4 bg-amber-600/20 clip-hexagon animate-float-slow"></div>
          
          {/* Cross shape */}
          <div className="absolute top-1/2 right-1/3 animate-float-fast">
            <div className="relative w-5 h-5">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-5 bg-amber-600/30"></div>
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-5 h-2 bg-amber-600/30"></div>
            </div>
          </div>
        </>
      );
    }
  };

  // Only show top 3 animations for supervisors, not for writers/designers
  const showRankDecor = rank && role === 'supervisor';

  return (
    <div className={`group relative bg-white/20 backdrop-blur-lg rounded-xl overflow-hidden 
      ${rank ? `border-2 ${rankStyles[rank].border}` : 'border border-white/30'} 
      hover:border-[var(--primary)]/30 transition-all duration-300 
      ${rank === 1 ? 'scale-105 z-10' : rank === 2 ? 'scale-102 z-5' : ''}`}>
      
      {/* Premium rank indicator (only for top 3, only for supervisors) */}
      {showRankDecor && (
        <>
          {/* Corner accent with enhanced design */}
          <div className={`absolute -top-1 -right-1 w-24 h-24 ${rankStyles[rank].badge} opacity-90 rounded-bl-[50px] z-10`}></div>
          
          {/* Elegant ribbon effect */}
          <div className="absolute -top-1 right-12 w-12 h-6 bg-white/20 backdrop-blur-sm transform rotate-45 z-10"></div>
          
          {/* Rank number with premium styling */}
          <div className="absolute top-3 right-3 z-20 flex items-center justify-center">
            <div className={`w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg border-2 ${rankStyles[rank].border}`}>
              <span className={`${rankStyles[rank].text} text-lg font-bold`}>{rankStyles[rank].label}</span>
            </div>
          </div>
          
          {/* Icon decoration with animation */}
          <div className="absolute top-3 right-14 z-20 animate-pulse">
            <span className="text-white text-xl drop-shadow-md">{rankStyles[rank].icon}</span>
          </div>
          
          {/* Additional decorative element */}
          {rank === 1 && (
            <div className="absolute top-14 right-4 z-20 transform -rotate-12">
              <span className="text-white text-xs">✦</span>
            </div>
          )}
          
          {/* Additional decorative element for rank 2 */}
          {rank === 2 && (
            <div className="absolute top-14 right-4 z-20 transform rotate-12">
              <span className="text-white text-xs">✧</span>
            </div>
          )}

          {/* Decorative curls for top ranked cards */}
          {decorativeCurls[rank-1]}
          
          {/* Confetti for top ranked cards */}
          {rank === 1 && renderConfetti(15, ['bg-yellow-300', 'bg-amber-400', 'bg-white'])}
          {rank === 2 && renderConfetti(12, ['bg-slate-300', 'bg-slate-400', 'bg-white'])}
          {rank === 3 && renderConfetti(8, ['bg-amber-600', 'bg-amber-700', 'bg-white'])}
          
          {/* Stars for top ranked cards */}
          {rank === 1 && renderStars(12, 'text-yellow-300')}
          {rank === 2 && renderStars(10, 'text-slate-300')}
          {rank === 3 && renderStars(6, 'text-amber-600')}
          
          {/* Floating shapes specific to each rank */}
          {renderFloatingShapes(rank)}
          
          {/* Decorative corner shreds */}
          <div className={`absolute -top-1 -left-1 w-10 h-10 ${rankStyles[rank].badge} opacity-70 clip-corner-tl z-10`}></div>
          <div className={`absolute -bottom-1 -right-1 w-10 h-10 ${rankStyles[rank].badge} opacity-70 clip-corner-br z-10`}></div>
          
          {/* Animated wave border for rank 1 */}
          {rank === 1 && (
            <div className="absolute inset-0 z-0 overflow-hidden rounded-xl">
              <div className="absolute -inset-1 border-4 border-dashed border-yellow-300/30 rounded-xl animate-[spin_12s_linear_infinite]"></div>
            </div>
          )}
          
          {/* Animated dotted border for rank 2 */}
          {rank === 2 && (
            <div className="absolute inset-0 z-0 overflow-hidden rounded-xl">
              <div className="absolute -inset-1 border-3 border-dotted border-slate-300/30 rounded-xl animate-[spin_15s_linear_infinite_reverse]"></div>
            </div>
          )}
        </>
      )}
      
      {/* Light effects behind the card */}
      <div className={`absolute -top-10 -right-10 w-40 h-40 ${rank ? rankStyles[rank].badge.replace('from-', 'from-opacity-20 ').replace('to-', 'to-opacity-10 ') : 'bg-blue-400/20'} rounded-full blur-3xl`}></div>
      <div className={`absolute -bottom-8 -left-8 w-32 h-32 ${rank ? rankStyles[rank].badge.replace('from-', 'from-opacity-15 ').replace('to-', 'to-opacity-5 ') : 'bg-purple-400/20'} rounded-full blur-3xl`}></div>
      
      {/* Special glow effects for top-ranked cards */}
      {rank === 1 && (
        <>
          <div className="absolute -top-5 -right-5 w-16 h-16 bg-yellow-300/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-1/3 left-1/3 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-yellow-300/5 rounded-full blur-3xl"></div>
          {/* Zigzag light path instead of straight beam */}
          <div className="absolute h-full w-full">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-full">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-yellow-300/0 via-yellow-300/20 to-yellow-300/0 animate-zigzag"></div>
            </div>
          </div>
          
          {/* Radial light rays */}
          <div className="absolute inset-0 overflow-hidden opacity-30">
            <div className="absolute inset-0 bg-radial-gold animate-pulse-slow"></div>
          </div>
        </>
      )}
      {rank === 2 && (
        <>
          <div className="absolute top-1/3 left-1/3 w-28 h-28 bg-gradient-to-br from-slate-400/10 to-slate-300/5 rounded-full blur-2xl"></div>
          {/* Spiral light path */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24">
              <div className="absolute w-full h-full border-2 border-slate-300/20 rounded-full animate-spiral"></div>
            </div>
          </div>
          
          {/* Double spiral effect */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16">
              <div className="absolute w-full h-full border border-slate-400/15 rounded-full animate-spiral-reverse"></div>
            </div>
          </div>
          
          {/* Light sweep effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -inset-10 bg-conic-silver opacity-20 animate-spin-very-slow"></div>
          </div>
        </>
      )}
      {rank === 3 && (
        <>
          <div className="absolute top-1/3 left-1/3 w-24 h-24 bg-gradient-to-br from-amber-700/10 to-amber-600/5 rounded-full blur-2xl"></div>
          {/* Pulsing rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border border-amber-600/10 rounded-full animate-ripple"></div>
            <div className="absolute w-16 h-16 border border-amber-600/10 rounded-full animate-ripple-delay"></div>
          </div>
        </>
      )}
      
      {!rank && role === 'designer' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"></div>
      )}
      {!rank && role === 'supervisor' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-green-500/10 rounded-full blur-xl"></div>
      )}
      {!rank && role === 'writer' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
      )}
      
      <div className="p-6 relative z-10">
        {/* Writer avatar with gradient background */}
        <div className="flex items-center mb-5">
          <div className={`w-18 h-18 rounded-full overflow-hidden bg-gradient-to-br ${avatarGradient} relative flex items-center justify-center 
            ${rank === 1 ? 'ring-4 ring-amber-400/70' : rank === 2 ? 'ring-3 ring-slate-300/60' : rank === 3 ? 'ring-2 ring-amber-700/50' : 'ring-2 ring-white/30'} 
            group-hover:ring-[var(--primary)]/40 transition-all duration-300`}>
            {!imageError && writer.avatar ? (
              <Image
                src={writer.avatar}
                alt={`${writer.name} avatar`}
                fill
                sizes="72px"
                style={{ objectFit: 'cover' }}
                onError={() => setImageError(true)}
                className="transition-transform group-hover:scale-110 duration-300"
              />
            ) : (
              <span className="text-xl font-bold text-white">{initials}</span>
            )}
            
            {/* Pulsing ring animation for top ranked */}
            {rank === 1 && (
              <div className="absolute -inset-1 rounded-full border-2 border-amber-400/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
            )}
            
            {/* Glowing effect for rank 2 */}
            {rank === 2 && (
              <div className="absolute -inset-1 rounded-full border border-slate-300/30 animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
            )}
          </div>
          
          <div className="mr-4 flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-[var(--primary)] transition-colors">
              {writer.name}
              {rank === 1 && <span className="ml-1 inline-block animate-bounce">✨</span>}
              {rank === 2 && <span className="ml-1 inline-block animate-pulse">✧</span>}
            </h3>
            <div className="flex items-center text-gray-500 text-sm">
              {currentStyle.icon}
              <span className={`${currentStyle.textColor} font-medium`}>{currentStyle.label}</span>
            </div>
          </div>
        </div>
        
        {/* Writer bio with fixed height */}
        <div className="h-[48px] mb-5 overflow-hidden">
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 backdrop-blur-sm bg-white/30 p-2 rounded-lg">
            {writer.bio || "بەکارهێنەر لە پلاتفۆرمی بنووسە"}
          </p>
        </div>
        
        {/* Stats row */}
        <div className="flex items-center justify-center mb-5">
          {role === 'designer' ? (
            <div className={`flex items-center ${currentStyle.bgColor} py-2.5 px-5 rounded-lg backdrop-blur-sm shadow-sm border border-purple-200/30`}>
              <PaintBrushIcon className={`h-5 w-5 ${currentStyle.textColor} ml-2`} />
              <div className="text-sm">
                <span className={`font-bold text-base ${currentStyle.textColor}`}>{writer.designsCount || 0}</span>
                <span className="text-gray-600 mr-1.5">دیزاین</span>
              </div>
            </div>
          ) : role === 'supervisor' ? (
            <div className="w-full bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-lg p-3.5 text-green-800 text-sm text-center shadow-sm">
              {writer.supervisorText || 'سەرپەرشتیار'}
            </div>
          ) : (
            <div className={`flex items-center ${currentStyle.bgColor} py-2.5 px-5 rounded-lg backdrop-blur-sm shadow-sm border border-blue-200/30`}>
              <DocumentTextIcon className={`h-5 w-5 ${currentStyle.textColor} ml-2`} />
              <div className="text-sm">
                <span className={`font-bold text-base ${currentStyle.textColor}`}>{writer.articlesCount}</span>
                <span className="text-gray-600 mr-1.5">وتار</span>
              </div>
            </div>
          )}
        </div>
        
        {/* View profile button */}
        <Link 
          href={`/users/${writer.username}`} 
          className={`flex items-center justify-center w-full text-center py-3 px-5 rounded-lg transition-all duration-300 ${currentStyle.textColor} ${currentStyle.borderColor} border-2 ${currentStyle.hoverBg} hover:text-white font-medium text-sm`} 
        >
          <span>بینینی پڕۆفایل</span>
          <ArrowLongLeftIcon className="h-5 w-5 mr-1.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      
      {/* Enhanced accent line at the bottom */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${rank ? rankStyles[rank].badge : avatarGradient} opacity-70 absolute bottom-0`}></div>
      
      {/* Premium decorative elements for top cards */}
      {rank === 1 && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-yellow-300/70 blur-sm"></div>
      )}
      
      {/* Premium decorative elements for second place */}
      {rank === 2 && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-slate-300/60 blur-sm"></div>
      )}
      
      {/* Subtle glow effect - even more reduced intensity */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br ${rank ? rankStyles[rank].badge : avatarGradient} blur-xl -z-10`}></div>
    </div>
  );
};

const areEqual = (prevProps: WriterCardProps, nextProps: WriterCardProps) => {
  // Only re-render if writer id, rank, or minimal display fields change
  return (
    prevProps.writer.id === nextProps.writer.id &&
    prevProps.writer.name === nextProps.writer.name &&
    prevProps.writer.avatar === nextProps.writer.avatar &&
    prevProps.writer.articlesCount === nextProps.writer.articlesCount &&
    prevProps.writer.designsCount === nextProps.writer.designsCount &&
    prevProps.writer.supervisorText === nextProps.writer.supervisorText &&
    prevProps.writer.role === nextProps.writer.role &&
    prevProps.rank === nextProps.rank
  );
};

export default React.memo(WriterCardOptimized, areEqual); 