import React, { useMemo, useState, useEffect, useRef } from 'react';
import { VerifiedField } from './VerifiedField.jsx';

export const INSTITUTION_LEVELS = [
  { value: 'university_college', label: 'University / College' },
  { value: 'tvet', label: 'TVET' },
  { value: 'secondary', label: 'Secondary School' },
  { value: 'primary', label: 'Primary School' }
];

export const INSTITUTIONS_BY_LEVEL = {
  university_college: [
    { name: 'Chuka University', level: 'university_college', bankBranch: 'Chuka Branch', bankName: 'Co-operative Bank of Kenya', accountNumber: '01129485701200' },
    { name: 'Dedan Kimathi University of Technology', level: 'university_college', bankBranch: 'Nyeri Branch', bankName: 'Equity Bank Kenya', accountNumber: '01102938475611' },
    { name: 'Egerton University', level: 'university_college', bankBranch: 'Egerton Branch', bankName: 'Kenya Commercial Bank (KCB)', accountNumber: '1102345678' },
    { name: 'Jomo Kenyatta University of Agriculture and Technology (JKUAT)', level: 'university_college', bankBranch: 'Juja Branch', bankName: 'Absa Bank Kenya', accountNumber: '020918273645' },
    { name: 'Kabarak University', level: 'university_college', bankBranch: 'Nakuru Branch', bankName: 'Equity Bank Kenya', accountNumber: '031029384890' },
    { name: 'Karatina University', level: 'university_college', bankBranch: 'Karatina Branch', bankName: 'Equity Bank Kenya', accountNumber: '041029384756' },
    { name: 'Kenya Highlands University', level: 'university_college', bankBranch: 'Kericho Branch', bankName: 'Kenya Commercial Bank (KCB)', accountNumber: '1103948572' },
    { name: 'Kenyatta University', level: 'university_college', bankBranch: 'KU Branch', bankName: 'National Bank of Kenya (NBK)', accountNumber: '0102938475' },
    { name: 'Kisii University', level: 'university_college', bankBranch: 'Kisii Branch', bankName: 'National Bank of Kenya (NBK)', accountNumber: '0102938499' },
    { name: 'Maseno University', level: 'university_college', bankBranch: 'Maseno Branch', bankName: 'Equity Bank Kenya', accountNumber: '062019283741' },
    { name: 'Masinde Muliro University of Science and Technology (MMUST)', level: 'university_college', bankBranch: 'Kakamega Branch', bankName: 'Kenya Commercial Bank (KCB)', accountNumber: '1108273645' },
    { name: 'Moi University', level: 'university_college', bankBranch: 'Moi University Branch', bankName: 'Kenya Commercial Bank (KCB)', accountNumber: '1109876543' },
    { name: 'Mount Kenya University', level: 'university_college', bankBranch: 'Thika Branch', bankName: 'Equity Bank Kenya', accountNumber: '054019289012' },
    { name: 'Strathmore University', level: 'university_college', bankBranch: 'Nairobi Branch', bankName: 'Standard Chartered Bank', accountNumber: '010804561234' },
    { name: 'Technical University of Kenya (TUK)', level: 'university_college', bankBranch: 'Haile Selassie Branch', bankName: 'Co-operative Bank of Kenya', accountNumber: '011293847561' },
    { name: 'Technical University of Mombasa (TUM)', level: 'university_college', bankBranch: 'Mombasa Branch', bankName: 'Kenya Commercial Bank (KCB)', accountNumber: '1120938475' },
    { name: 'University of Eldoret', level: 'university_college', bankBranch: 'Eldoret Branch', bankName: 'National Bank of Kenya (NBK)', accountNumber: '010394857201' },
    { name: 'University of Nairobi', level: 'university_college', bankBranch: 'University Way', bankName: 'Absa Bank Kenya', accountNumber: '0309876543' }
  ],
  tvet: [
    { name: 'Chepsir Technical Training Institute', level: 'tvet', bankBranch: 'Kericho Branch', bankName: 'Kenya Commercial Bank (KCB)', accountNumber: '1123490182' },
    { name: 'Kapchelach Skills Innovation Hub', level: 'tvet', bankBranch: 'Kericho Branch', bankName: 'Equity Bank Kenya', accountNumber: '0620194857' },
    { name: 'Kapkures Youth Polytechnic', level: 'tvet', bankBranch: 'Nakuru Central', bankName: 'Equity Bank Kenya', accountNumber: '0541129384' },
    { name: 'Kapsebet Community College', level: 'tvet', bankBranch: 'Molo Branch', bankName: 'Postbank Kenya', accountNumber: '0812938402' },
    { name: 'Kenya Medical Training College (KMTC) Kericho', level: 'tvet', bankBranch: 'Kericho Branch', bankName: 'National Bank of Kenya (NBK)', accountNumber: '0102948578' },
    { name: 'Kenya Medical Training College (KMTC) Nakuru', level: 'tvet', bankBranch: 'Nakuru Branch', bankName: 'National Bank of Kenya (NBK)', accountNumber: '0102948571' },
    { name: 'Kericho Technical Institute', level: 'tvet', bankBranch: 'Kericho Branch', bankName: 'Kenya Commercial Bank (KCB)', accountNumber: '1139485712' },
    { name: 'Nakuru National Polytechnic', level: 'tvet', bankBranch: 'Nakuru Town', bankName: 'Co-operative Bank of Kenya', accountNumber: '0113948572' },
    { name: 'Rift Valley Technical Training Institute (RVTTI)', level: 'tvet', bankBranch: 'Eldoret Branch', bankName: 'Kenya Commercial Bank (KCB)', accountNumber: '1104859203' },
    { name: 'Sorget Technical & Agricultural Institute', level: 'tvet', bankBranch: 'Londiani Branch', bankName: 'Co-operative Bank of Kenya', accountNumber: '0114589231' },
    { name: 'Tendeno Vocational Training Centre', level: 'tvet', bankBranch: 'Molo Branch', bankName: 'Kenya Commercial Bank (KCB)', accountNumber: '1145678901' }
  ],
  secondary: [
    { name: 'Chepsir Secondary School', level: 'secondary', bankBranch: 'Chepsir Branch', bankName: 'Kenya Commercial Bank (KCB)', accountNumber: '1109283746' },
    { name: 'Chesinende Secondary School', level: 'secondary', bankBranch: 'Londiani Branch', bankName: 'Kenya Commercial Bank (KCB)', accountNumber: '1120938475' },
    { name: 'Kapkures Secondary School', level: 'secondary', bankBranch: 'Nakuru West', bankName: 'Equity Bank Kenya', accountNumber: '0540192849' },
    { name: 'Kapsimotwo Secondary School', level: 'secondary', bankBranch: 'Molo Branch', bankName: 'Postbank Kenya', accountNumber: '0812938499' },
    { name: 'Kuresoi Secondary School', level: 'secondary', bankBranch: 'Molo Branch', bankName: 'Kenya Commercial Bank (KCB)', accountNumber: '1128374659' },
    { name: 'Londiani Boys High School', level: 'secondary', bankBranch: 'Londiani Branch', bankName: 'Co-operative Bank of Kenya', accountNumber: '0114928374' },
    { name: 'Londiani Girls High School', level: 'secondary', bankBranch: 'Londiani Branch', bankName: 'Equity Bank Kenya', accountNumber: '0540293847' },
    { name: 'Moi High School Kabarak', level: 'secondary', bankBranch: 'Nakuru West', bankName: 'Equity Bank Kenya', accountNumber: '0310293847' },
    { name: 'Nakuru High School', level: 'secondary', bankBranch: 'Nakuru Town', bankName: 'Co-operative Bank of Kenya', accountNumber: '0112948576' },
    { name: 'Sorget Secondary School', level: 'secondary', bankBranch: 'Kericho Branch', bankName: 'Co-operative Bank of Kenya', accountNumber: '0115829304' },
    { name: 'Tendeno Secondary School', level: 'secondary', bankBranch: 'Molo Branch', bankName: 'Kenya Commercial Bank (KCB)', accountNumber: '1138495029' }
  ],
  primary: [
    { name: 'Chepsir Primary School', level: 'primary', bankBranch: 'Kericho Branch', bankName: 'Equity Bank Kenya', accountNumber: '0620394857' },
    { name: 'Kapkures Primary School', level: 'primary', bankBranch: 'Nakuru Branch', bankName: 'Postbank Kenya', accountNumber: '0812940293' },
    { name: 'Kapsebet Primary School', level: 'primary', bankBranch: 'Molo Branch', bankName: 'Kenya Commercial Bank (KCB)', accountNumber: '1139402918' },
    { name: 'Kuresoi Primary School', level: 'primary', bankBranch: 'Molo Branch', bankName: 'Postbank Kenya', accountNumber: '0812938471' },
    { name: 'Londiani Boarding Primary School', level: 'primary', bankBranch: 'Londiani Branch', bankName: 'Co-operative Bank of Kenya', accountNumber: '0113948201' },
    { name: 'Sorget Primary School', level: 'primary', bankBranch: 'Londiani Branch', bankName: 'Co-operative Bank of Kenya', accountNumber: '0112049583' },
    { name: 'St. Mary Primary School', level: 'primary', bankBranch: 'Nakuru Central', bankName: 'Equity Bank Kenya', accountNumber: '0540192837' },
    { name: 'Tendeno Primary School', level: 'primary', bankBranch: 'Molo Branch', bankName: 'Kenya Commercial Bank (KCB)', accountNumber: '1148392019' }
  ]
};

// Flattened for backwards compatibility & quick lookup
export const KNOWN_INSTITUTIONS = Object.values(INSTITUTIONS_BY_LEVEL).flat();

export function InstitutionFields({
  values,
  onChange,
  errors = {},
  idPrefix = 'sch-'
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

  const id = (name) => `${idPrefix}${name}`;

  // Normalize current level value (handle legacy 'tertiary' -> 'university_college')
  const currentLevel = useMemo(() => {
    if (values.schoolLevel === 'tertiary') return 'university_college';
    return values.schoolLevel || '';
  }, [values.schoolLevel]);

  // Handle level change
  function handleLevelChange(newLevel) {
    onChange('schoolLevel', newLevel);
  }

  // Filter & sort institutions matching selected level and search term
  const filteredSuggestions = useMemo(() => {
    const pool = currentLevel && INSTITUTIONS_BY_LEVEL[currentLevel]
      ? INSTITUTIONS_BY_LEVEL[currentLevel]
      : KNOWN_INSTITUTIONS;

    const query = (values.schoolName || '').trim().toLowerCase();
    if (!query) {
      return [...pool].sort((a, b) => a.name.localeCompare(b.name));
    }

    // Prioritize institutions whose name starts with query, sorted alphabetically
    const startsWith = pool
      .filter((i) => i.name.toLowerCase().startsWith(query))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Followed by institutions containing query elsewhere
    const contains = pool
      .filter((i) => !i.name.toLowerCase().startsWith(query) && i.name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...startsWith, ...contains];
  }, [currentLevel, values.schoolName]);

  // Handle suggestion selection
  function handleSelectSuggestion(inst) {
    onChange('schoolName', inst.name);
    if (inst.level) {
      onChange('schoolLevel', inst.level);
    }
    // Prefill the protocol bank details
    onChange('bankBranch', inst.bankBranch || '');
    onChange('bankName', inst.bankName || '');
    onChange('accountNumber', inst.accountNumber || '');
    setShowSuggestions(false);
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef}>
      {/* Side-by-side row: Select Institution Level & School/Institution Name */}
      <div
        className="institution-side-by-side"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 16,
          alignItems: 'start'
        }}
      >
        {/* 1. Select Institution Level */}
        <div className={`field ${errors.schoolLevel ? 'field--invalid' : ''}`} style={{ margin: 0 }}>
          <label htmlFor={id('schoolLevel')} style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
            Select Institution Level *
          </label>
          <select
            id={id('schoolLevel')}
            name="schoolLevel"
            value={currentLevel}
            onChange={(e) => handleLevelChange(e.target.value)}
            required
            aria-invalid={Boolean(errors.schoolLevel)}
            className={errors.schoolLevel ? 'is-invalid' : ''}
            style={{ width: '100%' }}
          >
            <option value="">Select institution level</option>
            <option value="university_college">University / College</option>
            <option value="tvet">TVET</option>
            <option value="secondary">Secondary School</option>
            <option value="primary">Primary School</option>
          </select>
          {errors.schoolLevel ? <p className="field__error-msg">{errors.schoolLevel}</p> : null}
        </div>

        {/* 2. School / Institution Name with typing and alphabetical sort */}
        <div
          className={`field ${errors.schoolName ? 'field--invalid' : ''}`}
          style={{ margin: 0, position: 'relative' }}
        >
          <label htmlFor={id('schoolName')} style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
            School / Institution Name *
          </label>
          <input
            id={id('schoolName')}
            name="schoolName"
            type="text"
            value={values.schoolName || ''}
            onChange={(e) => {
              onChange('schoolName', e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Type to search or enter school name"
            autoComplete="off"
            required
            aria-invalid={Boolean(errors.schoolName)}
            className={errors.schoolName ? 'is-invalid' : ''}
            style={{ width: '100%' }}
          />
          {errors.schoolName ? <p className="field__error-msg">{errors.schoolName}</p> : null}

          {/* Autocomplete dropdown suggestion list */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 100,
                maxHeight: 220,
                overflowY: 'auto',
                background: '#1e293b',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                borderRadius: 8,
                marginTop: 4,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
              }}
            >
              {filteredSuggestions.map((inst) => (
                <button
                  type="button"
                  key={inst.name}
                  onClick={() => handleSelectSuggestion(inst)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 12px',
                    fontSize: '0.86rem',
                    color: '#f8fafc',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{inst.name}</div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    {inst.bankName} · {inst.bankBranch}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Admission number or registration number - standard input, no sort or dropdown */}
      <div style={{ marginBottom: 16 }}>
        <VerifiedField
          id={id('admissionNumber')}
          name="admissionNumber"
          label="Admission number or registration number *"
          value={values.admissionNumber}
          error={errors.admissionNumber}
          placeholder="e.g. ADM/2024/001 or REG12345"
          onChange={(v) => onChange('admissionNumber', v)}
          required
        />
      </div>

      {/* 4. Institution bank details section (protocol: bank branch, bank name, account number) */}
      <div
        style={{
          marginTop: 20,
          padding: '16px',
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: 12
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <h4
            style={{
              margin: '0 0 4px',
              fontSize: '0.92rem',
              fontWeight: 600,
              color: '#f8fafc'
            }}
          >
            Institution Bank & Account Details
          </h4>
          <p className="field__help" style={{ margin: 0, fontSize: '0.8rem' }}>
            Auto-filled from selected institution. If not listed, enter official school disbursement details below.
          </p>
        </div>

        {/* Protocol 1: Bank Branch */}
        <VerifiedField
          id={id('bankBranch')}
          name="bankBranch"
          label="Bank branch *"
          value={values.bankBranch}
          error={errors.bankBranch}
          placeholder="e.g. Egerton Branch / Nakuru West"
          onChange={(v) => onChange('bankBranch', v)}
          required
        />

        {/* Protocol 2: Bank Name */}
        <VerifiedField
          id={id('bankName')}
          name="bankName"
          label="Bank name *"
          value={values.bankName}
          error={errors.bankName}
          placeholder="e.g. Kenya Commercial Bank"
          onChange={(v) => onChange('bankName', v)}
          required
        />

        {/* Protocol 3: Account Number */}
        <VerifiedField
          id={id('accountNumber')}
          name="accountNumber"
          label="Account number *"
          value={values.accountNumber}
          error={errors.accountNumber}
          placeholder="e.g. 1102345678"
          onChange={(v) => onChange('accountNumber', v)}
          required
        />
      </div>
    </div>
  );
}
