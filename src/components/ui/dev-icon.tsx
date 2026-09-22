import React from "react";

export interface DevIconProps {
  name: string;
  size?: number;
  className?: string;
}

const ICON_MAP: Record<string, string> = {
  // Backend & Languages
  php: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg",
  python: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg",
  java: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg",
  csharp: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg",
  go: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg",
  rust: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rust/rust-original.svg",
  nodejs: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg",
  typescript: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg",
  javascript: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg",
  html5: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg",
  html: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg",
  css3: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg",
  css: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg",

  // Frontend Frameworks
  react: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg",
  nextjs: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg",
  vuejs: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg",
  angular: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angularjs/angularjs-original.svg",
  svelte: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/svelte/svelte-original.svg",

  // CSS & Styling
  tailwindcss: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg",
  tailwind: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg",
  bootstrap: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bootstrap/bootstrap-original.svg",
  sass: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/sass/sass-original.svg",

  django: "/django-plain.svg",
  flask: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/flask/flask-original.svg",
  fastapi: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/fastapi/fastapi-original.svg",
  laravel: "/laravel-plain.svg",
  express: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg",
  spring: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/spring/spring-original.svg",

  // Databases
  mysql: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg",
  postgresql: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg",
  postgres: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg",
  mongodb: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg",
  redis: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/redis/redis-original.svg",
  sqlite: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/sqlite/sqlite-original.svg",
  oracle: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/oracle/oracle-original.svg",
  plsql: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/oracle/oracle-original.svg",

  // Cloud & DevOps
  aws: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg",
  azure: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg",
  gcp: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg",
  docker: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg",
  kubernetes: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kubernetes/kubernetes-plain.svg",
  linux: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linux/linux-original.svg",
  ubuntu: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ubuntu/ubuntu-original.svg",
  git: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg",
  github: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg",
  jira: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jira/jira-original.svg",
  netlify: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/netlify/netlify-original.svg",

  // Data Science, ML & AI
  tensorflow: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tensorflow/tensorflow-original.svg",
  pytorch: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pytorch/pytorch-original.svg",
  pandas: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pandas/pandas-original.svg",
  numpy: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/numpy/numpy-original.svg",
  powerbi: "/powerbi-logo.png",
  jupyter: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jupyter/jupyter-original.svg",
};

/**
 * The map's key for a display name, so a course's icons can follow the tech stack an admin
 * already types instead of being kept by hand beside it. "Next.js 15" and "React 19" carry
 * versions the keys do not, so a trailing number is dropped before the second look.
 *
 * Returns null for a name with no key — a stack entry like "RAG" has no icon and should show
 * none, which is also why the match is exact: a partial match could only ever pick the wrong
 * brand, never a right one.
 */
export function iconKeyFor(name: string): string | null {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (ICON_MAP[base]) return base;
  const versionless = base.replace(/[0-9]+$/, "");
  return ICON_MAP[versionless] ? versionless : null;
}

/**
 * Some marks vanish on a dark surface. Devicon ships no white variants, so each
 * gets a CSS filter, chosen by how the asset is actually drawn:
 *
 *   "invert dark:invert-0"            white mark        -> black on light
 *   "dark:brightness-0 dark:invert"   flat black mark   -> white on dark
 *   "dark:invert"                     black mark with light detail -> swap
 *
 * `brightness-0` ahead of the invert is what makes the second case pure white.
 * A bare invert leaves AWS's #252f3e a washed-out lavender and turns its #f90
 * smile blue. It also flattens the *whole* mark, so it cannot be used where the
 * detail is drawn in a lighter colour over the dark field — that detail goes
 * white and disappears, which is why nextjs is the third case and not the
 * second. Coloured marks are absent on purpose: inverting repaints the brand.
 */
const ICON_TONE: Record<string, string> = {
  django: "invert dark:invert-0",
  laravel: "invert dark:invert-0",
  aws: "dark:brightness-0 dark:invert",
  github: "dark:brightness-0 dark:invert",
  flask: "dark:brightness-0 dark:invert",
  express: "dark:brightness-0 dark:invert",
  pandas: "dark:brightness-0 dark:invert",
  nextjs: "dark:invert",
};

export const DevIcon: React.FC<DevIconProps> = ({
  name,
  size = 20,
  className = "",
}) => {
  const normalizedKey = name.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Direct match or alias
  const iconSrc =
    ICON_MAP[normalizedKey] ||
    ICON_MAP[name.toLowerCase()] ||
    (normalizedKey.includes("react")
      ? ICON_MAP.react
      : normalizedKey.includes("next")
      ? ICON_MAP.nextjs
      : normalizedKey.includes("python")
      ? ICON_MAP.python
      : normalizedKey.includes("fastapi")
      ? ICON_MAP.fastapi
      : normalizedKey.includes("django")
      ? ICON_MAP.django
      : normalizedKey.includes("laravel")
      ? ICON_MAP.laravel
      : normalizedKey.includes("tailwind")
      ? ICON_MAP.tailwindcss
      : normalizedKey.includes("powerbi")
      ? ICON_MAP.powerbi
      : normalizedKey.includes("docker")
      ? ICON_MAP.docker
      : normalizedKey.includes("aws")
      ? ICON_MAP.aws
      : normalizedKey.includes("linux")
      ? ICON_MAP.linux
      : normalizedKey.includes("oracle") || normalizedKey.includes("plsql")
      ? ICON_MAP.oracle
      : normalizedKey.includes("mongo")
      ? ICON_MAP.mongodb
      : normalizedKey.includes("postgres")
      ? ICON_MAP.postgresql
      : normalizedKey.includes("mysql")
      ? ICON_MAP.mysql
      : normalizedKey.includes("git")
      ? ICON_MAP.git
      : normalizedKey.includes("jira")
      ? ICON_MAP.jira
      : null);

  if (!iconSrc) {
    // Return subtle SVG chip fallback if no brand logo
    return (
      <span
        style={{ width: size, height: size }}
        className={`inline-flex items-center justify-center rounded-md bg-neutral-200/80 dark:bg-white/10 text-[9px] font-bold uppercase text-neutral-700 dark:text-neutral-300 shrink-0 ${className}`}
        title={name}
      >
        {name.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  const toneClass = ICON_TONE[normalizedKey] ?? "";

  return (
    <img
      src={iconSrc}
      alt={`${name} logo`}
      width={size}
      height={size}
      className={`inline-block shrink-0 object-contain transition-transform duration-200 ${toneClass} ${className}`.trim()}
      title={name}
      onError={(e) => {
        // graceful fallback if CDN fails
        (e.currentTarget as HTMLElement).style.display = "none";
      }}
    />
  );
};

export default DevIcon;
