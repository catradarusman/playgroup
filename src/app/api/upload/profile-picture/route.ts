import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BUCKET = 'profile-pictures';

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase storage not configured');
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const ext = file.type.split('/')[1];
    const path = `${userId}/avatar.${ext}`; // deterministic — overwrites previous upload
    const arrayBuffer = await file.arrayBuffer();

    const supabase = getSupabaseAdmin();
    let { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

    // If the bucket doesn't exist yet, create it (public) and retry once
    if (error?.message?.toLowerCase().includes('not found') || error?.message?.toLowerCase().includes('does not exist')) {
      const { error: bucketError } = await supabase.storage.createBucket(BUCKET, { public: true });
      if (bucketError && !bucketError.message?.toLowerCase().includes('already exists')) {
        console.error('Supabase bucket creation error:', bucketError);
        return NextResponse.json({ error: `Bucket creation failed: ${bucketError.message}` }, { status: 500 });
      }
      const retry = await supabase.storage
        .from(BUCKET)
        .upload(path, arrayBuffer, { contentType: file.type, upsert: true });
      error = retry.error;
    }

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
    // Cache-bust so browser reloads the new image after update
    return NextResponse.json({ url: `${publicUrl}?t=${Date.now()}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Profile picture upload error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
