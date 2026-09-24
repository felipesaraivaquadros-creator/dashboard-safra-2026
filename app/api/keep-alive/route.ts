import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const KEEP_ALIVE_TABLES = ['romaneios', 'safras', 'fazendas'] as const;
const FALLBACK_SUPABASE_URL = 'https://pohcuxyzdfctfpppnvxa.supabase.co';
const FALLBACK_SUPABASE_PUBLIC_KEY = 'sb_publishable_Ri-BgZC1slzklWIYddhvkw_hQVXNxOB';

function isAuthorized(request: Request) {
  if (process.env.NODE_ENV === 'development') return true;

  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  if (cronSecret) {
    return authorization === `Bearer ${cronSecret}`;
  }

  const userAgent = request.headers.get('user-agent') || '';
  return process.env.VERCEL === '1' && userAgent.includes('vercel-cron/1.0');
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    FALLBACK_SUPABASE_PUBLIC_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const results = await Promise.all(
    KEEP_ALIVE_TABLES.map(async (table) => {
      const { error } = await supabase.from(table).select('id').limit(1);
      return { table, error };
    }),
  );

  const failures = results.filter((result) => result.error);

  if (failures.length > 0) {
    console.error(
      'Supabase keep-alive failed',
      failures.map(({ table, error }) => ({ table, message: error?.message })),
    );

    return Response.json(
      {
        ok: false,
        error: 'Supabase keep-alive query failed',
        checkedAt: new Date().toISOString(),
      },
      { status: 502 },
    );
  }

  return Response.json(
    {
      ok: true,
      checks: results.length,
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
