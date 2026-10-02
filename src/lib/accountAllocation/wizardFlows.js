import { EDUCATION_LEVEL, STUDENT_CLASS, WIZARD_FLOW } from './constants.js';

export const REGISTER_INDEPENDENT_STEPS = [
  { key: 'personal_information', title: 'Your details', fields: ['firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth', 'email', 'phone', 'nationalId', 'password', 'idPhoto', 'idBack'] },
  { key: 'parent_information', title: 'Parent', fields: ['parentFirstName', 'parentMiddleName', 'parentLastName', 'parentRelationship', 'parentPhone', 'parentNationalId', 'parentIdFront', 'parentIdBack'] }
];

export const REGISTER_PARENT_STEPS = [
  { key: 'personal_information', title: 'Your details', fields: ['firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth', 'email', 'phone', 'nationalId', 'password', 'idPhoto', 'idBack'] }
];

export const DASHBOARD_STUDENT_STEPS = [
  { key: 'personal_information', title: 'Your details', fields: ['firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth', 'phone', 'nationalId', 'idPhoto', 'idBack'] },
  { key: 'parent_information', title: 'Parent', fields: ['parentFirstName', 'parentLastName', 'parentRelationship', 'parentPhone', 'parentNationalId', 'parentIdFront', 'parentIdBack'] },
  { key: 'institution', title: 'School', fields: ['schoolName', 'schoolLevel', 'admissionNumber', 'bankName', 'bankBranch', 'accountNumber'] },
  { key: 'home_details', title: 'Home', fields: ['constituency', 'ward', 'county', 'subCounty', 'pollingStation'] },
  { key: 'family_details', title: 'Family', fields: ['childrenInFamily', 'childrenInSchool', 'parentStatus', 'monthlyIncome', 'disability', 'otherBursary'] }
];

export const DASHBOARD_PARENT_STEPS = [
  { key: 'personal_information', title: 'Your details', fields: ['firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth', 'phone', 'nationalId', 'idPhoto', 'idBack'] }
];

export const LINK_PARENT_STEPS = [
  { key: 'parent_one', title: 'First parent', fields: ['firstName', 'middleName', 'lastName', 'relationship', 'phone', 'nationalId', 'idFront', 'idBack'] },
  { key: 'parent_two', title: 'Second parent (optional)', fields: ['firstName', 'middleName', 'lastName', 'relationship', 'phone', 'nationalId', 'idFront', 'idBack'], optional: true }
];

export const ADD_CHILD_STEPS = [
  { key: 'personal_information', title: 'Student details', fields: ['firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth'] },
  { key: 'birth_certificate', title: 'Birth certificate', fields: ['birthCertificateNumber', 'certificateName', 'birthCertificatePhoto'] },
  { key: 'education_level', title: 'School level', fields: ['educationLevel'] }
];

export const CHILD_PROFILE_STEPS = [
  { key: 'school', title: 'School details', fields: ['schoolName', 'grade', 'admissionNumber'] },
  { key: 'contacts', title: 'Contact details', fields: ['email', 'phone'] },
  { key: 'delegated_login', title: 'Student login', fields: ['email', 'password'], when: (ctx) => ctx.studentClass === STUDENT_CLASS.DELEGATED }
];

export const APPLICATION_STEPS = [
  { key: 'student_details', title: 'Student details', fields: ['institution', 'cycle'] },
  { key: 'documents', title: 'Documents', fields: [] },
  { key: 'review', title: 'Review', fields: [] }
];

const FLOWS = {
  [WIZARD_FLOW.REGISTER_INDEPENDENT]: REGISTER_INDEPENDENT_STEPS,
  [WIZARD_FLOW.REGISTER_PARENT]: REGISTER_PARENT_STEPS,
  [WIZARD_FLOW.DASHBOARD_STUDENT]: DASHBOARD_STUDENT_STEPS,
  [WIZARD_FLOW.DASHBOARD_PARENT]: DASHBOARD_PARENT_STEPS,
  [WIZARD_FLOW.STUDENT_LINK_PARENTS]: LINK_PARENT_STEPS,
  [WIZARD_FLOW.PARENT_ADD_CHILD]: ADD_CHILD_STEPS,
  [WIZARD_FLOW.CHILD_PROFILE]: CHILD_PROFILE_STEPS,
  [WIZARD_FLOW.APPLICATION]: APPLICATION_STEPS
};

export function getWizardSteps(flowId, context = {}) {
  const steps = FLOWS[flowId] || [];
  return steps.filter((step) => !step.when || step.when(context));
}

export function resolveWizardPosition({ steps, completedKeys = [] }) {
  const completed = new Set(completedKeys);
  const index = steps.findIndex((step) => !completed.has(step.key));
  if (index === -1) {
    return { index: Math.max(0, steps.length - 1), complete: true, current: steps[steps.length - 1] || null };
  }
  return { index, complete: false, current: steps[index] };
}

export function educationLevelOptions() {
  return [
    { value: EDUCATION_LEVEL.PRIMARY, label: 'Primary school' },
    { value: EDUCATION_LEVEL.SECONDARY, label: 'Secondary / high school' },
    { value: EDUCATION_LEVEL.TERTIARY, label: 'College, TVET or university' }
  ];
}
