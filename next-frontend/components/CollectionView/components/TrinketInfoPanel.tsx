'use client';

import React from 'react';
import { XMarkIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import { TrinketInfoPanelProps } from '../types';

export function TrinketInfoPanel({ trinket, isVisible, onClose }: TrinketInfoPanelProps) {
  if (!isVisible || !trinket) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-t-2xl sm:rounded-2xl shadow-xl border border-white/20 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate pr-2">
            {trinket.title}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100/50 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Note */}
          {trinket.note && (
            <div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                {trinket.note}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-3 pt-2 border-t border-gray-200/50">
            {/* Creator */}
            <div className="flex items-center gap-3">
              <UserIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  Creator
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  {trinket.creatorName}
                </p>
              </div>
            </div>

            {/* Date Created */}
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  Date Created
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  {formatDate(trinket.dateCreated)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile drag indicator */}
        <div className="sm:hidden flex justify-center py-2">
          <div className="w-8 h-1 bg-gray-300 rounded-full" />
        </div>
      </div>
    </div>
  );
}