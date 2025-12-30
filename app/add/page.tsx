import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AddSpotWizard from "@/components/AddSpotWizard";

export default async function AddSpotPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    return <AddSpotWizard />;
}
