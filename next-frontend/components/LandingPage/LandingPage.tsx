import React, { useState, useEffect } from 'react';
import ScrollingColumn from './ScrollingColumn';

// Custom Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'glass' | 'glass-primary' | 'default';
  size?: 'sm' | 'xl' | 'default';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'default', 
  size = 'default', 
  className = '', 
  children, 
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    glass: 'glass-button bg-gray-900/20 text-gray-900 font-bold hover:bg-gray-900/30 hover:glow-strong active:scale-95',
    'glass-primary': 'glass-button bg-blue-600/20 text-white font-bold hover:bg-blue-600/30 hover:glow-strong active:scale-95'
  };
  
  const sizeClasses = {
    default: 'h-10 py-2 px-4 rounded-full',
    sm: 'h-9 px-3 text-sm rounded-full',
    xl: 'h-14 px-10 text-lg rounded-full'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
// Using public images as strings
const trinketLogo = '/trinket_logo.png';

const LandingPage: React.FC = () => {
  // State for responsive column count
  const [numColumns, setNumColumns] = useState(8);

  // Images from public/images
  const imagesSet1 = [
    '/images/badge.png',
    '/images/matcha.png',
    '/images/mentra.png',
    '/images/sculpture.png',
    '/images/throatmic.png'
  ];

  // Images from public/images2
  const imagesSet2 = [
    '/images2/chill.png',
    '/images2/liberty.png',
    '/images2/oreo.png',
    '/images2/peanutbutter.png',
    '/images2/tokyo.png'
  ];

  // Function to determine number of columns based on screen width
  const getColumnCount = (width: number) => {
    if (width < 640) return 3;      // Mobile: 3 columns
    if (width < 768) return 4;      // Large mobile: 4 columns
    if (width < 1024) return 6;     // Tablet: 6 columns
    if (width < 1280) return 8;     // Desktop: 8 columns
    return 10;                      // Large desktop: 10 columns
  };

  // Effect to handle responsive column count
  useEffect(() => {
    const handleResize = () => {
      setNumColumns(getColumnCount(window.innerWidth));
    };

    // Set initial column count
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper function to create random arrangements from an image set
  const createRandomArrangements = (imageSet: string[], numArrangements: number) => {
    const arrangements = [];
    for (let i = 0; i < numArrangements; i++) {
      // Create a shuffled copy of the image set
      const shuffled = [...imageSet].sort(() => Math.random() - 0.5);
      // Take 3 images for each column arrangement
      arrangements.push(shuffled.slice(0, 3));
    }
    return arrangements;
  };

  // Create alternating column arrangements based on responsive column count
  const allBackgroundImages = [];

  for (let i = 0; i < numColumns; i++) {
    if (i % 2 === 0) {
      // Even columns use imagesSet1
      const arrangements = createRandomArrangements(imagesSet1, 1);
      allBackgroundImages.push(arrangements[0]);
    } else {
      // Odd columns use imagesSet2
      const arrangements = createRandomArrangements(imagesSet2, 1);
      allBackgroundImages.push(arrangements[0]);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background scrolling columns */}
      <div className="absolute inset-0 flex pointer-events-none overflow-hidden justify-evenly">
        {allBackgroundImages.map((images, index) => {
          // Calculate responsive column width and spacing based on column count
          const getColumnStyles = () => {
            if (numColumns <= 3) {
              return {
                className: "w-20 sm:w-24 flex-shrink-0 transform rotate-12 opacity-20",
                marginStyle: { marginX: '1rem' }
              };
            } else if (numColumns <= 4) {
              return {
                className: "w-16 sm:w-20 flex-shrink-0 transform rotate-12 opacity-20",
                marginStyle: { marginX: '0.75rem' }
              };
            } else if (numColumns <= 6) {
              return {
                className: "w-14 sm:w-16 md:w-20 flex-shrink-0 transform rotate-12 opacity-20",
                marginStyle: { marginX: '0.5rem' }
              };
            } else if (numColumns <= 8) {
              return {
                className: "w-12 sm:w-14 md:w-16 lg:w-20 flex-shrink-0 transform rotate-12 opacity-20",
                marginStyle: { marginX: '0.25rem' }
              };
            } else {
              return {
                className: "w-10 sm:w-12 md:w-14 lg:w-16 xl:w-18 flex-shrink-0 transform rotate-12 opacity-20",
                marginStyle: { marginX: '0.125rem' }
              };
            }
          };

          const { className, marginStyle } = getColumnStyles();

          return (
            <ScrollingColumn
              key={`${index}-${numColumns}`}
              images={images}
              direction={index % 2 === 0 ? 'up' : 'down'}
              className={className}
              style={{
                marginLeft: index === 0 ? marginStyle.marginX : '0',
                marginRight: marginStyle.marginX
              }}
            />
          );
        })}
      </div>

      {/* Login button - top right */}
      <div className="absolute top-6 right-6 z-10">
        <Button 
          variant="glass" 
          size="default"
          className="font-bold shadow-xl hover:shadow-gray-500/25 transition-all duration-300"
          onClick={() => {
            // Add login functionality here
            console.log('Login clicked');
          }}
        >
          Login
        </Button>
      </div>

      {/* Main content - centered */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 space-y-6">
        {/* Logo - Large and centered */}
        <div className="flex justify-center">
          <img
            src={trinketLogo}
            alt="Trinket"
            className="h-48 md:h-56 lg:h-64 xl:h-72 drop-shadow-2xl object-contain max-w-full"
          />
        </div>

        {/* Thin glassmorphic card with tagline */}
        <div className="glass rounded-2xl px-8 py-2 border border-gray-200/50 text-center max-w-md">
          <h2 className="text-lg md:text-xl font-light text-gray-800 tracking-wide">
            Collect your world...
          </h2>
        </div>

        {/* Glassmorphic signup button */}
        <div>
          <Button
            variant="glass-primary"
            size="xl"
            className="text-xl font-bold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 px-12 bg-blue-600/40 hover:bg-blue-600/50"
            onClick={() => {
              // Add signup functionality here
              console.log('Sign Up clicked');
            }}
          >
            Sign Up Now
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <p className="text-sm text-gray-600 glass px-4 py-2 rounded-full">
          Built for HackMIT 2025
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;