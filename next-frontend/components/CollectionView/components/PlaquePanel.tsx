'use client';

import React from 'react';
import { UserIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { ProcessedTrinket } from '../types';

interface PlaquePanelProps {
  trinket: ProcessedTrinket | null;
  isVisible: boolean;
}

export function PlaquePanel({ trinket, isVisible }: PlaquePanelProps) {
  if (!isVisible || !trinket) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    }).format(date);
  };

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none px-4 w-full">
      <div
        className={`
          w-full max-w-md mx-auto px-4 py-3 rounded-2xl shadow-2xl border border-white/20
          transition-all duration-500 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        style={{
          background: 'linear-gradient(145deg, rgba(87, 83, 201, 0.55) 0%, rgba(87, 83, 201, 0.30) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Top Row - Title and Date */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-white text-lg font-semibold leading-tight flex-1 mr-3">
            {trinket.title}
          </h3>
          <div className="text-right flex-shrink-0">
            <p className="text-white text-sm font-medium">
              {formatDate(trinket.dateCreated)}
            </p>
          </div>
        </div>

        {/* Middle Section - Note */}
        {trinket.note && (
          <div className="mb-4">
            <p className="text-white/90 text-sm leading-relaxed">
              {trinket.note}
            </p>
          </div>
        )}

        {/* Bottom Row - Location and Creator */}
        <div className="flex justify-between items-center text-xs">
          {/* Location */}
          {trinket.location && (
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
              <p className="text-white text-xs font-medium">
                {trinket.location}
              </p>
            </div>
          )}

          {/* Creator */}
          <div className="flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
            <p className="text-white text-xs font-medium">
              {trinket.creatorName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}