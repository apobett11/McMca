/**
 * Onboarding re-exports document specifications from the document-upload algorithm
 * so both layers share one spec checker and never drift apart.
 */
export {
  inspectDocumentQuality,
  inspectDocumentSpecifications
} from '../documentUpload/specifications.js';
