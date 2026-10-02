import React from 'react';
import { Link } from 'react-router-dom';
import { ParentLayout } from '../components/ParentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';

export function ParentDocumentsPage() {
  return (
    <ParentLayout pageTitle="Documents" layout="dashboard">
      <div className="stitch-docs-header">
        <div className="stitch-docs-header__top">
          <div>
            <h1 className="stitch-docs-header__title">Document center</h1>
            <h1 className="stitch-docs-header__title-mobile">Documents</h1>
            <p className="stitch-docs-header__sub">
              Birth certificates and school papers are stored with each child you register.
            </p>
          </div>
          <Link className="stitch-docs-header__upload-btn" to="/parent/children/new">
            <Icon name="plus" size={18} />
            Add a child
          </Link>
        </div>
      </div>

      <section className="stitch-docs-checklist">
        <div className="stitch-docs-checklist__title-wrap">
          <div className="stitch-docs-checklist__bar" />
          <h2 className="stitch-docs-checklist__title">What you will add</h2>
        </div>
        <div className="stitch-docs-checklist__grid">
          <div className="stitch-docs-checklist__item">
            <Icon name="documents" size={20} />
            <div>
              <p className="stitch-docs-checklist__item-name">Birth certificate</p>
              <p className="stitch-docs-checklist__item-status stitch-docs-checklist__item-status--action">Added when you register a child</p>
            </div>
          </div>
          <div className="stitch-docs-checklist__item">
            <Icon name="profile" size={20} />
            <div>
              <p className="stitch-docs-checklist__item-name">Your national ID</p>
              <p className="stitch-docs-checklist__item-status stitch-docs-checklist__item-status--action">Confirmed in Applications</p>
            </div>
          </div>
          <div className="stitch-docs-checklist__item">
            <Icon name="applications" size={20} />
            <div>
              <p className="stitch-docs-checklist__item-name">School records</p>
              <p className="stitch-docs-checklist__item-status stitch-docs-checklist__item-status--action">Saved on the student record</p>
            </div>
          </div>
        </div>
      </section>

      <div className="notice">
        <strong>No loose files yet</strong>
        <p>Open a child from Home to continue their record, or add a student to upload a birth certificate.</p>
      </div>
    </ParentLayout>
  );
}
