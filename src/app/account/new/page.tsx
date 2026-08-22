import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TributeWizard } from "@/components/TributeWizard";

export default async function NewTributePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <TributeWizard />;
}
