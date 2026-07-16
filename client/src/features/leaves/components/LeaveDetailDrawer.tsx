import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { approveLeave, deleteLeave, disapproveLeave, getLeaveDetail } from '@/api/leaves.service';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/format';
import type { Leave } from '@/types';

interface LeaveDetailDrawerProps {
  leaveId: Leave['id'] | null;
  onOpenChange: (open: boolean) => void;
}

export function LeaveDetailDrawer({ leaveId, onOpenChange }: LeaveDetailDrawerProps) {
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [confirmAction, setConfirmAction] = React.useState<'approve' | 'disapprove' | 'delete' | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.leaveDetail(leaveId),
    queryFn: () => getLeaveDetail(leaveId!),
    enabled: leaveId !== null,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['leaves'] });

  const approveMutation = useMutation({
    mutationFn: () => approveLeave(leaveId!),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Leave approved' });
      setConfirmAction(null);
    },
  });

  const disapproveMutation = useMutation({
    mutationFn: () => disapproveLeave(leaveId!, rejectionReason),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Leave disapproved' });
      setConfirmAction(null);
      setRejectionReason('');
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
            <SheetDescription>Review, approve, or disapprove this request.</SheetDescription>
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

              {data.status === 'pending' && (
                <div className="space-y-3">
                  <Separator />
                  <div className="space-y-1.5">
                    <Label htmlFor="rejectionReason">Rejection reason (if disapproving)</Label>
                    <Textarea
                      id="rejectionReason"
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this request is being disapproved…"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => setConfirmAction('approve')}>
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={!rejectionReason.trim()}
                      onClick={() => setConfirmAction('disapprove')}
                    >
                      Disapprove
                    </Button>
                  </div>
                </div>
              )}

              <Separator />
              <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={() => setConfirmAction('delete')}>
                Delete request
              </Button>
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
        open={confirmAction === 'disapprove'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Disapprove this leave request?"
        description="The employee will see the rejection reason you provided."
        confirmLabel={disapproveMutation.isPending ? 'Disapproving…' : 'Disapprove'}
        variant="destructive"
        isLoading={disapproveMutation.isPending}
        onConfirm={() => disapproveMutation.mutate()}
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
