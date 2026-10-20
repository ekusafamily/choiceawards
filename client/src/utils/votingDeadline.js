import { useState, useEffect } from 'react';

// Official Voting Deadline: Tuesday, October 20, 2026 at 23:59:59 EAT (Nairobi UTC+3)
export const DEFAULT_VOTING_DEADLINE = '2026-10-20T23:59:59+03:00';

export const VOTING_DEADLINE_ISO =
  import.meta.env.VITE_VOTING_DEADLINE || DEFAULT_VOTING_DEADLINE;

/**
 * Checks whether the current time is past the voting deadline.
 * Returns boolean.
 */
export function isVotingClosed() {
  const deadline = new Date(VOTING_DEADLINE_ISO).getTime();
  if (isNaN(deadline)) return false;
  return Date.now() >= deadline;
}

/**
 * React hook that returns { isVotingClosed, deadline, formattedDeadline }.
 * Automatically triggers state change at the exact moment of midnight without requiring page reload.
 */
export function useVotingStatus() {
  const [closed, setClosed] = useState(() => isVotingClosed());

  useEffect(() => {
    if (closed) return;

    const deadline = new Date(VOTING_DEADLINE_ISO).getTime();
    const remainingMs = deadline - Date.now();

    let timeoutId;
    // Set a precision timer for the exact cutoff millisecond
    if (remainingMs > 0 && remainingMs < 0x7FFFFFFF) {
      timeoutId = setTimeout(() => {
        setClosed(true);
      }, remainingMs);
    }

    // Interval heartbeat to guarantee state synchrony even if device sleeps
    const intervalId = setInterval(() => {
      if (isVotingClosed()) {
        setClosed(true);
        clearInterval(intervalId);
      }
    }, 1000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [closed]);

  return {
    isVotingClosed: closed,
    deadline: VOTING_DEADLINE_ISO,
  };
}
