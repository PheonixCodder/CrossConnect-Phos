import { ResponsiveDialog } from "@/components/layout/responsive-dialog";
import { OrganizationForm } from "./OrganizationForm";

type NewOrgDialogProps = {
  open: boolean;
  onOpenChange: () => void;
};

export const NewOrgDialog = ({ open, onOpenChange }: NewOrgDialogProps) => (
  <ResponsiveDialog
    open={open}
    onOpenChange={onOpenChange}
    title="New Organization"
    description="Create a new organization"
  >
    <OrganizationForm onSuccess={onOpenChange} onCancel={onOpenChange} />
  </ResponsiveDialog>
);
