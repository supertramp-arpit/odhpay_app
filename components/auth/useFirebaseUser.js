import { useEffect, useState } from 'react';
import { onAuthChanged } from './FirebaseAuthUtils';

export function useFirebaseUser() {
  const [initializing, setInitializing] = useState(true);
  const [userInformation, setUserInformation] = useState(null);

  useEffect(() => {
    const unsub = onAuthChanged(u => {
      setUserInformation(u);
      if (initializing) setInitializing(false);
    });
    return unsub;
  }, [initializing]);

  return { userInformation, initializing };
}
