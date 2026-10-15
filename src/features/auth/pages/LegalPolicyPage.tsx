import { Link } from 'react-router-dom'

type LegalPolicyPageProps = {
  type: 'terms' | 'privacy'
}

const privacyContent = `
# Privacy Policy
**Last updated: October 15, 2026**

Upgrate Infotech ("we", "our", or "us") is committed to protecting the privacy and personal information of users of our Human Resource Management (HRM) application. This Privacy Policy explains how we collect, use, store, and protect information when you access or use our HRM platform.

## 1. Information We Collect
Depending on the features enabled in the application, we may collect the following categories of information:

- **Account information:** Name, email address, phone number, profile details, and authentication information.
- **Employee information:** Employee ID, department, designation, employment details, joining date, and reporting manager.
- **Attendance information:** Check-in and check-out records, working hours, attendance history, and related correction requests.
- **Leave information:** Leave type, requested dates, reason for leave, approval status, and relevant comments.
- **Payroll information:** Salary details, payslips, payroll summaries, and related employment records, where applicable.
- **Documents and profile data:** Employee-uploaded documents and other information provided through the application.
- **Usage and technical information:** Browser type, device information, application activity, and diagnostic information, where collected.

## 2. How We Use Your Information
We may use the collected information to:

- Create and manage user accounts and employee profiles.
- Authenticate users and manage role-based access to the Admin and Employee portals.
- Maintain attendance records and working-hour summaries.
- Process leave requests, approvals, and notifications.
- Manage payroll information and payslips where those features are enabled.
- Display company announcements, holidays, and HR-related updates.
- Maintain application security, troubleshoot issues, and improve functionality.
- Meet applicable legal and employment-related obligations.

## 3. Information Sharing
Access to personal information is restricted according to assigned roles and business requirements.

Information may be made available to authorized administrators, HR personnel, managers, or employees when necessary for their respective responsibilities. For example, an authorized approver may access a leave request to review it.

We may also use third-party service providers for hosting, authentication, storage, or other application services when those services are configured. Any actual sharing of information depends on the services used and applicable requirements.

We do not claim to use a particular third-party provider unless that integration is enabled in the application.

## 4. Data Security
We use appropriate technical and organizational measures intended to protect personal information against unauthorized access, alteration, disclosure, or loss.

Access should be limited according to user roles and permissions. However, no application or electronic storage method can guarantee absolute security.

## 5. Data Retention
Personal information is retained for as long as necessary for the purposes for which it was collected, including employment administration, operational requirements, and applicable legal obligations.

Retention and deletion periods depend on the type of record, company requirements, and applicable law. Requests to correct or delete information may be subject to employment, legal, or recordkeeping obligations.

## 6. Your Privacy Rights
Subject to applicable law and company policies, you may request to:

- Access your personal information.
- Correct inaccurate information.
- Obtain a copy of eligible personal records.
- Request deletion of information where permitted.
- Raise concerns about the handling of your personal information.
For privacy-related questions or requests, contact Upgrate Infotech through its designated HR or privacy contact.

## 7. Cookies and Session Information
The application may use essential cookies or similar technologies to maintain login sessions, support authentication, and protect account security.

Analytics or advertising cookies should be described here only if those technologies are actually enabled. Where required, consent will be obtained for non-essential cookies.

## 8. Changes to This Policy
We may update this Privacy Policy when our application, business practices, or legal requirements change. The revised version will display an updated date. Where required, users will be notified of material changes.

## 9. Contact Us
For questions or concerns regarding this Privacy Policy, please contact Upgrate Infotech through its designated HR or privacy contact details.
`

const termsContent = `
# Terms of Use
**Last updated: October 15, 2026**

Welcome to the Human Resource Management (HRM) application provided by Upgrate Infotech ("we", "our", or "us"). These Terms of Use govern your access to and use of our HRM platform. By accessing or using the application, you agree to comply with these terms.

## 1. Purpose of the Application
The HRM application is designed to support employee and administrative activities, including employee records, attendance, leave management, payroll information, announcements, and other HR-related operations.

Available features may vary depending on your assigned role and the features enabled by the organization.

## 2. User Accounts and Access

- Users must provide accurate information when using the application.
- Users are responsible for keeping their login credentials and authentication codes confidential.
- Users must not share their accounts or allow unauthorized individuals to access them.
- Access to the Admin Portal and Employee Portal is controlled by assigned roles and permissions.
- Users must notify the appropriate company representative if they suspect unauthorized access to their account.

## 3. Acceptable Use
You agree to use the application only for legitimate business and employment-related purposes.

You must not:

- Access information or features without authorization.
- View, copy, modify, or disclose another employee's confidential information without permission.
- Upload malicious files or attempt to compromise the application's security.
- Misuse attendance, leave, payroll, or employee-management features.
- Interfere with the application's operation or attempt to bypass access controls.

## 4. Employee Information and Records
Users must provide accurate information when submitting or updating employee details, attendance records, leave requests, and other HR-related information.

Employees should review their records and report inaccuracies through the appropriate HR process.

The organization may review and maintain HR records for legitimate employment, administrative, operational, and legal purposes, subject to applicable policies and laws.

## 5. Attendance and Leave Management

- Users must record attendance honestly and according to company procedures.
- Employees must submit leave requests through the available application workflow.
- Leave requests may require approval from an authorized manager or HR representative.
- Submission of a leave request does not automatically mean that the leave has been approved.
- Attendance corrections and leave disputes should be reported to the appropriate authorized person.

## 6. Payroll Information
Payroll information displayed in the application is intended for authorized employment-related use.

Users must not access, disclose, or misuse another person's salary information without authorization. Payroll calculations, payment records, and payslips are subject to the organization's applicable payroll policies and processes.

Displaying payroll information in the application does not, by itself, confirm that a payment has been processed.

## 7. Confidentiality and Data Protection
Users must handle employee information, salary details, documents, and other confidential business information responsibly.

Upgrate Infotech will handle personal information according to its applicable privacy practices and Privacy Policy. Access to information should be limited to authorized users for legitimate purposes.

## 8. Notifications and Announcements
The application may display notifications relating to leave decisions, announcements, attendance requests, and other HR activities.

Users should review relevant notifications and follow any instructions provided through official company channels. Notifications are intended to support communication and do not replace formal company policies or legally required communications.

## 9. Application Availability and Changes
We aim to maintain the availability and functionality of the application but cannot guarantee uninterrupted access at all times.

Features may be updated, modified, temporarily unavailable, or discontinued for maintenance, security, operational, or business reasons.

## 10. Intellectual Property
The application's design, source code, branding, and other materials are owned by or used under authorization by their respective rights holders. Users may not copy, distribute, modify, or commercially exploit these materials without appropriate authorization.

## 11. Suspension or Restriction of Access
Access may be restricted or suspended when necessary to protect application security, investigate suspected misuse, comply with legal requirements, or enforce applicable company policies.

Any employment-related decisions remain subject to the organization's applicable procedures and laws.

## 12. Limitation of Responsibility
The application is a tool for HR administration and record management. Users should report suspected errors in attendance, leave, payroll, or employee information through the appropriate company process.

Nothing in these terms excludes or limits any responsibility that cannot legally be excluded or limited under applicable law.

## 13. Changes to These Terms
We may update these Terms of Use to reflect changes to the application, company procedures, or applicable legal requirements. The latest version will display its effective date. Where required, users will be notified of material changes.

## 14. Governing Law
These Terms of Use are subject to applicable laws of India, to the extent applicable. Any disputes will be handled in accordance with applicable law and the relevant contractual arrangements.

## 15. Contact Us
For questions about these Terms of Use, please contact Upgrate Infotech through its designated HR, administrative, or legal contact channel.
`

function renderPolicyMarkdown(markdown: string) {
  return markdown
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- \*\*(.*?):\*\* (.*)$/gm, '<li><strong>$1:</strong> $2</li>')
    .replace(/^(?:\n|\r\n)+|(?:\n|\r\n)+$/g, '')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />')
    .replace(/<p>(<li>)/g, '<ul>$1')
    .replace(/(<\/li>)(?![\s\S]*<li>)/g, '$1</ul>')
    .replace(/<p><h1>/g, '<h1>')
    .replace(/<\/h1><\/p>/g, '</h1>')
    .replace(/<p><h2>/g, '<h2>')
    .replace(/<\/h2><\/p>/g, '</h2>')
    .replace(/<p><ul>/g, '<ul>')
    .replace(/<\/ul><\/p>/g, '</ul>')
}

export function LegalPolicyPage({ type }: LegalPolicyPageProps) {
  const isTerms = type === 'terms'
  const title = isTerms ? 'Terms of Use' : 'Privacy Policy'
  const lastUpdated = 'October 15, 2026'
  const content = isTerms ? renderPolicyMarkdown(termsContent) : renderPolicyMarkdown(privacyContent)

  return (
    <div className="auth-screen">
      <div className="auth-screen__card" style={{ maxWidth: 1000, width: '100%', padding: '32px 28px' }}>
        <div className="auth-screen__eyebrow">Legal information</div>
        <h1 className="auth-screen__title" style={{ marginBottom: 8 }}>{title}</h1>
        <p className="auth-screen__description" style={{ marginBottom: 24 }}>
          Last updated: {lastUpdated}
        </p>

        <div
          className="legal-policy-content"
          dangerouslySetInnerHTML={{ __html: content }}
          style={{
            color: '#1e293b',
            lineHeight: 1.8,
            display: 'grid',
            gap: 16,
            fontSize: 15,
          }}
        />

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/login" className="button button--primary" style={{ textDecoration: 'none' }}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
