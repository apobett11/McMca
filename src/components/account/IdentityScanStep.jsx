import React from 'react';
import { joinFullName } from '../../lib/accountAllocation';
import { UPLOAD_KIND } from '../../lib/documentUpload';
import { DocumentScanField } from './DocumentScanField.jsx';

export function IdentityScanStep({
  values,
  files,
  onFile,
  registeredName,
  registeredId,
  fileField = 'idPhoto',
  backField = 'idBack',
  requireBothSides = true
}) {
  const fullName = registeredName || joinFullName(values);
  const expected = {
    fullName,
    nationalId: registeredId || values.nationalId
  };

  return (
    <>
      <p className="field__help" style={{ marginTop: 0 }}>
        Photo of the ID. Names and number must match the details above.
      </p>
      <DocumentScanField
        id={fileField}
        label="Front of ID"
        file={files[fileField]}
        kind={UPLOAD_KIND.IDENTITY_FRONT}
        expected={expected}
        help="Front of the card, well lit, all corners visible."
        onFile={(file, verification) => onFile(fileField, file, verification)}
      />
      {requireBothSides ? (
        <DocumentScanField
          id={backField}
          label="Back of ID"
          file={files[backField]}
          kind={UPLOAD_KIND.IDENTITY_BACK}
          expected={expected}
          help="Back of the card."
          onFile={(file, verification) => onFile(backField, file, verification)}
        />
      ) : null}
    </>
  );
}
