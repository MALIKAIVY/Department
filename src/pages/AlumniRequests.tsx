import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Inbox, UserPlus, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/stores/authStore';
import type { Connection } from '../lib/types';
import { Avatar, Button, Card, EmptyState, PageHeader, Spinner, Textarea } from '../components/ui';
import { formatDate } from '../lib/utils';

export const AlumniRequests: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetch('/connections/');
      setConnections(data || []);
    } catch {
      toast.error('Failed to load connection requests');
    } finally {
      setIsLoading(false);
    }
  };

  const respondToRequest = async (connectionId: string, status: 'accepted' | 'rejected') => {
    setUpdatingId(connectionId);
    const responseMessage = replyDrafts[connectionId]?.trim() || '';
    try {
      await api.fetch(`/connections/${connectionId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, response_message: responseMessage }),
      });
      setConnections((current) =>
        current.map((connection) =>
          connection.id === connectionId ? { ...connection, status, response_message: responseMessage } : connection
        )
      );
      setReplyDrafts((current) => {
        const next = { ...current };
        delete next[connectionId];
        return next;
      });
      toast.success(`Request ${status}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update request');
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingRequests = useMemo(
    () => connections.filter((connection) => connection.status === 'pending' && !connection.is_requester),
    [connections]
  );
  const handledRequests = useMemo(
    () => connections.filter((connection) => !connection.is_requester && connection.status !== 'pending'),
    [connections]
  );

  if (user?.role !== 'alumni') {
    return (
      <EmptyState
        icon={UserPlus}
        title="Alumni only"
        description="Connection request approvals are available to alumni accounts."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Connection Requests"
        description="Approve or decline students who want to connect with you."
        action={
          <Button variant="secondary" onClick={() => navigate('/profile/edit')}>
            Update networking settings
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <RequestMetric label="Pending" value={pendingRequests.length} />
        <RequestMetric label="Accepted" value={connections.filter((item) => item.status === 'accepted' && !item.is_requester).length} />
        <RequestMetric label="Declined" value={connections.filter((item) => item.status === 'rejected' && !item.is_requester).length} />
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Inbox className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-gray-950 dark:text-white">Pending Student Requests</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Students waiting for your response.</p>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <EmptyState icon={Inbox} title="No pending requests" description="New student connection requests will appear here." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pendingRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                reply={replyDrafts[request.id] || ''}
                isUpdating={updatingId === request.id}
                onReplyChange={(value) => setReplyDrafts((current) => ({ ...current, [request.id]: value }))}
                onAccept={() => respondToRequest(request.id, 'accepted')}
                onDecline={() => respondToRequest(request.id, 'rejected')}
              />
            ))}
          </div>
        )}
      </section>

      {handledRequests.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-950 dark:text-white">Recent Decisions</h2>
          <div className="space-y-3">
            {handledRequests.slice(0, 6).map((request) => (
              <div key={request.id} className="space-y-2">
                <Card className="flex items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={request.other_user.full_name} src={request.other_user.avatar_url} className="h-10 w-10 text-sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-950 dark:text-white">{request.other_user.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(request.created_at)}</p>
                    </div>
                  </div>
                  <span className={request.status === 'accepted' ? 'text-emerald-600' : 'text-gray-500'}>
                    {request.status === 'accepted' ? 'Accepted' : 'Declined'}
                  </span>
                </Card>
                {request.response_message && (
                  <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-gray-900/40 dark:text-gray-300">
                    Your reply: {request.response_message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

function RequestMetric({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">{value}</p>
    </Card>
  );
}

function RequestCard({
  request,
  reply,
  isUpdating,
  onReplyChange,
  onAccept,
  onDecline,
}: {
  request: Connection;
  reply: string;
  isUpdating: boolean;
  onReplyChange: (value: string) => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <Avatar name={request.other_user.full_name} src={request.other_user.avatar_url} className="h-14 w-14 text-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-950 dark:text-white">{request.other_user.full_name}</h3>
              <p className="text-sm capitalize text-gray-500 dark:text-gray-400">{request.other_user.role}</p>
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{formatDate(request.created_at)}</span>
          </div>

          {request.message ? (
            <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
              {request.message}
            </p>
          ) : (
            <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
              No message included.
            </p>
          )}

          <div className="mt-4">
            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
              Reply to student
            </label>
            <Textarea
              value={reply}
              onChange={(event) => onReplyChange(event.target.value)}
              placeholder="Write a short response they will receive with your decision..."
              rows={3}
              maxLength={500}
              className="resize-y"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{reply.length}/500</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button variant="success" onClick={onAccept} disabled={isUpdating} className="h-11">
              <CheckCircle className="h-4 w-4" />
              Accept
            </Button>
            <Button variant="secondary" onClick={onDecline} disabled={isUpdating} className="h-11">
              <XCircle className="h-4 w-4" />
              Decline
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
