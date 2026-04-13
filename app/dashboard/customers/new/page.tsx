import { redirect } from "next/navigation";

export default function NewCustomerRedirectPage() {
  redirect("/dashboard/customers/nouveau");
}
