import React, { useState } from 'react';
import { Dialog } from '../../components/Dialog';
import { Button } from '../../components/Button';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { Flag, AlertCircle, CheckCircle2 } from 'lucide-react';

const REPORT_REASONS = [
  'Spam or deceptive behavior',
  'Harassment or personal attack',
  'Inappropriate or explicit media',
  'Impersonation or stolen identity',
  'Violence or prohibited content',
  'Other violation of terms',
];

export function ReportModal({ isOpen, onClose, targetType, targetId, targetName = 'this item' }) {
  const { user } = useAuth();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to submit a report.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertErr } = await supabase.from('reports').insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason,
        details: details.trim() || null,
        status: 'open',
      });

      if (insertErr) throw insertErr;

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setDetails('');
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.message || 'Could not submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Submit a Report"
      description={`Report ${targetName} for moderation review.`}
    >
      {isSubmitted ? (
        <div className="py-6 text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-primary">Report received</p>
          <p className="text-xs text-secondary max-w-xs mx-auto">
            Thank you for helping keep the community safe. Our team reviews all reports.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Reason for report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-page px-3 py-2 text-xs text-primary focus:border-accent focus:outline-none"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Additional context (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide specific details to help reviewers understand the issue..."
              rows={3}
              maxLength={1000}
              className="w-full rounded-lg border border-border bg-page px-3 py-2 text-xs text-primary placeholder:text-secondary/60 focus:border-accent focus:outline-none resize-none leading-relaxed"
            />
            <div className="mt-1 flex justify-end text-[11px] text-secondary">
              {details.length} / 1000
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Submit report
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
