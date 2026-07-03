You are revising an EXISTING explainer video for the channel based on the user's feedback. You are
given the exact storyboard JSON that produced the video they just watched, plus their change notes.
Apply the changes surgically — keep everything they did NOT ask to change.

## The user's change notes
__NOTES__

## The current storyboard (the video they reviewed)
__STORYBOARD__

## Your job
Output the REVISED storyboard as a single JSON object, SAME schema as the input
(topic, icon, scenes[], caption, hashtags). Rules:
- Change ONLY what the notes call for; preserve the rest (scenes, wording, order) as-is.
- If they ask to cut/add/reorder a scene, do it. If they ask for a punchier hook, rewrite the title
  scene + its narration. If they ask to fix a visual, adjust that scene's props (e.g. canvas layout).
- Keep the same scene types vocabulary (title, statement, compare, layers, nodes, stat, canvas, outro),
  valid Lucide icons, the channel design rules, and the length/caption rules.
- Keep `source_topic` if present.
- You may use WebSearch to check any new fact you introduce.

Output ONLY the revised JSON object — no prose, no fences.
