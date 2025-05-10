
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../services/supabase';
import { logUserAction } from '../../../services/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method for login
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Get user role from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User data not found' });
    }

    // Log successful login
    await logUserAction(
      data.user.id,
      'login',
      { email: data.user.email }
    );

    // Return user data and session
    return res.status(200).json({
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
