import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { apiClient } from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  EyeOff,
  UserX,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'audit' | 'actions'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Direct action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('suspend_user');
  const [targetType, setTargetType] = useState('user');
  const [targetId, setTargetId] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  // 1. Verify admin privilege
  useEffect(() => {
    async function checkAdmin() {
      if (!user || !isSupabaseConfigured()) {
        setIsCheckingAdmin(false);
        return;
      }

      try {
        const { data, error: adminErr } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        setIsAdmin(Boolean(data && !adminErr));
      } catch {
        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    }

    checkAdmin();
  }, [user]);

  // 2. Fetch reports and audit logs
  const fetchReports = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    setError(null);

    try {
      // First try via server endpoint
      const response = await apiClient('/moderation/reports').catch(() => null);
      if (response?.reports) {
        setReports(response.reports);
      } else {
        // Fallback to direct Supabase query
        const { data, error: repErr } = await supabase
          .from('reports')
          .select(`
            id,
            reporter_id,
            target_type,
            target_id,
            reason,
            details,
            status,
            created_at,
            reporter:profiles!reporter_id (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (repErr) throw repErr;
        setReports(data || []);
      }

      // Fetch audit logs
      const { data: logs } = await supabase
        .from('moderation_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      setAuditLogs(logs || []);
    } catch (err) {
      setError(err.message || 'Could not load moderation reports.');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchReports();
    }
  }, [isAdmin, fetchReports]);

  // 3. Resolve / dismiss report
  const handleUpdateReportStatus = async (reportId, newStatus) => {
    try {
      await apiClient(`/moderation/reports/${reportId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      }).catch(async () => {
        // Fallback to direct Supabase update
        await supabase
          .from('reports')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', reportId);
      });

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      setError(err.message || 'Failed to update report status.');
    }
  };

  // 4. Execute moderation action
  const handleExecuteAction = async (e) => {
    e.preventDefault();
    if (!targetId.trim() || !actionReason.trim()) return;

    setIsExecutingAction(true);
    setError(null);
    setActionSuccess(null);

    try {
      await apiClient('/moderation/action', {
        method: 'POST',
        body: JSON.stringify({
          action: actionType,
          targetType,
          targetId: targetId.trim(),
          reason: actionReason.trim(),
        }),
      });

      setActionSuccess(`Action '${actionType}' applied to ${targetType} successfully.`);
      setActionModalOpen(false);
      setTargetId('');
      setActionReason('');
      fetchReports();
    } catch (err) {
      setError(err.message || 'Could not execute moderation action.');
    } finally {
      setIsExecutingAction(false);
    }
  };

  if (isCheckingAdmin) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-xs text-secondary">
        Verifying administrator credentials...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <EmptyState
          icon={ShieldAlert}
          title="Access Restricted"
          description="This section is restricted exclusively to authorized platform administrators."
        />
      </div>
    );
  }

  const openReports = reports.filter((r) => r.status === 'open');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-bold tracking-tight text-primary">
              Admin Moderation Console
            </h1>
          </div>
          <p className="text-xs text-secondary mt-1">
            Review user reports, enforce trust and safety standards, and inspect audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            className="gap-1.5 text-xs"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setActionModalOpen(true)}
            className="text-xs"
          >
            Quick Action
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {actionSuccess && (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-600 dark:text-emerald-400">
          {actionSuccess}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-secondary">Open Reports</p>
          <p className="text-2xl font-bold text-primary mt-1">{openReports.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-secondary">Resolved Reports</p>
          <p className="text-2xl font-bold text-accent mt-1">
            {reports.filter((r) => r.status === 'resolved').length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-secondary">Audit Trail Records</p>
          <p className="text-2xl font-bold text-primary mt-1">{auditLogs.length}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-6" aria-label="Moderation sections">
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'reports'
                ? 'border-accent text-accent'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Reports Queue ({openReports.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-accent text-accent'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === 'reports' ? (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="Reports queue clear"
              description="No user reports currently pending moderation review."
            />
          ) : (
            reports.map((report) => {
              const isResolved = report.status === 'resolved';
              const isDismissed = report.status === 'dismissed';

              return (
                <div
                  key={report.id}
                  className="rounded-xl border border-border bg-surface p-4 space-y-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary capitalize">
                          {report.target_type} Report
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            report.status === 'open'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : isResolved
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-page text-secondary'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <p className="text-secondary text-[11px] mt-0.5">
                        Target ID: <code className="font-mono">{report.target_id}</code>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {report.status === 'open' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs h-7 px-2.5"
                            onClick={() => {
                              setActionType(
                                report.target_type === 'user' ? 'suspend_user' : 'hide_post'
                              );
                              setTargetType(report.target_type);
                              setTargetId(report.target_id);
                              setActionReason(`Violation: ${report.reason}`);
                              setActionModalOpen(true);
                            }}
                          >
                            Take Action
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2.5"
                            onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                          >
                            Resolve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2.5 text-secondary"
                            onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                          >
                            Dismiss
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-page p-3 border border-border/60">
                    <p className="font-medium text-primary">Reason: {report.reason}</p>
                    {report.details && (
                      <p className="text-secondary mt-1 whitespace-pre-wrap">{report.details}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-secondary">
                    <span>
                      Reported by: @{report.reporter?.username || 'member'}
                    </span>
                    <span>{new Date(report.created_at).toLocaleString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Audit Trail */
        <div className="space-y-3">
          {auditLogs.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No audit actions recorded"
              description="All moderation actions executed by administrators will be tracked here."
            />
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-border bg-surface p-3.5 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary font-mono">{log.action}</span>
                    <span className="text-secondary">&middot;</span>
                    <span className="text-secondary capitalize">{log.target_type}</span>
                  </div>
                  <p className="text-secondary text-[11px] mt-0.5">
                    Target: <code className="font-mono">{log.target_id}</code>
                  </p>
                  <p className="text-primary text-xs mt-1">Reason: {log.reason}</p>
                </div>

                <div className="text-right text-[11px] text-secondary shrink-0">
                  <p>{new Date(log.created_at).toLocaleDateString()}</p>
                  <p>{new Date(log.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Quick Action Modal */}
      <Dialog
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title="Execute Moderation Action"
        description="Enforce platform policies. All operations are logged to the audit trail."
      >
        <form onSubmit={handleExecuteAction} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Action</label>
            <select
              value={actionType}
              onChange={(e) => {
                const val = e.target.value;
                setActionType(val);
                if (val.includes('user')) setTargetType('user');
                if (val.includes('post')) setTargetType('post');
              }}
              className="w-full rounded-lg border border-border bg-page px-3 py-2 text-xs text-primary focus:border-accent focus:outline-none"
            >
              <option value="suspend_user">Suspend User Account</option>
              <option value="reactivate_user">Reactivate User Account</option>
              <option value="hide_post">Hide Post</option>
              <option value="restore_post">Restore Post</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Target ID (UUID)</label>
            <input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              required
              className="w-full rounded-lg border border-border bg-page px-3 py-2 text-xs font-mono text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1">
              Reason (Required for audit log)
            </label>
            <input
              type="text"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="e.g. Terms violation - repeated spam"
              required
              className="w-full rounded-lg border border-border bg-page px-3 py-2 text-xs text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActionModalOpen(false)}
              disabled={isExecutingAction}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isExecutingAction}
              isLoading={isExecutingAction}
            >
              Confirm and apply
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
