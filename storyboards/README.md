# storyboards/ — EXAMPLE storyboards

These JSON files are **examples** kept for reference — they show the storyboard schema and the kind of
scripting/scene composition the engine produces (see `prompts/ideate.md` for the full schema).

They are **not** live config. During a normal run the producer agent writes a fresh
`storyboards/<slug>.json` for whatever topic it's making, then `build_storyboard.py` turns it into the
render props. The handle in these examples is a placeholder (`@yourhandle`) — your real handle comes
from `config.json` (`channel.handle`). Feel free to delete these once you've got the hang of the shape.
