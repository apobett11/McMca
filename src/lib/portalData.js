import { fetchApplicationWindows, fetchDashboardRegistrationState, fetchParentApplicationBoard } from './accountQueries';
import { fetchAllApplications } from './queries';
import { readHousehold } from './household.js';
import { writeQueryCache } from './queryCache';

export function studentRecordKey(userId) {
  return `${userId}:student-record`;
}

export function parentBoardKey(userId) {
  return `${userId}:parent-board`;
}

export async function loadStudentRecord(userId) {
  const [registration, applications, windows] = await Promise.all([
    fetchDashboardRegistrationState(userId, 'student'),
    fetchAllApplications(userId).catch(() => []),
    fetchApplicationWindows().catch(() => [])
  ]);
  return {
    registration,
    applications: applications || [],
    windows: windows || []
  };
}

export async function loadParentBoard(userId) {
  const [board, registration] = await Promise.all([
    fetchParentApplicationBoard(userId),
    fetchDashboardRegistrationState(userId, 'parent').catch(() => null)
  ]);
  const record = {
    parent: board.parent,
    children: board.children || [],
    applications: board.applications || [],
    windows: board.windows || [],
    household: readHousehold(board.parent),
    registration
  };
  writeQueryCache(parentBoardKey(userId), record);
  return record;
}

export async function loadParentApplications(userId) {
  const [state, board] = await Promise.all([
    fetchDashboardRegistrationState(userId, 'parent'),
    loadParentBoard(userId)
  ]);
  return {
    ...board,
    registrationIncomplete: Boolean(state.incomplete)
  };
}
