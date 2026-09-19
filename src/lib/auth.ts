/* Unified auth: Supabase Auth when configured, demo-mode mock otherwise. */
import { isSupabaseEnabled, supabase } from './supabase';
import { isDemoMode } from './api';
import {
  mockGetSessionProfile,
  mockSendOtp,
  mockSignIn,
  mockSignOut,
  mockSignUp,
  mockVerifyOtp,
} from './mock';
import type { Profile } from './types';

export async function getSessionProfile(): Promise<Profile | null> {
  if (isDemoMode || !supabase) return mockGetSessionProfile();
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return null;
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle();
  if (error || !profile) return null;
  return profile as Profile;
}

export async function signUp(input: {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<Profile> {
  if (isDemoMode || !supabase) return mockSignUp(input);
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: { data: { full_name: input.full_name.trim(), phone: input.phone?.trim() || null } },
  });
  if (error) throw error;
  const uid = data.user?.id;
  if (!uid) throw new Error('Could not create account. Please try again.');
  // Profile row is created by the handle_new_user() trigger in schema.sql.
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle();
  if (pErr || !profile) throw new Error('Account created but profile is missing. Please sign in.');
  return profile as Profile;
}

export async function signIn(email: string, password: string): Promise<Profile> {
  if (isDemoMode || !supabase) return mockSignIn(email, password);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  const uid = data.user.id;
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle();
  if (pErr || !profile) throw new Error('Signed in, but profile record is missing.');
  return profile as Profile;
}

export async function sendPhoneOtp(phone: string): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return mockSendOtp(phone);
  const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
  if (error) throw error;
}

export async function verifyPhoneOtp(input: {
  phone: string;
  code: string;
  full_name?: string;
}): Promise<Profile> {
  if (!isSupabaseEnabled || !supabase) return mockVerifyOtp(input);
  const { data, error } = await supabase.auth.verifyOtp({
    phone: input.phone.trim(),
    token: input.code.trim(),
    type: 'sms',
  });
  if (error) throw error;
  const uid = data.user?.id;
  if (!uid) throw new Error('OTP verification failed.');
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle();
  if (pErr || !profile) {
    // First-time phone user: create the profile row.
    const fullName = input.full_name?.trim() || 'Citizen Reporter';
    const { data: created, error: cErr } = await supabase
      .from('profiles')
      .insert({ id: uid, full_name: fullName, phone: input.phone.trim(), role: 'public' })
      .select('*')
      .single();
    if (cErr || !created) throw new Error('Verified, but profile record is missing.');
    return created as Profile;
  }
  return profile as Profile;
}

export async function signOut(): Promise<void> {
  if (isDemoMode || !supabase) return mockSignOut();
  await supabase.auth.signOut();
}
