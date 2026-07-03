#!/bin/bash
# keep exactly ONE Telegram long-poll listener alive (flock-guarded against races)
exec 9>/tmp/bytesized_listener.lock
flock -n 9 || exit 0
pgrep -f "telegram_poll.py --loop" >/dev/null && exit 0
cd ~/claude/content-engine
setsid /usr/bin/python3 scripts/telegram_poll.py --loop >> memory/listener.log 2>&1 < /dev/null &
