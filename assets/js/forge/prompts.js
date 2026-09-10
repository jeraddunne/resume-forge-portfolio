/**
 * prompts.js — the bullet doctrine.
 *
 * Mirrors the structure of Resume Forge's shared/prompts.js: the rules live in
 * named blocks so a change propagates everywhere the block is used, and the
 * prompt is built as a {system, user} pair that any provider can take.
 *
 * The hard rule in here is the anti-fabrication block. A resume tool that
 * invents a metric is worse than no tool, because the person using it will not
 * find out until an interviewer asks.
 */

const BULLET_DOCTRINE = `Rewrite rules:
- Open with a specific past-tense action verb. Never "Responsible for".
- State scope: what was owned, for whom, and at what size, when the source says so.
- Put the outcome in the bullet, not just the activity.
- One or two lines. A bullet that wraps to three lines does not get read.
- No filler vocabulary: synergy, leverage, results-driven, dynamic, passionate,
  team player, go-getter, thought leader.`;

const ANTI_FABRICATION = `Truthfulness rules, which outrank every style rule above:
- Do not invent numbers, percentages, dollar amounts, team sizes, or dates.
- Do not invent employers, job titles, technologies, certifications, or outcomes.
- If the source bullet has no measurable result, do NOT supply one. Instead list
  it under "Missing evidence" as a question the candidate could answer from
  their own records.
- Use "supervised" only if the source states direct reports. Otherwise use
  "led", "coordinated", or "drove" as the source supports.
- If the source is too thin to rewrite honestly, say so plainly instead of
  padding it.`;

const OUTPUT_SHAPE = `Reply in exactly this shape, as plain text, with no preamble:

REWRITES
1. <first option>
2. <second option, different emphasis>
3. <third option, most concise>

MISSING EVIDENCE
- <a specific question whose answer would let this bullet carry a metric>
- <another, if one applies>

WHAT I CHANGED
<one or two sentences on the substantive change, not a restatement>`;

export function bulletPrompt({ bullet, targetRole, mode }) {
  const standard =
    mode === 'federal'
      ? `Target standard: OPM federal resume. Scope, hours, and grade-relevant
detail matter more than brevity. Specialized-experience language should align
to the announcement wording where the source supports it.`
      : `Target standard: private-sector ATS resume. Lead with impact, keep
keyword alignment natural, and stay concise.`;

  const system = [
    'You are a resume editor. You rewrite one bullet at a time.',
    standard,
    BULLET_DOCTRINE,
    ANTI_FABRICATION,
    OUTPUT_SHAPE,
  ].join('\n\n');

  const user = [
    targetRole ? `Target role: ${targetRole}` : 'Target role: not specified.',
    '',
    'Source bullet, exactly as written by the candidate:',
    '"""',
    bullet.trim(),
    '"""',
  ].join('\n');

  return { system, user };
}

/** The plain-text form handed to the codex CLI. */
export function asPlainPrompt({ system, user }) {
  return `${system}\n\n---\n\n${user}\n`;
}
