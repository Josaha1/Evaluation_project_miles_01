# Critical Fixes Design — 5 Items
**Date**: 2026-02-28
**Status**: Approved

## Item 1: Remove Debug Endpoints
Remove 6 debug routes from `routes/web.php` and associated controller methods.

## Item 2: Rate Limiting on External Login
Add `throttle:5,1` middleware to `POST /external/login`.

## Item 3: Session Expiry in ExternalAuthMiddleware
Check `created_at + 8 hours` in middleware. Redirect to login if expired.

## Item 4: Dynamic Eval ID Lookup (Remove Hardcoded IDs)
Replace hardcoded `evaluation_id = 1, 3, [4,5]` with dynamic queries using `grade_min`, `grade_max`, `user_type`.

## Item 5: ALTER answers — add external_access_code_id
New migration + model update + controller update to track external evaluator source.
