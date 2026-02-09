import "@/app/globals.css";
import { ProvidersAndInitialization } from "@/features/app/providers-and-initialization";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { ReactNode } from "react";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// Force dark mode script - runs before any React hydration
const forceDarkModeScript = `
  document.documentElement.classList.add('dark');
  document.documentElement.style.colorScheme = 'dark';
  document.cookie = 'theme=' + encodeURIComponent(JSON.stringify({preference:'dark'})) + ';path=/;max-age=31536000';
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning style={{ colorScheme: 'dark' }}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: forceDarkModeScript }} />
      </head>
      <body
        className={`${outfit.className} ${jetbrainsMono.variable} antialiased bg-black`}
      >
        <ProvidersAndInitialization>{children}</ProvidersAndInitialization>
      </body>
    </html>
  );
}
