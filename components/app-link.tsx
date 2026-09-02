import type { AnchorHTMLAttributes } from "react";

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
};

// Vinext beta currently throws during client navigation with next/link in the
// deployed Worker. A normal anchor keeps navigation reliable and accessible.
export default function AppLink({ href, children, ...props }: AppLinkProps) {
  return <a href={href} {...props}>{children}</a>;
}
