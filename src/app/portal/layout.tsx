import StaffShell from "@/components/admin/StaffShell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <StaffShell>{children}</StaffShell>;
}
