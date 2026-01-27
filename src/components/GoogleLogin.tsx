import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const GoogleLogin: React.FC = () => {
  const { signInWithGoogle, isLoading } = useAuth();

  return (
    <div className="flex justify-center mt-8">
      <Button 
        variant="outline" 
        className="w-[250px] flex items-center gap-2"
        onClick={() => signInWithGoogle()} // This calls the Supabase redirect
        // disabled={isLoading}
      >
        <img 
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
          alt="Google" 
          className="w-5 h-5"
        />
        Continue with Google
      </Button>
    </div>
  );
};

export default GoogleLogin;