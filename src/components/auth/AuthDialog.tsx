
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { 
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from '@/components/ui/drawer';
import { LogIn, X, ChevronLeft } from 'lucide-react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { useAuth } from '@/context/AuthContext';
import { useMobile } from '@/hooks/use-mobile';

type AuthMode = 'login' | 'signup';

const AuthDialog = () => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const { user } = useAuth();
  const isMobile = useMobile();

  if (user) {
    return null; // Don't show auth dialog if user is logged in
  }

  const handleSuccess = () => {
    setOpen(false);
  };

  const authContent = (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'login' 
              ? 'Enter your details to sign in to your account.' 
              : 'Fill in the information below to create your account.'}
          </p>
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" asChild>
            <DrawerClose>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DrawerClose>
          </Button>
        )}
      </div>
      
      {mode === 'login' ? (
        <LoginForm onSuccess={handleSuccess} />
      ) : (
        <SignupForm onSuccess={handleSuccess} />
      )}
      
      <div className="mt-4 text-center text-sm">
        {mode === 'login' ? (
          <p>
            Don't have an account?{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto" 
              onClick={() => setMode('signup')}
            >
              Create one
            </Button>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto" 
              onClick={() => setMode('login')}
            >
              Sign in
            </Button>
          </p>
        )}
      </div>
    </>
  );

  // Mobile version with drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" className="gap-2">
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        </DrawerTrigger>
        <DrawerContent className="px-4 pt-12 pb-6">
          <div className="flex flex-col space-y-4 max-w-md mx-auto w-full">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute left-4 top-4" 
              onClick={() => setOpen(false)}
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            {authContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop version with dialog
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LogIn className="h-4 w-4" />
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login' 
              ? 'Enter your details to sign in to your account.' 
              : 'Fill in the information below to create your account.'}
          </DialogDescription>
        </DialogHeader>
        
        {mode === 'login' ? (
          <LoginForm onSuccess={handleSuccess} />
        ) : (
          <SignupForm onSuccess={handleSuccess} />
        )}
        
        <div className="mt-4 text-center text-sm">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto" 
                onClick={() => setMode('signup')}
              >
                Create one
              </Button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto" 
                onClick={() => setMode('login')}
              >
                Sign in
              </Button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
