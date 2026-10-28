import React, { useMemo } from 'react';
import { INCOME_OPTIONS, PARENT_STATUS_OPTIONS } from '../../lib/household.js';
import { VerifiedField } from './VerifiedField.jsx';

export function validateFamilyData(values = {}) {
  const errors = {};
  const totalRaw = values.childrenInFamily !== undefined && values.childrenInFamily !== '' ? Number(values.childrenInFamily) : null;
  const inSchoolRaw = values.childrenInSchool !== undefined && values.childrenInSchool !== '' ? Number(values.childrenInSchool) : null;
  const primRaw = values.childrenPrimary !== undefined && values.childrenPrimary !== '' ? Number(values.childrenPrimary) : 0;
  const secRaw = values.childrenSecondary !== undefined && values.childrenSecondary !== '' ? Number(values.childrenSecondary) : 0;
  const tertRaw = values.childrenTertiary !== undefined && values.childrenTertiary !== '' ? Number(values.childrenTertiary) : 0;

  if (totalRaw === null || isNaN(totalRaw)) {
    errors.childrenInFamily = 'Children in the family is required.';
  } else if (totalRaw < 0) {
    errors.childrenInFamily = 'Number of children cannot be negative.';
  } else if (totalRaw < 1) {
    errors.childrenInFamily = 'Must be at least 1 child in the family.';
  }

  if (inSchoolRaw !== null && !isNaN(inSchoolRaw)) {
    if (inSchoolRaw < 0) {
      errors.childrenInSchool = 'Children in school cannot be negative.';
    } else if (totalRaw !== null && inSchoolRaw > totalRaw) {
      errors.childrenInSchool = `Cannot exceed total children in the family (${totalRaw}).`;
    }
  }

  if (primRaw < 0) errors.childrenPrimary = 'Cannot be negative.';
  if (secRaw < 0) errors.childrenSecondary = 'Cannot be negative.';
  if (tertRaw < 0) errors.childrenTertiary = 'Cannot be negative.';

  const cumulativeLevels = primRaw + secRaw + tertRaw;
  const effectiveMax = inSchoolRaw !== null && !isNaN(inSchoolRaw) && inSchoolRaw > 0
    ? inSchoolRaw
    : (totalRaw !== null && !isNaN(totalRaw) && totalRaw > 0 ? totalRaw : null);

  if (effectiveMax !== null && cumulativeLevels > effectiveMax) {
    const errorMsg = `Cumulative school levels (${cumulativeLevels}) exceed maximum allowed (${effectiveMax}).`;
    if (!errors.childrenPrimary && primRaw > 0) errors.childrenPrimary = errorMsg;
    if (!errors.childrenSecondary && secRaw > 0) errors.childrenSecondary = errorMsg;
    if (!errors.childrenTertiary && tertRaw > 0) errors.childrenTertiary = errorMsg;
    errors.cumulativeLevels = errorMsg;
  }

  const status = values.parentStatus || '';
  if (!status) {
    errors.parentStatus = 'Please select parents in the household.';
  }

  const isBoth = status === 'both' || status === 'both_alive';
  const isSingle = status === 'single' || status === 'single_parent' || status === 'father_deceased' || status === 'mother_deceased';
  const isOrphan = status === 'orphan' || status === 'both_deceased';

  if (isBoth) {
    if (!String(values.fatherOccupation || '').trim()) {
      errors.fatherOccupation = "Father's occupation is required.";
    }
    if (!String(values.motherOccupation || '').trim()) {
      errors.motherOccupation = "Mother's occupation is required.";
    }
  } else if (isSingle) {
    if (!String(values.parentOccupation || values.fatherOccupation || values.motherOccupation || '').trim()) {
      errors.parentOccupation = "Parent's occupation is required.";
    }
  } else if (isOrphan) {
    if (!String(values.guardianOccupation || values.fatherOccupation || values.motherOccupation || '').trim()) {
      errors.guardianOccupation = "Guardian's occupation is required.";
    }
  }

  if (!values.monthlyIncome) {
    errors.monthlyIncome = 'Please select approximate monthly income.';
  }
  if (!values.disability) {
    errors.disability = 'Please specify disability status.';
  } else if (values.disability === 'yes' && !String(values.disabilityNote || '').trim()) {
    errors.disabilityNote = 'Describe the disability and the support needed.';
  }
  if (!values.otherBursary) {
    errors.otherBursary = 'Please select other bursary status.';
  }

  return errors;
}

export function FamilyFields({ values = {}, onChange, errors = {}, idPrefix = 'fam-' }) {
  const id = (name) => `${idPrefix}${name}`;

  // Instant local validation calculations
  const totalChildren = values.childrenInFamily !== undefined && values.childrenInFamily !== '' ? Number(values.childrenInFamily) : null;
  const inSchool = values.childrenInSchool !== undefined && values.childrenInSchool !== '' ? Number(values.childrenInSchool) : null;
  const prim = values.childrenPrimary !== undefined && values.childrenPrimary !== '' ? Number(values.childrenPrimary) : 0;
  const sec = values.childrenSecondary !== undefined && values.childrenSecondary !== '' ? Number(values.childrenSecondary) : 0;
  const tert = values.childrenTertiary !== undefined && values.childrenTertiary !== '' ? Number(values.childrenTertiary) : 0;
  const cumulativeLevels = prim + sec + tert;
  const maxAllowed = inSchool !== null && inSchool > 0 ? inSchool : (totalChildren !== null ? totalChildren : null);

  const status = values.parentStatus || '';
  const isBoth = status === 'both' || status === 'both_alive';
  const isOrphan = status === 'orphan' || status === 'both_deceased';
  const isSingle = status === 'single' || status === 'single_parent' || status === 'father_deceased' || status === 'mother_deceased';

  const localErrors = useMemo(() => {
    return validateFamilyData(values);
  }, [values]);

  const mergedErrors = { ...localErrors, ...errors };

  function handlePositiveNumber(name, val) {
    if (val === '') {
      onChange(name, '');
      return;
    }
    const clean = String(val).replace(/-/g, '');
    const num = Number(clean);
    if (isNaN(num) || num < 0) {
      onChange(name, '0');
    } else {
      onChange(name, String(num));
    }
  }

  function blockNegativeKeys(e) {
    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
      e.preventDefault();
    }
  }

  return (
    <div className="family-fields-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* SECTION 1: CHILDREN SECTION */}
      <section style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        borderRadius: 14,
        padding: '18px 20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text, #F8FAFC)' }}>
            Children Information
          </h3>
          {maxAllowed !== null && cumulativeLevels > 0 && (
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 20,
              background: cumulativeLevels > maxAllowed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: cumulativeLevels > maxAllowed ? '#EF4444' : '#10B981',
              border: `1px solid ${cumulativeLevels > maxAllowed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
            }}>
              Enrolled: {cumulativeLevels} of {maxAllowed}
            </span>
          )}
        </div>

        {mergedErrors.cumulativeLevels && (
          <div style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            fontSize: 12,
            marginBottom: 14
          }}>
            {mergedErrors.cumulativeLevels}
          </div>
        )}

        {/* Pair 1: Children in family & Children in school side by side */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 14
        }}>
          <div className={`field ${mergedErrors.childrenInFamily ? 'field--invalid' : ''}`} style={{ margin: 0 }}>
            <label htmlFor={id('childrenInFamily')}>
              Children in the family <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              id={id('childrenInFamily')}
              name="childrenInFamily"
              type="number"
              min="0"
              value={values.childrenInFamily ?? ''}
              onChange={(e) => handlePositiveNumber('childrenInFamily', e.target.value)}
              onKeyDown={blockNegativeKeys}
              placeholder="e.g. 3"
              required
              aria-invalid={Boolean(mergedErrors.childrenInFamily)}
              className={`stitch-profile-form__input ${mergedErrors.childrenInFamily ? 'is-invalid' : ''}`}
            />
            {mergedErrors.childrenInFamily ? <p className="field__error-msg">{mergedErrors.childrenInFamily}</p> : null}
          </div>

          <div className={`field ${mergedErrors.childrenInSchool ? 'field--invalid' : ''}`} style={{ margin: 0 }}>
            <label htmlFor={id('childrenInSchool')}>
              Children currently in school
            </label>
            <input
              id={id('childrenInSchool')}
              name="childrenInSchool"
              type="number"
              min="0"
              value={values.childrenInSchool ?? ''}
              onChange={(e) => handlePositiveNumber('childrenInSchool', e.target.value)}
              onKeyDown={blockNegativeKeys}
              placeholder="e.g. 2"
              aria-invalid={Boolean(mergedErrors.childrenInSchool)}
              className={`stitch-profile-form__input ${mergedErrors.childrenInSchool ? 'is-invalid' : ''}`}
            />
            {mergedErrors.childrenInSchool ? <p className="field__error-msg">{mergedErrors.childrenInSchool}</p> : null}
          </div>
        </div>

        {/* Pair 2: Primary & Secondary school side by side */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 14
        }}>
          <div className={`field ${mergedErrors.childrenPrimary ? 'field--invalid' : ''}`} style={{ margin: 0 }}>
            <label htmlFor={id('childrenPrimary')}>
              In primary school
            </label>
            <input
              id={id('childrenPrimary')}
              name="childrenPrimary"
              type="number"
              min="0"
              value={values.childrenPrimary ?? ''}
              onChange={(e) => handlePositiveNumber('childrenPrimary', e.target.value)}
              onKeyDown={blockNegativeKeys}
              placeholder="0"
              aria-invalid={Boolean(mergedErrors.childrenPrimary)}
              className={`stitch-profile-form__input ${mergedErrors.childrenPrimary ? 'is-invalid' : ''}`}
            />
            {mergedErrors.childrenPrimary ? <p className="field__error-msg">{mergedErrors.childrenPrimary}</p> : null}
          </div>

          <div className={`field ${mergedErrors.childrenSecondary ? 'field--invalid' : ''}`} style={{ margin: 0 }}>
            <label htmlFor={id('childrenSecondary')}>
              In secondary school
            </label>
            <input
              id={id('childrenSecondary')}
              name="childrenSecondary"
              type="number"
              min="0"
              value={values.childrenSecondary ?? ''}
              onChange={(e) => handlePositiveNumber('childrenSecondary', e.target.value)}
              onKeyDown={blockNegativeKeys}
              placeholder="0"
              aria-invalid={Boolean(mergedErrors.childrenSecondary)}
              className={`stitch-profile-form__input ${mergedErrors.childrenSecondary ? 'is-invalid' : ''}`}
            />
            {mergedErrors.childrenSecondary ? <p className="field__error-msg">{mergedErrors.childrenSecondary}</p> : null}
          </div>
        </div>

        {/* Pair 3: College/TVET/University */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16
        }}>
          <div className={`field ${mergedErrors.childrenTertiary ? 'field--invalid' : ''}`} style={{ margin: 0 }}>
            <label htmlFor={id('childrenTertiary')}>
              In college, TVET or university
            </label>
            <input
              id={id('childrenTertiary')}
              name="childrenTertiary"
              type="number"
              min="0"
              value={values.childrenTertiary ?? ''}
              onChange={(e) => handlePositiveNumber('childrenTertiary', e.target.value)}
              onKeyDown={blockNegativeKeys}
              placeholder="0"
              aria-invalid={Boolean(mergedErrors.childrenTertiary)}
              className={`stitch-profile-form__input ${mergedErrors.childrenTertiary ? 'is-invalid' : ''}`}
            />
            {mergedErrors.childrenTertiary ? <p className="field__error-msg">{mergedErrors.childrenTertiary}</p> : null}
          </div>
        </div>
      </section>

      {/* SECTION 2: PARENTS & HOUSEHOLD SECTION */}
      <section style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        borderRadius: 14,
        padding: '18px 20px'
      }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 700, color: 'var(--text, #F8FAFC)' }}>
          Parents & Household Details
        </h3>

        {/* Pair 1: Parents in household & Monthly income */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 14
        }}>
          <div className={`field ${mergedErrors.parentStatus ? 'field--invalid' : ''}`} style={{ margin: 0 }}>
            <label htmlFor={id('parentStatus')}>
              Parents in the household <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              id={id('parentStatus')}
              value={values.parentStatus || ''}
              onChange={(e) => onChange('parentStatus', e.target.value)}
              required
              aria-invalid={Boolean(mergedErrors.parentStatus)}
              className={`stitch-profile-form__input ${mergedErrors.parentStatus ? 'is-invalid' : ''}`}
            >
              <option value="">Select status...</option>
              <option value="both">Both parents present</option>
              <option value="single">Single parent</option>
              <option value="orphan">Orphan</option>
              {PARENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {mergedErrors.parentStatus ? <p className="field__error-msg">{mergedErrors.parentStatus}</p> : null}
          </div>

          <div className={`field ${mergedErrors.monthlyIncome ? 'field--invalid' : ''}`} style={{ margin: 0 }}>
            <label htmlFor={id('monthlyIncome')}>
              Approximate monthly income <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              id={id('monthlyIncome')}
              value={values.monthlyIncome || ''}
              onChange={(e) => onChange('monthlyIncome', e.target.value)}
              required
              aria-invalid={Boolean(mergedErrors.monthlyIncome)}
              className={`stitch-profile-form__input ${mergedErrors.monthlyIncome ? 'is-invalid' : ''}`}
            >
              <option value="">Select income range...</option>
              {INCOME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {mergedErrors.monthlyIncome ? <p className="field__error-msg">{mergedErrors.monthlyIncome}</p> : null}
          </div>
        </div>

        {/* Conditional occupations:
            - If both parents: requires both father & mother occupations
            - If single parent: requires 1 parent occupation
            - If orphan / none: requires 1 guardian occupation
        */}
        {isBoth ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 14
          }}>
            <div style={{ margin: 0 }}>
              <VerifiedField
                id={id('fatherOccupation')}
                name="fatherOccupation"
                label="Father's occupation *"
                required={true}
                value={values.fatherOccupation}
                error={mergedErrors.fatherOccupation}
                onChange={(v) => onChange('fatherOccupation', v)}
                placeholder="e.g. Farmer, Trader, Employed"
              />
            </div>

            <div style={{ margin: 0 }}>
              <VerifiedField
                id={id('motherOccupation')}
                name="motherOccupation"
                label="Mother's occupation *"
                required={true}
                value={values.motherOccupation}
                error={mergedErrors.motherOccupation}
                onChange={(v) => onChange('motherOccupation', v)}
                placeholder="e.g. Business, Teacher, Homemaker"
              />
            </div>
          </div>
        ) : isOrphan ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 14
          }}>
            <div style={{ margin: 0 }}>
              <VerifiedField
                id={id('guardianOccupation')}
                name="guardianOccupation"
                label="Guardian's occupation *"
                required={true}
                value={values.guardianOccupation}
                error={mergedErrors.guardianOccupation}
                onChange={(v) => {
                  onChange('guardianOccupation', v);
                  onChange('fatherOccupation', v);
                }}
                placeholder="e.g. Business, Farmer, Employed"
              />
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 14
          }}>
            <div style={{ margin: 0 }}>
              <VerifiedField
                id={id('parentOccupation')}
                name="parentOccupation"
                label="Parent's occupation *"
                required={true}
                value={values.parentOccupation || values.fatherOccupation || values.motherOccupation}
                error={mergedErrors.parentOccupation}
                onChange={(v) => {
                  onChange('parentOccupation', v);
                  onChange('fatherOccupation', v);
                }}
                placeholder="e.g. Farmer, Trader, Employed"
              />
            </div>
          </div>
        )}

        {/* Pair 3: Disability & Other Bursary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: values.disability === 'yes' ? 14 : 0
        }}>
          <div className={`field ${mergedErrors.disability ? 'field--invalid' : ''}`} style={{ margin: 0 }}>
            <label htmlFor={id('disability')}>
              Family member has disability <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              id={id('disability')}
              value={values.disability || ''}
              onChange={(e) => onChange('disability', e.target.value)}
              required
              aria-invalid={Boolean(mergedErrors.disability)}
              className={`stitch-profile-form__input ${mergedErrors.disability ? 'is-invalid' : ''}`}
            >
              <option value="">Select option...</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
            {mergedErrors.disability ? <p className="field__error-msg">{mergedErrors.disability}</p> : null}
          </div>

          <div className={`field ${mergedErrors.otherBursary ? 'field--invalid' : ''}`} style={{ margin: 0 }}>
            <label htmlFor={id('otherBursary')}>
              Already receiving other bursary <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              id={id('otherBursary')}
              value={values.otherBursary || ''}
              onChange={(e) => onChange('otherBursary', e.target.value)}
              required
              aria-invalid={Boolean(mergedErrors.otherBursary)}
              className={`stitch-profile-form__input ${mergedErrors.otherBursary ? 'is-invalid' : ''}`}
            >
              <option value="">Select option...</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
            {mergedErrors.otherBursary ? <p className="field__error-msg">{mergedErrors.otherBursary}</p> : null}
          </div>
        </div>

        {values.disability === 'yes' ? (
          <div style={{ marginTop: 14 }}>
            <VerifiedField
              id={id('disabilityNote')}
              name="disabilityNote"
              label="Who, and what support they need *"
              value={values.disabilityNote}
              error={mergedErrors.disabilityNote}
              onChange={(v) => onChange('disabilityNote', v)}
              placeholder="e.g. Eldest child has physical disability, requires specialized mobility support."
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
