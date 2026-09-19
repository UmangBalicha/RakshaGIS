// Supabase Edge Function: send-notification
// Deploy with: supabase functions deploy send-notification
// Call it from a DB webhook (on disaster_reports insert) or from the client
// after filing a critical report. Uses the Web Push API / SMTP of your
// choice — swap the fetch() body for your SMS/email provider
// (e.g. MSG91 for India SMS, or any SMTP relay for email).
//
// Required secrets: supabase functions secrets set ALERT_WEBHOOK_URL=...
// Corps public web-push helper (optional)
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  try {
    const { record } = (await req.json()) as {
      record: {
        id: string;
        severity: string;
        disaster_type: string;
        address: string;
        latitude: number;
        longitude: number;
      };
    };
    if (!record?.id) return new Response('Missing record', { status: 400 });

    // Only page humans for high/critical — everything else stays in-app.
    if (record.severity !== 'critical' && record.severity !== 'high') {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const webhook = Deno.env.get('ALERT_WEBHOOK_URL');
    if (webhook) {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text:
            `RakshaGIS ${record.severity.toUpperCase()} alert — ${record.disaster_type} incident at ${record.address} ` +
            `(https://maps.google.com/?q=${record.latitude},${record.longitude})`,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
