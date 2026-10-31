# Run Your LinkedIn Outbound From One Chat

**What this is:** the 7 workflows I run on the Expandi.io MCP, with the exact prompts. You talk to Claude in plain English. Claude operates Expandi.

You still approve what goes live. Read the SAFETY section before you run anything.

---

## SETUP (5 minutes)

1. Connect the Expandi MCP to Claude. It's in beta — you need access from Expandi.
2. Open a new chat and type: `Find my LinkedIn account.`
3. You should get back your account name, ID, and a status of `Ok`. If status isn't Ok, fix that in Expandi first — nothing below will run.

That account ID is what every workflow hangs off. Claude resolves it by name from here on, so you never type it.

---

## WORKFLOW 1 — TARGET

Build a lead list and wire it to a campaign so new leads flow in automatically.

**Prompt:**

> Create a new lead list called "[LIST NAME]" on my LinkedIn account. Then add these leads to it: [paste LinkedIn profile URLs]. Then auto-assign that list to my "[CAMPAIGN NAME]" campaign so anything I add later flows into it automatically.

**What comes back:** the list created, leads added and deduped by profile URL, and the list linked to the campaign.

**Watch out for:**
- You supply the profile URLs. The MCP does not search LinkedIn or Sales Navigator for you — export from Sales Nav, or use a sourcing tool, and paste the links.
- 5,000 leads per list, hard limit.
- Duplicates are handled for you. Same profile URL twice = one lead.

---

## WORKFLOW 2 — ENRICH

Attach research to each lead so your copy can reference it.

**Prompt:**

> For each of these leads, research their company and recent activity, then write the findings onto the lead as placeholders. Use the keys: recent_post, funding_stage, headcount_change, and angle. Keep every value under 300 characters. Leads: [paste profile URLs]

**What comes back:** each lead carries custom variables you can drop into message copy as `{recent_post}`, `{angle}`, and so on.

**Watch out for:**
- **The MCP does not enrich.** It has no email finder, no phone lookup, no company database. Claude does the research (or a second MCP does), and this step writes the result into Expandi. If you want verified emails and mobiles, connect a data MCP alongside it.
- Placeholder values max out at 300 characters. Keys max at 255.
- `contact_status`, `conversation_status`, `tag` and `profile_link` are reserved — Expandi rejects them.
- Writing a key that already exists overwrites it silently.

---

## WORKFLOW 3 — BUILD

Turn a brief into a full campaign.

**Prompt:**

> Build me an advanced campaign called "[NAME]" on my LinkedIn account.
>
> Target: [who]
> Offer: [what you do for them]
> Goal: [book calls / start conversations / drive signups]
>
> Sequence I want:
> - Connection request with a note
> - If they connect, message 2 days later
> - If no reply, follow up 4 days after that
> - Skip anyone who replies
>
> Write the copy in my voice: [paste 2-3 of your own messages as samples]. Leave it as a draft — do not activate it.

**What comes back:** a campaign draft with the flow built — actions, conditions, wait times — and the copy written. Inactive until you turn it on.

**Watch out for:**
- **Editing rebuilds the whole flow.** Every change replaces all steps from scratch. If you say "add one more follow-up," Claude has to resend the entire sequence. Ask it to read the current flow first: `Show me the current steps, then add X and keep everything else identical.`
- Personalization uses single braces — `{first_name}`, not `{{first_name}}`. Double braces break the send.
- Wait times are fixed options, not free text. You get immediately, 15/30/45 min, 1/4/8/12/24/48/72 hours, 1-10 days, 1-2 weeks, 1-6 months, 1-2 years. Ask for "3 days," not "72ish hours."
- Conditions available: connected, visited, followed, email opened, email clicked, open InMail, email bounced, email exists, post liked. If your sequence logic needs something else, it doesn't exist.

---

## WORKFLOW 4 — ROUTE

Pause and resume leads without touching the campaign.

**Prompt:**

> Show me the status of every lead in "[CAMPAIGN NAME]". Pause anyone who [replied / changed jobs / booked a call]. Leave everyone else running.

**Or, resuming:**

> Resume the leads I paused in "[CAMPAIGN NAME]" that are tagged [TAG].

**What comes back:** per-lead status, and the pause/resume applied.

**Watch out for:** pausing a lead stops their sequence, it doesn't remove them. Removing is a separate, destructive call — say "remove," and mean it.

---

## WORKFLOW 5 — REPLY

Triage the inbox and handle responses.

**Prompt:**

> List my conversations with unread replies. For each one, show me the message history, tell me the sentiment, and draft a response I can review.

**What comes back:** conversations, message history, sentiment read, and a suggested reply per thread.

**Watch out for — read this one twice:**
- **Sending is not a separate approval step here.** The reply tool schedules the message into the send queue. There is no "sits in drafts" state like there is for campaigns. If you want to review before anything leaves, tell Claude explicitly: `Show me the drafts as text in this chat. Do not schedule anything until I say go.`
- Scheduled messages are flagged as API-sent and count against your LinkedIn safety limits.

---

## WORKFLOW 6 — DIAGNOSE

Find out why a campaign stopped sending.

**Prompt:**

> "[CAMPAIGN NAME]" isn't sending. Diagnose it and tell me the actual cause.

**What comes back:** an attributed answer, not a guess — account status, whether you're disconnected or restricted, whether you hit the daily limit, how many leads are actually available to send to, and a failure breakdown by reason with the affected leads listed under each.

**Follow-up prompt once you know the cause:**

> Retry the failed actions for [reason]. Show me what you're retrying first.

**Watch out for:** "no leads available" is the most common cause and it isn't a bug. It means the campaign has processed everyone. Feed it a list (Workflow 1).

---

## WORKFLOW 7 — MEASURE

See what's working, and who's behind the number.

**Prompt:**

> Show me performance for "[CAMPAIGN NAME]" — acceptance rate, reply rate, conversion. Then compare it to "[OTHER CAMPAIGN]" and tell me what's different about the two sequences.

**Then drill in:**

> List the leads behind the "interested" metric on "[CAMPAIGN NAME]".

**What comes back:** volume counts, derived rates, campaign comparison, and the actual named leads behind replied / interested / not_interested / maybe.

**Watch out for:** the rates come from cached stats with a freshness timestamp. They lag live state. Ask Claude to show you the timestamp before you make a call on a number.

---

## SAFETY — WHAT ACTUALLY GATES

Two different things, and people conflate them:

**Campaigns are genuinely gated.** A campaign draft is created inactive. Activation is a separate, human step. Claude cannot turn on a campaign as a side effect of building it.

**Replies are not.** The inbox tool schedules messages into the queue. If you want a review step, you have to ask for one every time.

The rule I run: **nothing that talks to a human leaves without me reading it first.** For campaigns that's automatic. For replies, say it out loud in the prompt.

---

## KNOWN LIMITS (it's beta)

- No lead sourcing. You bring the profile URLs.
- No enrichment. Bring a data tool or let Claude research.
- Flow edits are full replacements, not patches.
- Wait times and conditions are fixed lists, not freeform.
- Analytics are cached and lag live state.
- Placeholder values cap at 300 characters.

---

## END

Start with Workflow 6 on a campaign you already have. It's read-only, it can't break anything, and it's the fastest way to see whether Claude is actually reading your Expandi state or just talking.

Then do Workflow 3 and leave the draft off.
