'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthModal from '@/components/models/AuthModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function SignInPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(true);
  const { user } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';

  useEffect(() => {
    if (user?._id) {
      router.replace(returnUrl);
    }
  }, [user, router, returnUrl]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          router.push(returnUrl);
        }}
      />
    </div>
  );
}
