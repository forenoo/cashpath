import Navbar from "@/components/navbar";
import { TRPCReactProvider } from "@/trpc/client";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TRPCReactProvider>
      <Navbar />
      {children}
    </TRPCReactProvider>
  );
}
