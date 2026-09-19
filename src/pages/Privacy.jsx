import { Link } from 'react-router-dom';
import { CONTACT_EMAIL } from '../lib/site';
import { Card, CardContent } from '../components/ui';

function Section({ title, children }) {
  return (
    <section className="mt-6">
      <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold text-slate-900">Privacy Policy</h1>
      <p className="mt-1 text-sm text-slate-500">
        Last updated for the current release of RakshaGIS. This policy describes only
        what the app actually does — nothing more.
      </p>

      <Card className="mt-4">
        <CardContent>
          <Section title="Reports you file">
            <p>
              When you submit an incident report we store the location pin, disaster
              type, description, injury information and any photos you attach, along
              with the report's status history. Reports are visible to authority staff
              for triage and to the public on the live map and tracking pages.
            </p>
            <p>
              You can report as a guest without an account. If you sign in, your name
              is attached as the reporter; guests are listed as anonymous.
            </p>
          </Section>

          <Section title="Where your data lives">
            <p>
              <strong>Demo mode</strong> (no backend configured): everything is stored
              in your own browser's local storage on your device. Nothing is sent to
              our servers, because there are none — and clearing your browser data
              removes it.
            </p>
            <p>
              <strong>Connected mode</strong> (Supabase configured): reports, photos
              and account data are stored in the connected Supabase project, and your
              sign-in session is kept in your browser so you stay logged in.
            </p>
          </Section>

          <Section title="Location">
            <p>
              Your GPS position is used only when you ask for it — centering the map,
              placing a report pin, or computing evacuation routes. It is never
              tracked in the background and never stored except as part of a report
              you choose to submit.
            </p>
          </Section>

          <Section title="Third-party services">
            <p>To function, the app contacts these outside services:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Map tiles (OpenStreetMap, or MapmyIndia when configured) to draw the map.</li>
              <li>OpenStreetMap Nominatim to turn map pins into readable addresses.</li>
              <li>OSRM public routing to compute evacuation road routes.</li>
              <li>Google Maps — only when you tap a navigation button.</li>
            </ul>
            <p>
              These providers receive the technical data needed for the request
              (such as coordinates). We do not sell or share your data with anyone
              else.
            </p>
          </Section>

          <Section title="Cookies and analytics">
            <p>
              RakshaGIS sets no cookies of its own. Analytics is off by default and
              only activates if the site operator configures an analytics ID, in
              which case page views are recorded without advertising profiles.
            </p>
          </Section>

          {CONTACT_EMAIL ? (
            <Section title="Contact">
              <p>
                For data questions or removal requests, contact{' '}
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
