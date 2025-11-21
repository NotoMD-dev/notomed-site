// src/app/privacy/page.tsx
import type { Metadata } from "next";
import { defaultMetadata } from "@/lib/seo";
import Link from "next/link";

export const metadata: Metadata = {
  ...defaultMetadata,
  title: "Patient Privacy & PHI De-Identification Policy | NotoMed.dev",
  description:
    "Learn how NotoMed.dev's Note Summarizer handles patient privacy, PHI de-identification, and data flows.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 pb-12 pt-10">
      {/* Back button — swap for your shared BackButton if you have one */}
      {/* <BackButton href="/" label="Back to home" /> */}

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Patient Privacy &amp; PHI De-Identification Policy
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          This page explains how the NotoMed.dev Note Summarizer handles data,
          how PHI is scrubbed, and why this workflow is designed so that
          protected health information (PHI) is not stored, logged, or sent to
          third-party APIs.
        </p>
      </header>

      <section className="space-y-8 text-sm md:text-base leading-relaxed text-zinc-900 dark:text-zinc-50">
        {/* Intro */}
        <div className="space-y-3">
          <p>
            Patient privacy is the core priority of this web application.
            NotoMed.dev&apos;s Note Summarizer performs all patient health
            information (PHI) removal directly in your browser, ensuring that no
            identifiable patient information is ever stored, logged, or
            transmitted to any server or third-party API.
          </p>
          <p>
            This document explains how the tool handles data, how PHI is
            scrubbed, and why this workflow does not require HIPAA compliance.
          </p>
        </div>

        {/* Executive summary */}
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl font-semibold">
            Executive Summary (what you should know upfront)
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>All PHI scrubbing happens client-side, in your browser.</li>
            <li>Only a de-identified version of your text is ever sent to the model.</li>
            <li>
              No patient information is stored, logged, retained, or used for
              training.
            </li>
            <li>
              You remain in control of all data — nothing leaves your device
              until it has been scrubbed.
            </li>
          </ul>
        </div>

        {/* Data this app accepts */}
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl font-semibold">
            Data This App Accepts
          </h2>
          <p>
            The Note Summarizer accepts de-identified clinical notes,
            histories, physical exams, or narrative text for summarization. No
            patient identifiers are required for the tool to function, and users
            are encouraged to avoid including identifiable information whenever
            possible.
          </p>
          <p>
            However, if PHI is accidentally included, the tool removes it before
            any processing occurs.
          </p>
        </div>

        {/* PHI scrubbing */}
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl font-semibold">
            PHI Scrubbing and Handling of Sensitive Information
          </h2>
          <p>
            Before any text is sent to the model, the tool applies an internal
            PHI-scrubbing layer that identifies and removes common patient
            identifiers, including but not limited to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Patient names</li>
            <li>Dates of birth</li>
            <li>Medical record numbers</li>
            <li>Contact information</li>
            <li>Addresses</li>
            <li>Insurance or account numbers</li>
          </ul>
          <p>
            Provider names are generally not considered patient identifiers
            under HIPAA and can safely remain in place without increasing patient
            risk.
          </p>
        </div>

        {/* How scrubbing works */}
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl font-semibold">
            How Scrubbing Works
          </h2>
          <p>
            The scrubber uses a hybrid regex and machine-learning system to
            detect and redact PHI, replacing it with neutral placeholders such
            as:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>&quot;the patient&quot;</li>
            <li>&quot;relative&quot;</li>
            <li>and other similar generic terms</li>
          </ul>
        </div>

        {/* Where scrubbing occurs */}
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl font-semibold">
            Where Scrubbing Occurs
          </h2>
          <p>
            All PHI removal happens in the user&apos;s browser. The original
            note never leaves your device in identifiable form.
          </p>
        </div>

        {/* User-side encouraged de-identification */}
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl font-semibold">
            User-Side Encouraged De-Identification
          </h2>
          <p>
            Although the scrubber performs exhaustive client-side redaction of
            sensitive information, users are strongly encouraged to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Avoid typing or pasting explicit identifiers.</li>
            <li>Remove names or MRNs before submitting.</li>
            <li>Upload only de-identified documents whenever possible.</li>
          </ul>
          <p>
            Uploaded files are scrubbed in the browser before processing. The
            app can still handle accidentally copied PHI, but minimizing it adds
            an extra layer of protection.
          </p>
        </div>

        {/* Client-side scrubbing definition */}
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl font-semibold">
            What Does &quot;Client/User-Side Scrubbing&quot; Mean?
          </h2>
          <p>In this context, &quot;client-side&quot; means that:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>No PHI is transmitted over the internet.</li>
            <li>No server receives identifiable information.</li>
            <li>
              Only the cleaned, de-identified text is sent to the model for
              summarization.
            </li>
            <li>
              The original text is never stored, saved, logged, or cached by the
              application.
            </li>
          </ul>
          <p>
            This design ensures you remain the sole owner of the original
            content.
          </p>
        </div>

        {/* LLM used */}
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl font-semibold">
            Which Language Model Does This Tool Use?
          </h2>
          <p>
            This application uses OpenAI&apos;s GPT-5.1 for summarization and
            structured output. Only de-identified text is sent to the model. No
            PHI-containing content is ever transmitted to OpenAI or any other
            third-party API.
          </p>
        </div>

        {/* App workflow */}
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl font-semibold">App Workflow</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>You paste or upload note(s).</li>
            <li>
              In your browser, that data is scrubbed of all PHI using the
              client-side redaction layer.
            </li>
            <li>
              A cleaned version of each note is generated and then sent to the
              language model to enable summarization and structured output.
            </li>
            <li>
              You interact with the cleaned data and structured output within
              the application.
            </li>
          </ol>
          <p>
            At the close of each session, all data is discarded. The app does
            not retain the input notes or generated summaries.
          </p>
        </div>

        {/* What this tool does NOT do */}
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl font-semibold">
            What This Tool Does Not Do
          </h2>
          <p>This app does not:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Store or save any user input.</li>
            <li>Log or track patient information.</li>
            <li>Send PHI to OpenAI.</li>
            <li>Retain summaries or cleaned text.</li>
            <li>Use your content for training.</li>
            <li>Create user profiles based on note content.</li>
            <li>Forward data to any third-party service.</li>
          </ul>
          <p>Your data is processed once and then discarded.</p>
        </div>

        {/* HIPAA section */}
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl font-semibold">
            Does This App Need to Be HIPAA Compliant?
          </h2>
          <p>
            HIPAA compliance is required when PHI is stored, transmitted, or
            used by a covered entity or business associate. Because the Note
            Summarizer:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Scrubs PHI before transmission.</li>
            <li>Never stores or forwards identifiable data.</li>
            <li>Only processes de-identified text.</li>
          </ul>
          <p>
            …it is designed so that the data handled by the model no longer
            meets HIPAA&apos;s definition of PHI.
          </p>
          <p>
            You may reasonably ask: &quot;But I&apos;m still copying patient
            notes… how does that not make HIPAA relevant?&quot; The key point is
            that HIPAA only applies to protected health information (PHI).
            Because identifiers are removed before any data leaves your device,
            the text transmitted to the model is no longer considered PHI under
            HIPAA definitions.
          </p>
        </div>

        {/* Questions / concerns */}
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl font-semibold">
            Questions or Concerns?
          </h2>
          <p>
            If you have privacy concerns, suggestions, or feedback, please
            contact me using the feedback form on{" "}
            <Link href="/" className="underline underline-offset-4">
              NotoMed.dev
            </Link>
            , and involve your institution&apos;s compliance and legal teams for
            organization-specific guidance.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="space-y-2 border-t border-zinc-200/60 pt-4 dark:border-zinc-700/80">
          <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-300">
            <span className="font-semibold">Disclaimer:</span> This document
            describes how the tool handles data and de-identification but does
            not constitute legal advice. Users are responsible for ensuring
            compliance with their own organization&apos;s privacy regulations and
            applicable laws.
          </p>
        </div>
      </section>
    </main>
  );
}
