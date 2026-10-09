import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { fetchCurrentProfileDisplayName } from "@/actions/profile";
import { HomeClient } from "@/components/features/HomeClient";
import { LoginScreen } from "@/components/features/LoginScreen";

// A sessão é resolvida no servidor: o HTML já chega com a tela certa,
// sem o "Carregando…" e o round-trip extra de /api/auth/session no cliente.
export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) return <LoginScreen />;

  const displayName = await fetchCurrentProfileDisplayName();
  return (
    <SessionProvider session={session}>
      <HomeClient displayName={displayName} />
    </SessionProvider>
  );
}
