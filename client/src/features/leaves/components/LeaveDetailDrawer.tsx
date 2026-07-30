import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { approveLeave, deleteLeave, getLeaveDetail } from '@/api/leaves.service';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/format';
import type { Leave } from '@/types';

interface LeaveDetailDrawerProps {
  leaveId: Leave['id'] | null;
  onOpenChange: (open: boolean) => void;
}

export function LeaveDetailDrawer({ leaveId, onOpenChange }: LeaveDetailDrawerProps) {
  const [confirmAction, setConfirmAction] = React.useState<'approve' | 'delete' | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { canApprove, canDelete } = usePermissions();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.leaveDetail(leaveId),
    queryFn: () => getLeaveDetail(leaveId!),
    enabled: leaveId !== null,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['leaves'] });

  /*
   * Nobody may action their own request. The login payload's `user_id` is the
   * signed-in person's biometric id, which is exactly what a leave row is keyed
   * by (`bio_id`), so a match means this request belongs to the viewer.
   */
  const isOwnRequest = !!user?.id && String(data?.employeeId ?? '') === String(user.id);
  const canActionThisRequest = canApprove && !isOwnRequest;

  const approveMutation = useMutation({
    mutationFn: () => approveLeave(leaveId!),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Leave approved' });
      setConfirmAction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLeave(leaveId!),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Leave request deleted' });
      setConfirmAction(null);
      onOpenChange(false);
    },
  });

  return (
    <>
      <Sheet open={leaveId !== null} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Leave request</SheetTitle>
            <SheetDescription>Review and approve this request.</SheetDescription>
          </SheetHeader>

          {isLoading && (
            <div className="mt-6 space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {!isLoading && data && (
            <div className="mt-6 space-y-5">
              <div>
                <p className="text-base font-semibold">{data.employeeName}</p>
                <p className="text-sm text-muted-foreground">{data.leaveType}</p>
              </div>
              <StatusBadge status={data.status} />
              <Separator />
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Start date</dt>
                <dd>{formatDate(data.startDate)}</dd>
                <dt className="text-muted-foreground">End date</dt>
                <dd>{formatDate(data.endDate)}</dd>
                <dt className="text-muted-foreground">Applied on</dt>
                <dd>{formatDate(data.appliedOn)}</dd>
              </dl>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Reason</p>
                <p className="mt-1 text-sm">{data.reason}</p>
              </div>

              {data.status === 'disapproved' && data.rejectionReason && (
                <div className="rounded-md bg-destructive/10 p-3">
                  <p className="text-xs font-medium text-destructive">Rejection reason</p>
                  <p className="mt-1 text-sm text-destructive">{data.rejectionReason}</p>
                </div>
              )}

              {/* Approving requires the approval permission from the signed-in
                  user's own login payload. Disapproving is intentionally not
                  offered in the UI. */}
              {data.status === 'pending' && canActionThisRequest && (
                <div className="space-y-3">
                  <Separator />
                  <Button className="w-full" onClick={() => setConfirmAction('approve')}>
                    Approve
                  </Button>
                </div>
              )}

              {data.status === 'pending' && !canActionThisRequest && (
                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  {isOwnRequest
                    ? 'This is your own request — it must be approved by someone else.'
                    : 'You do not have permission to approve leave requests.'}
                </p>
              )}

              {canDelete && (
                <>
                  <Separator />
                  <Button
                    variant="ghost"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={() => setConfirmAction('delete')}
                  >
                    Delete request
                  </Button>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmAction === 'approve'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Approve this leave request?"
        description="The employee will be marked on leave for the selected dates."
        confirmLabel={approveMutation.isPending ? 'Approving…' : 'Approve'}
        isLoading={approveMutation.isPending}
        onConfirm={() => approveMutation.mutate()}
      />
      <ConfirmDialog
        open={confirmAction === 'delete'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Delete this leave request?"
        description="This action cannot be undone."
        confirmLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete'}
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </>
  );
}
