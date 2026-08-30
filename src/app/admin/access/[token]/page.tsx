import SetPasswordForm from "../../set-password/SetPasswordForm";

export default async function StaffAccessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SetPasswordForm accessToken={token} />;
}
