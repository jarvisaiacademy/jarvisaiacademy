interface UserAvatarProps {
  user: { name?: string; email?: string; picture?: string };
  size?: "sm" | "md" | "lg";
}

const BOX = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-xs",
  lg: "w-16 h-16 text-xl",
} as const;

/**
 * The account's Google picture, falling back to initials.
 *
 * One component because the same markup had been written out three times, once per table that
 * lists people. The picture is whatever Google returned at sign-in; an account that gave us
 * none gets initials rather than a broken image.
 */
export function UserAvatar({ user, size = "sm" }: UserAvatarProps) {
  const box = BOX[size];

  if (user.picture) {
    return (
      // Decorative: the person's name is always rendered beside this.
      <img
        src={user.picture}
        alt=""
        className={`${box} rounded-full border border-neutral-200 dark:border-white/10 object-cover shrink-0`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${box} rounded-full bg-neutral-700 text-neutral-200 font-semibold shrink-0`}
    >
      {(user.name || user.email || "?").slice(0, 2).toUpperCase()}
    </div>
  );
}
