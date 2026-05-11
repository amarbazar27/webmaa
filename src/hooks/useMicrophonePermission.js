'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * A robust, production-safe hook for managing microphone permissions.
 * Handles SSR safety, explicit state tracking, secure contexts, and stream cleanup.
 */
export default function useMicrophonePermission() {
  const [permissionState, setPermissionState] = useState('loading'); // loading, granted, denied, prompt, unsupported, requesting
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  // SSR Safe initialization check
  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      setPermissionState('loading');
      return;
    }

    if (!window.isSecureContext) {
      setPermissionState('unsupported');
      setError('Secure context (HTTPS) is required for microphone access.');
      console.warn('[Mic] Non-secure context detected.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionState('unsupported');
      setError('Microphone is not supported in this browser.');
      console.warn('[Mic] mediaDevices.getUserMedia not supported.');
      return;
    }

    // Attempt to query existing permission silently without triggering prompt
    let isMounted = true;
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' }).then((status) => {
        if (!isMounted) return;
        setPermissionState(status.state); // granted, denied, or prompt
        console.log(`[Mic] Initial permission state: ${status.state}`);

        // Listen for changes
        status.onchange = () => {
          if (isMounted) {
            console.log(`[Mic] Permission state changed to: ${status.state}`);
            setPermissionState(status.state);
          }
        };
      }).catch((err) => {
        // Some older browsers (or specific mobile variants) might throw when querying 'microphone'
        console.warn('[Mic] Permissions API query failed, falling back to prompt state.', err);
        if (isMounted) setPermissionState('prompt');
      });
    } else {
      // Fallback if Permissions API is not fully supported (Safari/iOS sometimes)
      setPermissionState('prompt');
    }

    return () => {
      isMounted = false;
      stopMicrophone(); // Clean up stream if unmounted
    };
  }, []);

  const stopMicrophone = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`[Mic] Track ${track.kind} stopped.`);
      });
      streamRef.current = null;
    }
  }, []);

  const requestMicrophone = useCallback(async () => {
    console.log('[Mic] Requesting microphone access...');
    setPermissionState('requesting');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      
      console.log('[Mic] Access granted successfully.');
      
      // Immediately stop the stream so that Web Speech API (or other systems) can use the mic.
      // Permission is granted at the origin level, so we don't need to hold the stream.
      stream.getTracks().forEach(track => track.stop());
      streamRef.current = null;

      setPermissionState('granted');
      return true;
    } catch (err) {
      console.error('[Mic] getUserMedia Error:', err.name, err.message);
      setPermissionState('denied');
      
      if (err.name === 'NotAllowedError') {
         setError('Microphone permission denied by user or device settings.');
      } else if (err.name === 'NotFoundError') {
         setError('No microphone found on this device.');
      } else {
         setError(`Microphone error: ${err.message}`);
      }
      return false;
    }
  }, []);

  return {
    permissionState, // 'loading' | 'unsupported' | 'prompt' | 'requesting' | 'granted' | 'denied'
    error,
    requestMicrophone,
    stopMicrophone,
    isSupported: permissionState !== 'unsupported' && permissionState !== 'loading',
  };
}
