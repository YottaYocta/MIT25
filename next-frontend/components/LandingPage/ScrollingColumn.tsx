import React from 'react';

interface ScrollingColumnProps {
  images: string[];
  direction: 'up' | 'down';
  className?: string;
  style?: React.CSSProperties;
}

const ScrollingColumn: React.FC<ScrollingColumnProps> = ({ images, direction, className = '', style }) => {
  // Duplicate images to create seamless scrolling
  const duplicatedImages = [...images, ...images];

  return (
    <div className={`flex flex-col space-y-4 ${className}`} style={style}>
      <div className={direction === 'up' ? 'scrolling-column' : 'scrolling-column-reverse'}>
        {duplicatedImages.map((image, index) => (
          <div key={index} className="mb-4">
            <img
              src={image}
              alt=""
              className="w-full h-32 md:h-48 object-cover rounded-lg glass border-blue-500/20"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScrollingColumn;