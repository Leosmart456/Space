---
name: Blocked dependency chain via @types/nodemailer
description: @types/nodemailer causes blocked AWS SDK / fast-xml-parser install on Replit
---

# Blocked Dependency Chain

## The Rule
Never include `@types/nodemailer` in `package.json` dependencies (or devDependencies). It pulls in `@aws-sdk/client-sesv2` → `@aws-sdk/core` → `@aws-sdk/xml-builder` → `fast-xml-parser`. ALL versions of `fast-xml-parser` are blocked by Replit's security policy due to multiple critical CVEs.

**Why:** `nodemailer@7.x` bundles its own TypeScript types — `@types/nodemailer` is redundant. But its newer versions (7.x) include type definitions for the AWS SES transport, dragging in the entire AWS SDK chain.

**How to apply:** If npm install ever fails with a blocked `fast-xml-parser` error, check `package.json` for `@types/nodemailer` and remove it. Also watch for any package that depends on `@aws-sdk/xml-builder`.
