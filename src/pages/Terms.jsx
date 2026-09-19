import { Link } from 'react-router-dom';
import { CONTACT_EMAIL } from '../lib/site';
import { Card, CardContent } from '../components/ui';

function Section({ title, children }) {
  return (
    <section className="mt-6 first:mt-0">
      <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold text-slate-900">Terms & Conditions</h1>
      <p className="mt-1 text-sm text-slate-500">
        The ground rules for using the RakshaGIS disaster reporting platform.
      </p>

      <Card className="mt-4">
        <CardContent>
          <Section title="What this service is">
            <p>
              RakshaGIS is a public incident-reporting and evacuation-guidance tool.
              It relays citizen reports to authority staff and suggests evacuation
              routes — it is not a replacement for official emergency services.
            </p>
          </Section>

          <Section title="In an emergency, call first">
            <p>
              If anyone is in immediate danger, call <strong>112</strong> (national
              emergency), <strong>101</strong> (fire), <strong>108</strong> (ambulance)
              or <strong>1077</strong> (disaster management) before or alongside
              filing a report here.
            </p>
          </Section>

          <Section title="Report honestly">
            <p>
              File reports only for real incidents you have seen or verified. False
              or prank reports waste responder time and may be marked as false
              alarms by authority staff. Do not upload photos of other people without
              a legitimate reporting purpose.
            </p>
          </Section>

          <Section title="Routes are guidance, not guarantees">
            <p>
              Evacuation routes are computed from map data that can be outdated,
              and some routes are straight-line estimates when live road data is
              unavailable. Always follow police, fire and local volunteer
              instructions on the ground over anything shown here.
            </p>
          </Section>

          <Section title="Accounts and demo data">
            <p>
              You are responsible for keeping your account credentials safe.
              Authority accounts are issued by administrators. In demo mode, all
              data lives in your browser and can be reset or cleared at any time;
              demo content carries no official standing.
            </p>
          </Section>

          <Section title="Availability">
            <p>
              We aim to keep the service reachable at all times, especially during
              disasters, but cannot guarantee uninterrupted availability. Map,
              geocoding and routing features depend on third-party providers.
            </p>
          </Section>

          {CONTACT_EMAIL ? (
            <Section title="Contact">
              <p>
                Questions about these terms:{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-brand-600 underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </Section>
          ) : null}
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-sm">
        <Link to="/" className="inline-flex min-h-[44px] items-center font-bold text-brand-600 hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
