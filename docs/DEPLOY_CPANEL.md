# cPanel Deploy: Frontend Build Assets

This guide updates only the built frontend assets after local changes (e.g., memory optimization) without touching server PHP.

## Prerequisites
- Site already deployed under `public_html/app` and running.
- Latest build produced locally in `public/build`.

## Option A — Upload Zip via File Manager
1. Create zip locally containing `public/build` contents. The assistant generated:
   - `deployment/build_assets_2025-12-17.zip`
2. Log in to cPanel → File Manager.
3. Navigate to `public_html/app/public`.
4. Upload `build_assets_2025-12-17.zip`.
5. Extract the zip in `public_html/app/public`.
6. Ensure the extracted `build` directory replaces the existing one (use Rename/Move if needed).
7. Clear browser cache or do a hard refresh.

## Option B — cPanel Git Version Control (if configured)
If the server pulls from GitHub:
1. Push changes to GitHub (already done).
2. In cPanel → Git Version Control, open the repository.
3. Click **Pull** to fetch latest commit.
4. Confirm that the document root points to `public_html/app/public` and assets refresh.

## Notes
- `package.json` and `vite.config.js` changes only affect local builds; the server needs updated `public/build` outputs.
- No PHP/Laravel changes are required for these memory optimizations.
- If encountering stale assets, remove old `public_html/app/public/build` before extracting.
