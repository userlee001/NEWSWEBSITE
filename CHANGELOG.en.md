# Changelog

## [2.2.0] - 2026-06-01 

### Added
- **Administrator Panel**: Introduced the `administrator-panel` frontend, providing administrators with a visual graphical user interface (GUI) for more intuitive and convenient system management.

## [2.1.0] - 2026-05-29

### Added
- Introduced `audit_log` table for system-wide action tracking
- Introduced `audit_log_target_information` table for tracking affected data entities
- Added audit logging for authentication flows:
  - User registration
  - User login
- Added audit logging for writer operations:
  - Create news
  - Update news
  - Delete news
- Added audit logging for news-related operations, including:
  - Metadata changes
  - Passage/content updates

### Changed
- Enhanced backend middleware to support post-response audit logging via `response.on("finish")`
- Standardized audit payload structure using `response.locals.audit`

### Notes
- All audit logs are recorded asynchronously after response completion
- Target information is stored as relational mappings between actions and affected database entities

### Security
- Audit logs include user identification, IP address, and user-agent for traceability

## [2.0.1] - 2026-05-28

### Fixed
- Fix writer/list navigation issue when clicking news item
- Fix writer/update page not displaying existing cover image