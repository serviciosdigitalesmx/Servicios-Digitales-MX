import { supabase } from './supabase';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'suspended' | 'cancelled';

export interface Subscription {
  status: SubscriptionStatus;
  current_period_end: string;
  grace_until?: string;
}

/**
 * Checks if a subscription is considered "Valid" for operational access.
 * Includes active, trialing, and past_due (if within grace period).
 */
export function isAccessGranted(sub: Subscription | null): boolean {
  if (!sub) return false;

  const now = new Date();
  const periodEnd = new Date(sub.current_period_end);
  const graceEnd = sub.grace_until ? new Date(sub.grace_until) : periodEnd;

  if (sub.status === 'active' || sub.status === 'trialing') {
    return true;
  }

  if (sub.status === 'past_due') {
    // Grant access if we're still within the grace period (Corte logic)
    return now <= graceEnd;
  }

  return false;
}

/**
 * Returns a human-readable message for the "Corte" banner.
 */
export function getSubscriptionAlert(sub: Subscription | null): string | null {
  if (!sub) return "No se encontró una suscripción activa.";

  if (sub.status === 'past_due') {
    return "⚠️ Tu pago está pendiente. Tienes un periodo de gracia para regularizarte.";
  }

  if (sub.status === 'suspended') {
    return "🚫 Servicio suspendido por falta de pago.";
  }

  return null;
}
