import { STUDENT, STUDENT_MODAL_NOTIFICATIONS } from '../data/studentMock.js';

/** Shared PageShell props for student operational portal routes. */
export const STUDENT_SHELL = {
  portalVariant: 'student',
  portalLabel: 'Student portal',
  homePath: '/student/dashboard',
  profilePath: '/student/profile',
  userInitials: STUDENT.initials,
  studentName: STUDENT.fullName,
  wardName: STUDENT.wardName,
  notificationItems: STUDENT_MODAL_NOTIFICATIONS
};
