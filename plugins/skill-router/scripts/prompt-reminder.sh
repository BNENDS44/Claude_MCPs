#!/usr/bin/env bash
# skill-router :: UserPromptSubmit hook
#
# The SessionStart hook primes the session once; this keeps routing alive on
# EVERY turn so it never quietly fades over a long conversation. It is a single
# lightweight line of context — cheap insurance that the right skill fires even
# when neither you nor Claude remembered to ask for it.
#
# To make routing less chatty, delete the "UserPromptSubmit" block from
# hooks.json and the SessionStart priming alone will still drive routing.
cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"[skill-router] Before acting on a non-trivial request, run ROUTE: match it to the best available skill / slash command / subagent / MCP tool and invoke that rather than hand-rolling; append any capability gap to the skill wishlist. Skip for trivial asks."}}
JSON
exit 0
