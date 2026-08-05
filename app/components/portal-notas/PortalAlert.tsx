import Alert from "@/app/components/ui/Alert";

type PortalAlertProps = {
  children: React.ReactNode;
  title?: string;
};

export function PortalAlertWarning({ children, title }: PortalAlertProps) {
  return (
    <Alert variant="warning" title={title}>
      {children}
    </Alert>
  );
}

export function PortalAlertError({ children, title }: PortalAlertProps) {
  return (
    <Alert variant="error" title={title}>
      {children}
    </Alert>
  );
}

export function PortalAlertSuccess({ children, title }: PortalAlertProps) {
  return (
    <Alert variant="success" title={title}>
      {children}
    </Alert>
  );
}

export default Alert;
