export type Template = {
  name: string;
  blurb: string;
  prompt: string;
};

export const TEMPLATES: Template[] = [
  {
    name: "SaaS",
    blurb: "B2B project management tool with billing.",
    prompt:
      "Build a B2B SaaS project management tool with team workspaces, task boards, time tracking, and invoicing. Support multi-tenancy with role-based access (admin, manager, member). Integrate Stripe for subscription billing with Free, Pro, and Enterprise tiers.",
  },
  {
    name: "Marketplace",
    blurb: "Two-sided freelancer marketplace.",
    prompt:
      "Build a two-sided marketplace for freelance designers and clients. Include profile creation, portfolio uploads, project posting, proposal submission, escrow payments via Stripe, and a review system. Support real-time messaging between parties.",
  },
  {
    name: "Dating App",
    blurb: "Professional dating with compatibility scoring.",
    prompt:
      "Build a dating app for professionals aged 25–40 with compatibility scoring based on career goals and values. Include swipe interface, match system, in-app messaging, and premium subscription for unlimited likes and read receipts.",
  },
  {
    name: "Social Network",
    blurb: "Niche social network for indie builders.",
    prompt:
      "Build a professional social network for indie hackers and solopreneurs. Include posts, follows, project showcases, upvoting, commenting, and a weekly digest email. Support Twitter-style threading and markdown in posts.",
  },
  {
    name: "E-commerce",
    blurb: "Multi-vendor marketplace with seller tools.",
    prompt:
      "Build a multi-vendor e-commerce platform where sellers can list physical products, manage inventory, and process orders. Include product search with filters, cart, Stripe checkout, order tracking, and a seller dashboard with analytics.",
  },
  {
    name: "AI Tool",
    blurb: "AI writing assistant for marketers.",
    prompt:
      "Build an AI writing assistant for content marketers. Users can generate blog posts, social captions, and email sequences from a brief. Include a template library, tone selector, history, and team sharing. Integrate Claude for generation.",
  },
  {
    name: "Mobile App",
    blurb: "Habit tracker with social streaks.",
    prompt:
      "Build a habit tracking mobile app with daily streaks, custom reminders, progress charts, and social accountability partners. Include a gamification system with badges and weekly challenges. Support offline mode with local SQLite.",
  },
  {
    name: "Productivity",
    blurb: "Developer-focused knowledge base.",
    prompt:
      "Build a personal knowledge base and note-taking app like Notion but focused on developers. Support markdown, code blocks with syntax highlighting, bi-directional links, and a graph view of connected notes. Include CLI integration.",
  },
  {
    name: "Gaming",
    blurb: "Multiplayer trivia with real-time rooms.",
    prompt:
      "Build a browser-based multiplayer trivia game with real-time rooms, custom question packs, a leaderboard, and spectator mode. Support up to 50 players per room with WebSocket communication and a host control panel.",
  },
];
