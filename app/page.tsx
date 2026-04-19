import { redirect } from "next/navigation"

export default function HomePage() {
  // Self-hosters: change this to your own landing page URL or "/login"
  // Default: redirect to the SarmaLink-AI product page
  const target = process.env.NEXT_PUBLIC_HOME_REDIRECT || "https://sarmalinux.com/products/sarmalink-ai"
  redirect(target)
}
