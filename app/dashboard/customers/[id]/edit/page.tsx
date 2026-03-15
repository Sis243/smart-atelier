import { prisma } from "@/lib/db";
import EditCustomerForm from "./EditCustomerForm";

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
  });

  if (!customer) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-50 p-6">
        Client introuvable.
      </main>
    );
  }

  return <EditCustomerForm customer={customer} />;
}
