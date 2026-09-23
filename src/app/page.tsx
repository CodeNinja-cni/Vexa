import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Fingerprint,
  Inbox,
  Link2,
  LockKeyhole,
  Mail,
  MessageCircleMore,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  WandSparkles,
  Zap,
} from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";

import {
  getPrincipalForSessionToken,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { LandingDepth } from "./landing-depth";
import styles from "./landing.module.css";

const integrations = [
  { mark: "M", name: "Gmail", status: "Ready" },
  { mark: "31", name: "Google Calendar", status: "Ready" },
  { mark: "in", name: "LinkedIn", status: "Demo" },
  { mark: "S", name: "Slack", status: "Planned" },
  { mark: "W", name: "WhatsApp", status: "Planned" },
];

const faqs = [
  {
    question: "What does Vexa actually do?",
    answer:
      "Vexa turns your conversations, calendar, relationships, and open commitments into one ranked command center. It helps you decide what deserves attention, explains why, and prepares the next move.",
  },
  {
    question: "Can Vexa send messages or change my calendar by itself?",
    answer:
      "No. High-impact actions stay behind an approval step. You review the exact recipient, content, source evidence, and version before anything is allowed to leave Vexa.",
  },
  {
    question: "Do I need to connect Google immediately?",
    answer:
      "No. You can explore the complete investor demo first. Connectors can be added when your workspace and Google credentials are ready.",
  },
  {
    question: "Is the product only for executives?",
    answer:
      "It is designed for anyone managing high-context work: founders, operators, investors, relationship-led sellers, and leaders whose priorities are spread across too many places.",
  },
  {
    question: "How is Vexa different from another AI inbox?",
    answer:
      "Vexa is not limited to email. It connects attention, time, relationships, commitments, and safe action—and keeps the evidence visible instead of asking you to trust a black box.",
  },
];

function Brand() {
  return (
    <Link className={styles.brand} href="/" aria-label="Vexa home">
      <span className={styles.brandMark}>V<i /></span>
      <span className={styles.brandWord}>vexa</span>
    </Link>
  );
}

function PriorityPreview() {
  return (
    <div className={styles.productShell}>
      <div className={styles.productBar}>
        <div className={styles.productDots}><i /><i /><i /></div>
        <div className={styles.productSearch}><Search size={13} />Ask Vexa or search your work <kbd>⌘ K</kbd></div>
        <span className={styles.livePill}><i />LIVE PLAN</span>
      </div>
      <div className={styles.productBody}>
        <aside className={styles.productNav}>
          <div className={styles.miniBrand}><span>V</span><strong>vexa</strong></div>
          <small>COMMAND CENTER</small>
          <span className={styles.activeNav}><Sparkles size={13} />Today</span>
          <span><Inbox size={13} />Inbox<b>6</b></span>
          <span><Users size={13} />People</span>
          <span><Target size={13} />Focus</span>
          <div className={styles.navTrust}><ShieldCheck size={14} /><p><strong>Protection on</strong><small>Approval before action</small></p></div>
        </aside>
        <div className={styles.productMain}>
          <div className={styles.productGreeting}>
            <div><small>MONDAY · EXECUTIVE PULSE</small><h2>Good morning, Chidi.</h2><p>Three things deserve you today.</p></div>
            <div className={styles.signalScore}><Sparkles size={13} /><strong>19</strong><small>signals read</small></div>
          </div>
          <div className={styles.productMetrics}>
            <span><MessageCircleMore size={14} /><p><strong>3 open loops</strong><small>need you today</small></p></span>
            <span><Clock3 size={14} /><p><strong>2h 40m</strong><small>protected focus</small></p></span>
            <span><Radar size={14} /><p><strong>1 opportunity</strong><small>ready to move</small></p></span>
          </div>
          <div className={styles.attentionHeading}><span>RANKED BY CONSEQUENCE</span><strong>Your attention queue</strong></div>
          <article className={styles.priorityCard}>
            <b>01</b><div><small>WORK · HIGHEST LEVERAGE</small><h3>Two decisions are blocking the launch review</h3><p>Resolve ownership before the 2 PM meeting.</p><footer><span><Link2 size={10} />2 verified sources</span><strong>Prepare decision <ArrowRight size={10} /></strong></footer></div>
          </article>
          <article className={styles.priorityCard}>
            <b>02</b><div><small>RELATIONSHIP · OPPORTUNITY</small><h3>Atlas Labs replied to the pilot proposal</h3><p>A warm commercial path reopened eight minutes ago.</p></div>
          </article>
        </div>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const principal = token ? await getPrincipalForSessionToken(token) : null;
  const workspaceHref = principal ? "/app" : "/signup";

  return (
    <LandingDepth className={styles.page}>
      <div className={styles.ambient} aria-hidden="true"><i /><i /><i /></div>

      <header className={styles.header}>
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#why-vexa">Why Vexa</a>
          <a href="#features">Features</a>
          <a href="#safety">Safety</a>
          <a href="#faqs">FAQs</a>
        </nav>
        <div className={styles.headerActions}>
          <Link className={styles.login} href={principal ? "/app" : "/login"}>{principal ? "Workspace" : "Log in"}</Link>
          <Link className={styles.darkButton} href={workspaceHref}>{principal ? "Open Vexa" : "Get started"}<ArrowRight size={14} /></Link>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}><i />YOUR ATTENTION, FINALLY ORGANISED</span>
            <h1>One command center.<br /><em>Every signal that matters.</em></h1>
            <p>Vexa brings your inbox, calendar, relationships, and open loops into one calm view. Know what deserves you, see the evidence, and move forward—with you in control.</p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryButton} href={workspaceHref}>{principal ? "Open your command center" : "Build your command center"}<ArrowRight size={16} /></Link>
              <Link className={styles.textButton} href="/demo"><span><Sparkles size={15} /></span>Explore the live demo</Link>
            </div>
            <div className={styles.microProof}>
              <span><Check size={12} />Works before paid AI</span>
              <span><ShieldCheck size={12} />Approval-first actions</span>
              <span><Link2 size={12} />Evidence on every answer</span>
            </div>
          </div>
          <div className={styles.heroProduct}>
            <div className={styles.productHalo} />
            <PriorityPreview />
            <div className={styles.floatingMessage}>
              <span>AK</span><div><small>ATLAS LABS · JUST NOW</small><strong>“The pilot looks promising. Can we talk Tuesday?”</strong></div>
            </div>
            <div className={styles.floatingSafety}>
              <ShieldCheck size={17} /><div><small>SAFE BY DESIGN</small><strong>Nothing sends without you</strong></div>
            </div>
          </div>
        </section>

        <section className={styles.proofBand} aria-label="Vexa capabilities">
          <p>One clear layer across your work</p>
          <div><span><Mail size={15} />Conversations</span><i /><span><CalendarDays size={15} />Calendar</span><i /><span><Users size={15} />Relationships</span><i /><span><CheckCircle2 size={15} />Commitments</span></div>
        </section>

        <section className={styles.integrations}>
          <div><span className={styles.kicker}><i />BUILT TO MEET YOU WHERE WORK HAPPENS</span><h2>Connect the tools you already trust.</h2></div>
          <div className={styles.integrationList}>{integrations.map((item) => <article key={item.name}><b>{item.mark}</b><span><strong>{item.name}</strong><small>{item.status}</small></span></article>)}</div>
        </section>

        <section className={styles.editorial} id="why-vexa">
          <span>YOUR WORK DOESN’T ARRIVE IN ONE PLACE.</span>
          <h2>Your judgment still has to.</h2>
          <p>Vexa turns scattered context into a clear operating rhythm—so you stop searching for what happened and start deciding what happens next.</p>
        </section>

        <section className={styles.featureStories} id="features">
          <article className={`${styles.story} ${styles.storyLavender}`}>
            <div className={styles.storyCopy}><span>01 · MORNING COMMAND CENTER</span><h2>Start every day knowing what matters.</h2><p>Before the noise begins, Vexa reads the signals you authorised and creates a ranked briefing—complete with urgency, consequences, and source evidence.</p><ul><li><Check size={13} />Ranked by impact, not recency</li><li><Check size={13} />Meetings, replies, and promises in context</li><li><Check size={13} />A clear first move for every priority</li></ul><Link href="/demo">See the command center <ArrowRight size={14} /></Link></div>
            <div className={styles.briefingVisual}>
              <header><span><Sparkles size={14} />Monday briefing</span><small>Updated 8:42 AM</small></header>
              <div className={styles.briefingTitle}><small>YOUR DAY AT A GLANCE</small><h3>Three priorities.<br />One protected focus block.</h3></div>
              <div className={styles.briefingRows}><article><b>01</b><span><small>DECISION</small><strong>Confirm launch ownership</strong><em>Before 2 PM</em></span></article><article><b>02</b><span><small>OPPORTUNITY</small><strong>Reply to Atlas Labs</strong><em>Warm signal</em></span></article><article><b>03</b><span><small>FOCUS</small><strong>Protect strategy time</strong><em>10:00–12:00</em></span></article></div>
            </div>
          </article>

          <article className={`${styles.story} ${styles.storyPeach} ${styles.reverse}`}>
            <div className={styles.storyCopy}><span>02 · UNIFIED INBOX</span><h2>Close the loops that move work forward.</h2><p>Messages become an explainable queue: Priority, Waiting, Opportunity, and FYI. Vexa surfaces what changed, why it matters, and the response worth preparing.</p><ul><li><Check size={13} />Priority instead of unread-count anxiety</li><li><Check size={13} />Thread summaries grounded in the source</li><li><Check size={13} />Reply preparation with human approval</li></ul><Link href="/demo">Explore the inbox <ArrowRight size={14} /></Link></div>
            <div className={styles.inboxVisual}>
              <header><strong>Priority inbox</strong><span>6 need attention</span></header>
              <article className={styles.selectedMessage}><span>AM</span><div><small>AMAKA · 8 MIN AGO</small><strong>Pilot rollout — next steps</strong><p>Could we confirm the Tuesday timeline and owners?</p><footer><b>OPPORTUNITY</b><em>High impact</em></footer></div></article>
              <article><span>JD</span><div><small>JORDAN · 34 MIN AGO</small><strong>Launch review decisions</strong><p>Two ownership questions are still open.</p></div></article>
              <article><span>NK</span><div><small>NKEM · YESTERDAY</small><strong>Waiting on contract notes</strong><p>Legal sent the final redlines for review.</p></div></article>
            </div>
          </article>

          <article className={`${styles.story} ${styles.storyMint}`}>
            <div className={styles.storyCopy}><span>03 · RELATIONSHIP MEMORY</span><h2>Remember the promise, not just the person.</h2><p>See the conversations, commitments, response patterns, and commercial signals shaping every important relationship—without invented profile facts.</p><ul><li><Check size={13} />Conversation history with provenance</li><li><Check size={13} />Commitments and follow-ups in one place</li><li><Check size={13} />Relationship health you can inspect</li></ul><Link href="/demo">See relationship intelligence <ArrowRight size={14} /></Link></div>
            <div className={styles.peopleVisual}>
              <div className={styles.personTop}><span>AO</span><div><h3>Amaka Okafor</h3><p>COO · Atlas Labs</p></div><b>82<small>health</small></b></div>
              <div className={styles.relationshipStats}><span><strong>12</strong><small>threads</small></span><span><strong>2</strong><small>open loops</small></span><span><strong>8m</strong><small>last signal</small></span></div>
              <div className={styles.memoryCard}><WandSparkles size={15} /><p><strong>Worth remembering</strong> Amaka prefers concise Tuesday check-ins and needs a named owner before pilot approval.</p></div>
              <footer><span><Link2 size={11} />4 source moments</span><button>Prepare follow-up <ChevronRight size={11} /></button></footer>
            </div>
          </article>
        </section>

        <section className={styles.featureMosaic}>
          <div className={styles.mosaicIntro}><span className={styles.kicker}><i />MORE THAN AN INBOX</span><h2>A complete operating layer for your attention.</h2><p>Time, questions, and actions work together—without handing control to an invisible agent.</p></div>
          <div className={styles.mosaicGrid}>
            <article className={styles.focusCard}><div className={styles.cardIcon}><Target size={19} /></div><span>FOCUS PLANNING</span><h3>Protect time for the work only you can do.</h3><p>Find conflicts, calculate real availability, and reserve your strongest windows.</p><div className={styles.focusTimeline}><small>9 AM</small><i /><span>Strategy focus · protected</span><small>12 PM</small></div></article>
            <article className={styles.askCard}><div className={styles.cardIcon}><Search size={19} /></div><span>ASK VEXA</span><h3>Ask your work a direct question.</h3><p>Get a concise answer with the exact messages and meetings used to produce it.</p><div className={styles.askBubble}>“What could block Friday’s launch?”<span><Sparkles size={12} />3 grounded findings</span></div></article>
            <article className={styles.actionCard}><div className={styles.cardIcon}><Fingerprint size={19} /></div><span>ACTION CONTROL</span><h3>Review the exact move before it happens.</h3><p>Destination, draft, evidence, and version stay visible. An edit cancels stale approval.</p><div className={styles.approvalMini}><small>READY FOR YOUR REVIEW</small><strong>Send pilot follow-up to Amaka?</strong><span><button>Keep as draft</button><button>Approve once</button></span></div></article>
          </div>
        </section>

        <section className={styles.safety} id="safety">
          <div className={styles.safetyCopy}><span className={styles.kicker}><i />CONTROL IS THE PRODUCT</span><h2>AI that shows its work—and waits for your word.</h2><p>Useful intelligence should not require blind trust. Vexa keeps evidence, boundaries, and revocable authority visible at the moment you decide.</p><div className={styles.safetyPoints}><article><Link2 size={17} /><div><strong>Evidence before confidence</strong><p>Inspect sources, freshness, excerpts, and completeness warnings.</p></div></article><article><LockKeyhole size={17} /><div><strong>Exact-payload approval</strong><p>Permission covers one destination and one immutable version.</p></div></article><article><ShieldCheck size={17} /><div><strong>Scoped access by default</strong><p>Your workspace only sees the sources you explicitly authorise.</p></div></article></div></div>
          <div className={styles.safetyOrbit} aria-hidden="true"><i /><i /><div><Fingerprint size={54} /><span>YOU</span></div><b className={styles.gmailNode}><Mail size={14} />Gmail</b><b className={styles.calendarNode}><CalendarDays size={14} />Calendar</b><b className={styles.actionNode}><Zap size={14} />Actions</b><small>AUTHORITY STAYS AT THE CENTER</small></div>
        </section>

        <section className={styles.faq} id="faqs">
          <div className={styles.faqIntro}><span className={styles.kicker}><i />QUESTIONS, ANSWERED</span><h2>Everything you need to know before you begin.</h2><p>Vexa is being built for high-context work, with clarity and control as product requirements—not fine print.</p><Link href={workspaceHref}>Start with Vexa <ArrowRight size={14} /></Link></div>
          <div className={styles.faqList}>{faqs.map((faq, index) => <details key={faq.question} open={index === 0}><summary><span>0{index + 1}</span>{faq.question}<i>+</i></summary><p>{faq.answer}</p></details>)}</div>
        </section>

        <section className={styles.finalCta}>
          <div><span className={styles.kicker}><i />MAKE ATTENTION YOUR ADVANTAGE</span><h2>Make space for<br />what moves everything.</h2><p>Create your Vexa workspace now, or explore the working product before connecting anything.</p></div>
          <div className={styles.finalActions}><Link className={styles.lightButton} href={workspaceHref}>{principal ? "Return to Vexa" : "Create your workspace"}<ArrowRight size={16} /></Link><Link href="/demo">Explore demo first</Link></div>
        </section>
      </main>

      <footer className={styles.footer}>
        <Brand />
        <p>Evidence first. Approval always. Momentum without chaos.</p>
        <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href={principal ? "/app" : "/login"}>{principal ? "Workspace" : "Log in"}</Link></div>
      </footer>
    </LandingDepth>
  );
}
