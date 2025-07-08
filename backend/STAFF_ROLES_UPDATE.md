# Staff Roles Update

This document explains the updates made to support different staff roles (Writers, Supervisors, and Designers) in the Bnusa Platform.

## Changes Made

### 1. User Model Updates

Added the following fields to the User model:

- `isSupervisor` (Boolean): Indicates if the user is a supervisor
- `isDesigner` (Boolean): Indicates if the user is a designer
- `supervisorText` (String): Description of the supervisor's role
- `designsCount` (Number): Count of designs for designers

### 2. API Updates

Updated the `/api/users` endpoint to:

- Include the new staff role fields in the response
- Support filtering by staff role type
- Support text search for staff members

### 3. Indexing

Added MongoDB indexes for the new fields:

- Text index on name, username, and bio fields
- Single field indexes on `isSupervisor` and `isDesigner`

## How to Deploy

1. Apply the code changes to your environment
2. Run the index rebuilding script to create the new indexes:

```bash
node backend/utils/rebuildIndexes.js
```

3. Populate the staff roles for testing:

```bash
node backend/scripts/update-staff-roles.js
```

## API Usage

### Getting All Staff Members

```
GET /api/users?staffOnly=true&limit=100
```

### Filtering by Staff Type

```
GET /api/users?isWriter=true
GET /api/users?isSupervisor=true
GET /api/users?isDesigner=true
```

### Searching Staff Members

```
GET /api/users?staffOnly=true&search=keyword
```

## Front-end Integration

The staff page (`/writers`) should now be able to display all staff types by:

1. Fetching all users with `staffOnly=true`
2. Using the tab system to filter between Writers, Supervisors, and Designers
3. Displaying the appropriate fields for each staff type:
   - Writers: articles count
   - Supervisors: supervisor text
   - Designers: designs count 