# 🛡️ Security Policy

## Supported Versions

| Version | Supported          |
|---------|-------------------|
| 1.x     | ✅ Supported      |

## Reporting a Vulnerability

CISSPEdge takes security seriously. If you discover a security vulnerability, please report it responsibly.

**Do not** report security vulnerabilities through public GitHub issues. Instead, please email the maintainer directly, or open a draft security advisory on GitHub.

### What to Include

- Type of vulnerability
- Steps to reproduce
- Affected versions
- Potential impact
- Suggested fix (if applicable)

### Response Timeline

- **Acknowledgment** — Within 48 hours
- **Initial assessment** — Within 5 business days
- **Fix deployment** — Dependent on severity, typically within 14 days for critical issues

## Security Best Practices

Since CISSPEdge runs entirely client-side (no backend server), security considerations include:

1. **Data Storage** — All user data is stored locally in IndexedDB. No data is transmitted externally.
2. **Dependencies** — Dependencies are kept up-to-date to minimize supply chain risks.
3. **Content Security** — The app does not load external scripts or resources beyond the initial page load.

## Responsible Disclosure

We appreciate the community's help in keeping CISSPEdge secure. Researchers who responsibly disclose vulnerabilities will be credited in our acknowledgments.

---

<p align="center">
  <strong>🛡️ CISSPEdge</strong> — <em>Your Path to CISSP Certification</em>
</p>
