import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} displayName - User's display name
 * @returns {Promise<Object>} User data
 */
export async function signUp(email, password, displayName) {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, {
      displayName: displayName
    });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      photoURL: user.photoURL || null,
      streak: 0,
      points: 0,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });

    console.log('User signed up successfully:', user.uid);

    return {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      photoURL: user.photoURL
    };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

/**
 * Sign in an existing user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} User data
 */
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login time
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      lastLoginAt: serverTimestamp()
    }, { merge: true });

    console.log('User signed in successfully:', user.uid);

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export async function logOut() {
  try {
    await signOut(auth);
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Send password reset email
 * @param {string} email - User's email
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}

/**
 * Get current user's Firestore data
 * @param {string} uid - User ID
 * @returns {Promise<Object>} User data from Firestore
 */
export async function getUserData(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));

    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.warn('User document not found:', uid);
      return null;
    }
  } catch (error) {
    console.error('Get user data error:', error);
    throw error;
  }
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Function to call with user data
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in
      const userData = await getUserData(user.uid);
      callback({
        ...user,
        ...userData
      });
    } else {
      // User is signed out
      callback(null);
    }
  });
}

/**
 * Sign in with Google
 * @returns {Promise<Object>} User data
 */
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user document exists, create if not
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // First time sign-in, create user document
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL || null,
        streak: 0,
        points: 0,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });
    } else {
      // Update last login time
      await setDoc(userDocRef, {
        lastLoginAt: serverTimestamp()
      }, { merge: true });
    }

    console.log('User signed in with Google:', user.uid);

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

/**
 * Sign in with Apple
 * @returns {Promise<Object>} User data
 */
export async function signInWithApple() {
  try {
    const provider = new OAuthProvider('apple.com');
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user document exists, create if not
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // First time sign-in, create user document
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Apple User',
        photoURL: user.photoURL || null,
        streak: 0,
        points: 0,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });
    } else {
      // Update last login time
      await setDoc(userDocRef, {
        lastLoginAt: serverTimestamp()
      }, { merge: true });
    }

    console.log('User signed in with Apple:', user.uid);

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
  } catch (error) {
    console.error('Apple sign-in error:', error);
    throw error;
  }
}

/**
 * Get auth error message in user-friendly format
 * @param {Error} error - Firebase auth error
 * @returns {string} User-friendly error message
 */
export function getAuthErrorMessage(error) {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
}
