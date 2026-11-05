import { useEffect } from 'react';
import { SiteShell } from '@/components/layout/SiteShell';

// Plain-language privacy policy. Extension stores require one, and it has to
// match what the code actually does — update both together.
const sections: { h: string; p: string[] }[] = [
  {
    h: 'The short version',
    p: [
      'Cook’s Diff has no accounts, no sign-up and no advertising trackers. We don’t sell or share personal data.',
    ],
  },
  {
    h: 'What the website stores',
    p: [
      'When you paste a recipe link, we fetch that recipe and its public reviews, analyze the changes cooks describe, and save the result so anyone can revisit it later. What we save is about the recipe, not about you.',
      'We use Vercel Web Analytics to count page views. It doesn’t use cookies and doesn’t identify individual visitors.',
      'Our servers keep short-lived technical logs (such as IP addresses and request times) to keep the service running and to prevent abuse, including a limit on how many new recipes one visitor can analyze per hour. These logs are not used for anything else.',
    ],
  },
  {
    h: 'What the browser extension does',
    p: [
      'The extension only runs on recipe pages of supported sites. When such a page opens, it sends that page’s address to our server to check whether the recipe was analyzed before, so it can show the number of tweaks.',
      'A new analysis only starts when you click the Cook’s Diff button. The extension doesn’t read your browsing history, doesn’t run on other pages, doesn’t collect what you type, and doesn’t access cookies or accounts on the recipe site.',
      'The extension has no permissions beyond talking to our own server.',
    ],
  },
  {
    h: 'Third parties',
    p: [
      'Recipe text and reviews are processed by Google’s Gemini API to find the changes cooks describe. No information about you is sent along.',
      'The website is hosted on Vercel and fonts are loaded from Google Fonts.',
    ],
  },
  {
    h: 'Questions',
    p: ['Questions about privacy or a request about your data: contact us through the email listed on the extension’s store page.'],
  },
];

export function PrivacyPage() {
  useEffect(() => {
    document.title = "Privacy policy | Cook's Diff";
  }, []);

  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-900">Privacy policy</h1>
        <p className="mt-2 text-sm text-ink-500">Last updated: November 5, 2026</p>
        {sections.map((s) => (
          <section key={s.h} className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-ink-900">{s.h}</h2>
            {s.p.map((para) => (
              <p key={para.slice(0, 40)} className="mt-3 leading-relaxed text-ink-600">
                {para}
              </p>
            ))}
          </section>
        ))}
      </article>
    </SiteShell>
  );
}
