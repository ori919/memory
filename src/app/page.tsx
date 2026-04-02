import { statSync } from "fs";
import path from "path";

function landingFrameSrc(): string {
  try {
    const file = path.join(process.cwd(), "public", "framer-landing.html");
    const mtime = statSync(file).mtimeMs;
    return `/framer-landing.html?v=${Math.floor(mtime)}`;
  } catch {
    return "/framer-landing.html";
  }
}

// Static Memory landing (`public/framer-landing.html` + `public/landing.css`).
export default function Home() {
  return (
    <iframe
      src={landingFrameSrc()}
      title="Memory"
      className="fixed inset-0 z-0 block h-[100dvh] w-full border-0 bg-[#cfe0dc]"
    />
  );
}
