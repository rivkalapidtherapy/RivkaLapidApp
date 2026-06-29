import { supabase } from '../lib/supabase';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';


export const getGoogleOAuthUrl = (redirectUri: string): string => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email email',
    access_type: 'offline',
    prompt: 'consent'
  });
  return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
};

export const getConnectedAdminEmail = async (): Promise<string | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('google_credentials')
    .select('user_email')
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data.user_email;
};

export const isGoogleCalendarConnected = async (): Promise<boolean> => {
  const email = await getConnectedAdminEmail();
  return !!email;
};

export const exchangeCodeForTokens = async (code: string, redirectUri: string): Promise<string | null> => {
  try {
    // 1. Exchange authorization code for tokens
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Token exchange failed:", errorText);
      return null;
    }
    
    const data = await res.json();
    const { access_token, refresh_token, expires_in } = data;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
    
    // 2. Fetch user email using userinfo API
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    if (!userinfoRes.ok) {
      console.error("Failed to fetch Google userinfo");
      return null;
    }
    
    const userinfo = await userinfoRes.json();
    const email = userinfo.email;
    
    if (!email) {
      console.error("Google userinfo did not return an email");
      return null;
    }
    
    // 3. Upsert credentials in Supabase
    if (supabase) {
      const { error } = await supabase
        .from('google_credentials')
        .upsert({
          user_email: email,
          access_token,
          refresh_token: refresh_token || data.refresh_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_email' });
      if (error) {
        console.error("Failed to save google credentials in DB:", error);
        return null;
      }
    }
    return email;
  } catch (err) {
    console.error("Error exchanging code:", err);
    return null;
  }
};

export const getGoogleAccessToken = async (email: string): Promise<string | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('google_credentials')
    .select('*')
    .eq('user_email', email)
    .maybeSingle();
    
  if (error || !data) return null;
  
  const now = new Date();
  const expiresAt = new Date(data.expires_at);
  
  // If token is still valid (with 5 minutes buffer)
  if (new Date(now.getTime() + 5 * 60 * 1000) < expiresAt) {
    return data.access_token;
  }
  
  // Token is expired, refresh it
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: data.refresh_token,
        grant_type: 'refresh_token'
      })
    });
    
    if (!res.ok) {
      console.error("Token refresh failed");
      return null;
    }
    
    const refreshedData = await res.json();
    const newAccessToken = refreshedData.access_token;
    const newExpiresAt = new Date(Date.now() + refreshedData.expires_in * 1000).toISOString();
    
    await supabase
      .from('google_credentials')
      .update({
        access_token: newAccessToken,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('user_email', email);
      
    return newAccessToken;
  } catch (err) {
    console.error("Error refreshing token:", err);
    return null;
  }
};

export const disconnectGoogleCalendar = async (): Promise<boolean> => {
  if (!supabase) return false;
  const email = await getConnectedAdminEmail();
  if (!email) return false;
  
  const { error } = await supabase
    .from('google_credentials')
    .delete()
    .eq('user_email', email);
  return !error;
};

export const syncAppointmentToGoogleCalendar = async (appointment: any, serviceType: string): Promise<string | null> => {
  const email = await getConnectedAdminEmail();
  if (!email) return null;
  
  const token = await getGoogleAccessToken(email);
  if (!token) return null;
  
  // Format dates: Google Calendar needs ISO strings for start/end
  // appointment.date is YYYY-MM-DD
  // appointment.time is HH:MM
  const startDateTime = new Date(`${appointment.date}T${appointment.time}:00`);
  // Assume appointment is 30 minutes default if not specified
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000);
  
  const event = {
    summary: `${serviceType} - ${appointment.clientName}`,
    description: `טלפון לקוח: ${appointment.clientPhone}\nאימייל: ${appointment.clientEmail || 'לא הוזן'}\nתובנה רוחנית: ${appointment.spiritualInsight || ''}`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'Asia/Jerusalem'
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'Asia/Jerusalem'
    },
    attendees: appointment.clientEmail ? [{ email: appointment.clientEmail }] : []
  };
  
  try {
    let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    let method = 'POST';
    
    if (appointment.googleEventId) {
      url = `${url}/${appointment.googleEventId}`;
      method = 'PUT';
    }
    
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    
    if (!res.ok) {
      const errTxt = await res.text();
      console.error("Failed to sync to Google Calendar:", errTxt);
      return null;
    }
    
    const data = await res.json();
    
    // Save Google Event ID in appointments table
    if (supabase && data.id && data.id !== appointment.googleEventId) {
      await supabase
        .from('appointments')
        .update({ google_event_id: data.id })
        .eq('id', appointment.id);
    }
    
    return data.id; // Returns the google_event_id
  } catch (err) {
    console.error("Error in syncAppointmentToGoogleCalendar:", err);
    return null;
  }
};

export const deleteGoogleCalendarEvent = async (eventId: string): Promise<boolean> => {
  const email = await getConnectedAdminEmail();
  if (!email) return false;
  
  const token = await getGoogleAccessToken(email);
  if (!token) return false;
  
  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return res.ok;
  } catch (err) {
    console.error("Error in deleteGoogleCalendarEvent:", err);
    return false;
  }
};
