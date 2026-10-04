import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "./config";

/**
 * Synchronize Firebase User profile into Firestore users collection
 */
export async function syncUserToFirestore(user: User, additionalData?: { fullName?: string; role?: string }) {
  if (!user) return null;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  const userData = {
    id: user.uid,
    email: user.email || "",
    fullName: additionalData?.fullName || user.displayName || user.email?.split("@")[0] || "Kollab Member",
    avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || user.email || user.uid}`,
    phoneNumber: user.phoneNumber || "",
    role: additionalData?.role || "Team Member",
    updatedAt: serverTimestamp(),
  };

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
    });
  } else {
    await setDoc(userRef, userData, { merge: true });
  }

  // Also sync session with local backend session cookie/storage
  try {
    const idToken = await user.getIdToken();
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.uid,
        email: user.email,
        name: userData.fullName,
        avatar: userData.avatarUrl,
        idToken,
      }),
    });
  } catch (err) {
    console.warn("Local session sync skipped:", err);
  }

  return userData;
}

/**
 * Sign up with Email and Password
 */
export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (fullName) {
    await updateProfile(userCredential.user, { displayName: fullName });
  }
  await syncUserToFirestore(userCredential.user, { fullName });
  return userCredential.user;
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await syncUserToFirestore(userCredential.user);
  return userCredential.user;
}

/**
 * Sign in with Google (Popup)
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  await syncUserToFirestore(result.user);
  return result.user;
}

/**
 * Set up reCAPTCHA verifier for Phone Authentication
 */
export function setUpRecaptcha(containerId: string): RecaptchaVerifier {
  // Clear any existing verifier
  if (typeof window !== "undefined") {
    const w = window as any;
    if (w.recaptchaVerifier) {
      try {
        w.recaptchaVerifier.clear();
      } catch (e) {
        // ignore
      }
    }

    w.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      },
      "expired-callback": () => {
        console.warn("reCAPTCHA expired. Please try again.");
      },
    });

    return w.recaptchaVerifier;
  }
  throw new Error("Window is undefined");
}

/**
 * Send Phone Authentication SMS OTP
 */
export async function sendPhoneOtp(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  return confirmationResult;
}

/**
 * Confirm Phone OTP Code
 */
export async function confirmPhoneOtp(confirmationResult: ConfirmationResult, verificationCode: string) {
  const result = await confirmationResult.confirm(verificationCode);
  await syncUserToFirestore(result.user);
  return result.user;
}

/**
 * Sign out from Firebase Auth
 */
export async function signOutUser() {
  await signOut(auth);
  try {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signout" }),
    });
  } catch (err) {
    console.warn("Signout session sync failed:", err);
  }
}

/**
 * Subscribe to Auth State Changes
 */
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
