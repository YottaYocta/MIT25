'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Nav } from './Nav';
import Link from 'next/link';
import Button from './Button';
import { User } from '@supabase/supabase-js';

interface ConditionalNavProps {
  className?: string;
}

export function ConditionalNav({ className = '' }: ConditionalNavProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Don't render anything while loading to avoid flash
  if (loading) {
    return null;
  }

  // If user is logged in, show the full navigation
  if (user) {
    return <Nav />;
  }

  // If user is not logged in, show simple login nav
  return (
    <div className={`fixed flex justify-center items-end gap-2 bottom-0 left-0 right-0 h-20 py-2 w-full z-50 ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 2862 90"
        fill="none"
        className="h-20 fixed bottom-0 left-0 right-0 w-full -z-10"
        preserveAspectRatio="none"
      >
        <path
          d="M1 25.4997V88.9996H2861V25.4997H1480C1470.5 25.4997 1476.25 1.00023 1460 1.00002H1402C1385.75 0.999986 1392.5 25.4997 1380 25.4997H1Z"
          fill="url(#paint0_linear_131_15)"
          stroke="#DEE4FF"
        />
        <defs>
          <linearGradient
            id="paint0_linear_131_15"
            x1="1431"
            y1="1"
            x2="1431"
            y2="88.9996"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="#E9ECFF" />
          </linearGradient>
        </defs>
      </svg>

      <Link href="/login">
        <Button className="h-8 w-32 justify-center">Sign In</Button>
      </Link>

      <Link href="/public">
        <Button className="h-8 w-32 justify-center">Browse</Button>
      </Link>
    </div>
  );
}
