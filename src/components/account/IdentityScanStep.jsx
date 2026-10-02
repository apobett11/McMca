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
  requireBothSides = false
}) {
  const fullName = registeredName || joinFullName(values);
  const expected = {
    fullName,
    nationalId: registeredId || values.nationalId
  };

  return (
    <>
      <p className="field__help" style={{ marginTop: 0 }}>
        The photo is read immediately. Names and the ID number on the card must match
        {' '}<strong>{fullName || 'the registered name'}</strong>
        {expected.nationalId ? <> and ID <strong>{expected.nationalId}</strong></> : null}.
        The file is saved only after this check passes.
      </p>
      <DocumentScanField
        id={fileField}
        label={requireBothSides ? 'Front of national ID' : 'National ID photo'}
        file={files[fileField]}
        kind={UPLOAD_KIND.IDENTITY_FRONT}
        expected={expected}
        onFile={(file, verification) => onFile(fileField, file, verification)}
      />
      {requireBothSides ? (
        <DocumentScanField
          id="idBack"
          label="Back of national ID"
          file={files.idBack}
          kind={UPLOAD_KIND.IDENTITY_BACK}
          expected={expected}
          onFile={(file, verification) => onFile('idBack', file, verification)}
        />
      ) : null}
    </>
  );
}
