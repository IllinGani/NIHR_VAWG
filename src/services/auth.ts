import { auth, db, firebaseConfig } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export const handleSecureRegister = async (email: string, password: string): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    let userCredential;
    try {
      // 1. Perform Auth Sign-Up
      userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      console.log('User credential created successfully under brand new Auth account.');
    } catch (regErr: any) {
      if (regErr.code === 'auth/email-already-in-use') {
        console.log('Account email already exists in Firebase Auth. Attempting smart automatic sign-in fallback...');
        try {
          userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
          console.log('User signed in successfully using existing Auth account with provided registration password.');
        } catch (signInErr: any) {
          console.error('Auto sign-in fallback failed:', signInErr);
          throw {
            code: 'auth/email-already-in-use',
            message: `The institutional email "${email}" has already been initialized in the authentication database. If you previously registered, toggle to the "Sign In" view below and enter your previous password. If you cannot remember your password, please click "Forgot password? Reset it here" on the Sign In screen to reset it.`
          };
        }
      } else if (regErr.code === 'auth/operation-not-allowed') {
        throw {
          code: 'auth/operation-not-allowed',
          message: `Email/Password Authentication is not enabled for this dynamic Firebase project yet. Because you recently linked a new Firebase project (${firebaseConfig.projectId}), the Administrator must enable the "Email/Password" sign-in method in the Firebase Console: Go to Authentication -> Sign-in Method -> Click "Add new provider" -> Choose "Email/Password" -> Enable and save.`
        };
      } else if (regErr.code === 'auth/configuration-not-found' || regErr.message?.includes('configuration-not-found')) {
        throw {
          code: 'auth/configuration-not-found',
          message: `Authentication Configuration Missing: The requested sign-in method is not enabled for this dynamic Firebase project (${firebaseConfig.projectId}) yet. The Administrator must enable it in the Firebase Console: Go to Authentication -> Sign-in Method -> Add "Email/Password" and "Google" as providers -> Enable and save. Also verify that Identity Platform is properly set up if prompted.`
        };
      } else if (regErr.code === 'auth/unauthorized-domain' || regErr.message?.includes('unauthorized-domain')) {
        throw {
          code: 'auth/unauthorized-domain',
          message: `Unauthorized Domain Error: The domain "${window.location.hostname}" must be added to the Authorized Domains list in the Firebase Console for project (${firebaseConfig.projectId}). Go to Authentication -> Settings -> Click "Authorized domains" tab -> Click "Add domain" -> Type in "${window.location.hostname}" -> Click "Add".`
        };
      } else {
        throw regErr;
      }
    }

    const newUid = userCredential.user.uid;

    // 2. Clear any deleted_users blacklist entry since they are intentionally registering a new account
    try {
      const deletedDocRef = doc(db, 'deleted_users', normalizedEmail);
      await deleteDoc(deletedDocRef);
      console.log('Cleared deleted_users blacklist entry on registration/auto-login.');
    } catch (clearErr) {
      console.log('No blacklist entry existed or could not clear:', clearErr);
    }

    // 3. Create/Reset Database Profile
    const userDocRef = doc(db, 'users', newUid);
    await setDoc(userDocRef, {
      id: newUid,
      uid: newUid,
      email: normalizedEmail,
      displayName: email.split('@')[0],
      role: 'user',
      isApproved: false,
      requestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('User database profile reconstituted successfully');
  } catch (error: any) {
    console.error('Registration processing failed:', error);
    throw error;
  }
};
