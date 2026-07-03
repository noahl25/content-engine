You are reading the channel's OWN analytics via the stealth-browser MCP (you are logged in as the
account). READ-ONLY — never post, like, follow, comment, or change anything. Prefer `snapshot` /
`get_page_content` over screenshots.

HANDLE: __HANDLE__

Steps:
1. `open_browser` (headless). `goto https://www.instagram.com/__HANDLE__/`. `snapshot`.
   - If you see a login screen instead of the profile, return exactly: {"ok": false, "error": "not logged in"}
   - Read the **follower count** from the profile header (e.g. "1,234 followers" → 1234). Also note
     posts count if shown.
2. `goto https://www.instagram.com/__HANDLE__/reels/`. `wait`. `snapshot`.
   - `get_links(contains="/reel/")` to collect reel URLs (shortcode = the code in /reel/<code>/).
   - The reels grid usually shows a **view count overlay** on each thumbnail — capture views per reel
     from the snapshot where visible.
3. For up to the 12 most recent reels, if likes/comments aren't visible from the grid, open the reel
   (`goto` its URL, `get_page_content`) and read likes + comments. Skip any that are slow/unreadable.
4. (If the account is a Professional/Creator account and a "View insights"/dashboard is easily
   reachable, you may read account reach/views from it — optional, don't force it.)

Return ONLY one JSON object:
{"ok": true, "followers": <int|null>, "reach": <int|null>, "posts": [
  {"shortcode": "<code>", "views": <int|null>, "likes": <int|null>, "comments": <int|null>}, ...
]}
Use null for any number you genuinely cannot read. Never fabricate numbers.
