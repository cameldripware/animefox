import { supabase } from './supabase';

export async function registerUser(email: string, password: string, username: string, extraData?: any) {
  const { data: existingUser } = await supabase.from('profiles').select('username').eq('username', username).single();
  if (existingUser) throw new Error('Bu kullanici adi zaten alinmis.');

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email, password,
    options: { data: { username, ...extraData } }
  });
  if (authError) {
    if (authError.message?.includes('already registered')) throw new Error('Bu e-posta adresi zaten kayitli.');
    throw authError;
  }

  if (authData.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id, username, email, ...extraData,
    });
    if (profileError) {
      if (profileError.message?.includes('foreign key')) {
        const { error: retryError } = await supabase.from('profiles').insert({
          id: authData.user.id, username, email, ...extraData,
        });
        if (retryError) throw retryError;
      } else throw profileError;
    }
  }

  if (authData.session?.access_token) localStorage.setItem('animefox-token', authData.session.access_token);
  return authData;
}

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.session?.access_token) localStorage.setItem('animefox-token', data.session.access_token);
  return data;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function logoutUser() {
  await supabase.auth.signOut();
}

// Yeni: Dosya yükleme
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const { data, error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
  return publicUrl;
}

export async function uploadBanner(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const { data, error } = await supabase.storage.from('banners').upload(fileName, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName);
  return publicUrl;
}