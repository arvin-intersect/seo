import Link from "next/link";
import Image from "next/image"; // Import the Next.js Image component

export default function HeaderBrandKit() {
  return (
    <Link
      className="flex items-center gap-2 relative"
      href="/"
    >
      {/* CHANGE START: Replaced the SVG icons with your PNG logo */}
      <Image
        src="/logo.png"
        alt="IntersectAI Logo"
        width={110}  // You can adjust this width
        height={15} // You can adjust this height
        priority // Load the logo quickly
      />
      {/* CHANGE END */}
    </Link>
  );
}