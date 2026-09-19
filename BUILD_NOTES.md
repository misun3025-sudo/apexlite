# Build notes

## `_work/` is a local-only generator, not part of the deployed build

- `_work/*.py` (`build.py` and friends) generates every `index.html` in this repo. It is **not** run by Vercel — `vercel.json` has no `buildCommand`, so Vercel serves the committed HTML files as static output.
- `_work/` is listed in `.gitignore`, so none of the generator source is tracked in git. Changes to `_work/*.py` exist only on whichever machine made them, and are invisible to `git log`/`git diff`/PR review.
- Practical consequence: **the generator and the deployed HTML can silently drift apart.** If someone edits `_work/*.py` and doesn't run `build.py` + commit the output, or edits the generated HTML by hand without updating `_work/*.py`, the two fall out of sync. Since `_work/` isn't tracked, there is no diff to flag this — the only way to notice is to actually run `build.py` and diff its output against the committed HTML.
- This exact drift happened between commit `6678d13` (EN site restructure: flat nav, unified contact form, remote-service messaging, short home-card titles, About credits restructuring, copy fixes) and the generator: `6678d13` only touched the generated `en/*.html` files directly, never `_work/*.py`. Running `build.py` afterward silently reverted all of that EN work back to the pre-restructure version.

## Sync status

- Synced against deployed `HEAD` as of commit `85c38ff` (2026-09-20). At that point, running `python _work/build.py` and diffing the output against the committed HTML produced **no differences** except `llms.txt`, which regenerated with corrected wording (`"Overall lighting design and on-site direction"` / `"Lighting design and on-site operation"`) that already matched every other page on the site — the old `llms.txt` text was itself stale relative to the rest of the deployed site.
- If you edit `_work/*.py` in the future: **always run `python _work/build.py` and `git diff` immediately after**, before committing. If the diff includes files or sections you didn't intend to touch, the generator has drifted from deployment again and needs another reconciliation pass like this one before you trust its output.
- If you edit deployed HTML by hand (bypassing the generator) again in the future, the same drift will recur. Prefer editing `_work/*.py` and regenerating, even for small copy fixes, so `_work/` and deployment don't diverge.
