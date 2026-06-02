export type DashboardDeadlineCandidate<TMissingItem> = {
  label: string;
  deadline: Date;
  missingItems: TMissingItem[];
  labelPriority?: number;
};

export function getNextDashboardDeadline<TMissingItem>(
  candidates: DashboardDeadlineCandidate<TMissingItem>[],
) {
  if (candidates.length === 0) {
    return null;
  }

  const sortedCandidates = [...candidates].sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  const nextDeadlineTime = sortedCandidates[0].deadline.getTime();
  const nextCandidates = sortedCandidates.filter(
    (candidate) => candidate.deadline.getTime() === nextDeadlineTime,
  );
  const labelCandidate = [...nextCandidates].sort(
    (a, b) => (b.labelPriority ?? 0) - (a.labelPriority ?? 0),
  )[0];

  return {
    label: labelCandidate.label,
    deadline: sortedCandidates[0].deadline,
    missingItems: nextCandidates.flatMap((candidate) => candidate.missingItems),
  };
}
