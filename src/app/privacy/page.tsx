import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

// Required by Google's OAuth consent screen: an app that asks for sign-in has to
// publish a reachable privacy policy, and brand verification will not pass without
// one. The copy below describes what the code actually does, so it has to be kept
// honest if the data handling changes.
const LAST_UPDATED = "September 19, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteConfig.name} handles your information when you sign in with Google, chat with us, or enrol in a program.`,
  // The root layout's canonical of "/" would otherwise be inherited here.
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `Privacy Policy | ${siteConfig.name}`,
    description: `How ${siteConfig.name} handles your information.`,
    url: `${siteConfig.url}/privacy`,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Privacy Policy | ${siteConfig.name}`,
    description: `How ${siteConfig.name} handles your information.`,
    images: [`${siteConfig.url}/og-image.png`],
  },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white">
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-sm sm:text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#0d0d0d]">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24 flex flex-col gap-10">
        <header className="flex flex-col gap-3">
          <Link
            href="/"
            className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors w-fit"
          >
            ← Back to {siteConfig.name}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-sm text-neutral-500">Last updated {LAST_UPDATED}</p>
        </header>

        <Section title="Who we are">
          <p>
            {siteConfig.name} runs this website and the admissions chat on it. We are based in
            Pune, India. You can reach us about anything on this page at{" "}
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="font-medium text-neutral-900 dark:text-white underline underline-offset-2"
            >
              {siteConfig.contact.email}
            </a>
            .
          </p>
        </Section>

        <Section title="What we collect">
          <p>
            <strong className="font-semibold text-neutral-900 dark:text-white">
              When you sign in with Google.
            </strong>{" "}
            Google tells us your name, your email address and your profile picture. We do not
            receive your Google password, and we cannot read your email or any other Google
            data. Signing in is optional: you can read about our programs and use the chat
            without an account.
          </p>
          <p>
            <strong className="font-semibold text-neutral-900 dark:text-white">
              When you have an account.
            </strong>{" "}
            We keep a record for you that holds your name, email address, profile picture,
            whether you are a student or an administrator, and the last time you signed in. If
            you enrol in a program, we attach your enrolment and assignment records to it.
          </p>
          <p>
            <strong className="font-semibold text-neutral-900 dark:text-white">
              In your browser.
            </strong>{" "}
            We store a small record of your signed-in session and your preference for which
            language the site replies in. These sit on your own device and you can clear them
            from your browser at any time; clearing them signs you out.
          </p>
        </Section>

        <Section title="How we use it">
          <p>
            To sign you in, to keep your enrolment and assignments in one place, to let our
            team answer your enquiries, and to run the admissions chat. That is the whole list.
          </p>
        </Section>

        <Section title="What we do not do">
          <p>
            We do not sell your information, and we do not rent it to anyone. We do not run
            advertising or behavioural tracking on this site, and we do not build a profile of
            you to target ads elsewhere.
          </p>
        </Section>

        <Section title="Who else handles it">
          <p>
            Two providers process your information on our behalf, and only so the site can
            work:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-2">
            <li>
              <strong className="font-semibold text-neutral-900 dark:text-white">Google</strong>{" "}
              provides the sign-in and the database that stores your account record (Firebase
              Authentication and Cloud Firestore).
            </li>
            <li>
              <strong className="font-semibold text-neutral-900 dark:text-white">Netlify</strong>{" "}
              hosts the website.
            </li>
          </ul>
          <p>
            We do not share your information with anyone else unless the law requires it.
          </p>
        </Section>

        <Section title="Keeping it, and deleting it">
          <p>
            We keep your account record for as long as you have an account, and enrolment
            records for as long as we need them for admissions and accounting. Email us at{" "}
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="font-medium text-neutral-900 dark:text-white underline underline-offset-2"
            >
              {siteConfig.contact.email}
            </a>{" "}
            and we will show you what we hold about you or delete your account and its records.
            We will action a deletion request within 30 days.
          </p>
        </Section>

        <Section title="If you are under 18">
          <p>
            This site is meant for students old enough to be considering a course. If you are
            under 18, please use it with a parent or guardian, and have them contact us on your
            behalf rather than creating an account yourself.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we start handling your information differently, we will update this page and
            change the date at the top of it.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions, corrections or requests about your information go to{" "}
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="font-medium text-neutral-900 dark:text-white underline underline-offset-2"
            >
              {siteConfig.contact.email}
            </a>{" "}
            or {siteConfig.contact.phone}.
          </p>
        </Section>
      </div>
    </main>
  );
}
