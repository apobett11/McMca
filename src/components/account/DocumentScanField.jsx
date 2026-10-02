import React, { useState } from 'react';
import { UPLOAD_KIND, verifyDocumentUpload } from '../../lib/documentUpload';

export function DocumentScanField({
  id,
  label,
  file,
  onFile,
  expected,
  kind = UPLOAD_KIND.IDENTITY_FRONT,
  help = 'Take a clear, well-lit photo. The full document should fill the frame. Names are read from the picture and checked against the form.'
}) {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [extracted, setExtracted] = useState('');

  async function handleChange(nextFile) {
    setError('');
    setStatus('');
    setExtracted('');
    if (!nextFile) {
      onFile(null, null);
      return;
    }
    setChecking(true);
    try {
      const result = await verifyDocumentUpload({
        file: nextFile,
        kind,
        expected: expected || {}
      });
      if (!result.ok) {
        setError(result.reason);
        onFile(null, null);
        return;
      }
      const readName = result.extractedName || result.matchedName;
      const readId = (result.extractedIdNumbers && result.extractedIdNumbers[0]) || result.matchedIdNumber;
      const summary = [readName, readId ? `ID ${readId}` : null].filter(Boolean).join(' · ');
      setExtracted(summary);
      setStatus('Document verified on the spot. It will be saved only after this step is finished.');
      onFile(nextFile, result);
    } catch (err) {
      setError(err.message || 'The document could not be verified. Retake the photo.');
      onFile(null, null);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={(e) => handleChange(e.target.files?.[0] || null)}
        disabled={checking}
      />
      {error ? <p className="field__help">{error}</p> : null}
      {extracted ? <p className="field__help">Read from the photo: {extracted}</p> : null}
      {status && !error ? <p className="field__help">{status}</p> : null}
      {!error && !status ? <p className="field__help">{help}</p> : null}
    </div>
  );
}
