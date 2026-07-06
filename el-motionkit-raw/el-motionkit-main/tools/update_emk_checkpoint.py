#!/usr/bin/env python3
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / '.emk-checkpoint.source.json'
JSON_OUT = ROOT / '.emk-checkpoint.json'
MD_OUT = ROOT / '.emk-checkpoint.md'


def load_source() -> dict:
    data = json.loads(SOURCE.read_text())
    data['updated_at'] = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')
    return data


def write_json(data: dict) -> None:
    JSON_OUT.write_text(json.dumps(data, indent=2) + '\n')


def write_markdown(data: dict) -> None:
    active = data['active_site']
    release = data['release']
    frontend = data['frontend_verification']
    runtime = data['clean_room_runtime']
    status = data['current_status']

    lines: list[str] = []
    lines.append(f"# {data['project']} Checkpoint")
    lines.append('')
    lines.append(f"Updated: {data['updated_at']}")
    lines.append('')
    lines.append('## Active Site')
    lines.append(f"- Name: `{active['name']}`")
    lines.append(f"- Local dir: `{active['local_dir']}`")
    lines.append(f"- Plugin path: `{active['plugin_path']}`")
    lines.append(f"- Public URL: `{active['public_url']}`")
    lines.append('')
    lines.append('## Current Release')
    lines.append(f"- ZIP: `{release['zip']}`")
    lines.append(f"- Deployed to active site: {'yes' if release['deployed_to_active_site'] else 'no'}")
    lines.append('')
    lines.append('## Completed Phases')
    for item in data['completed_phases']:
        lines.append(f"- {item}")
    lines.append('')
    lines.append('## Frontend Verification')
    lines.append(f"- Widget suite URL: `{frontend['widget_suite_url']}`")
    lines.append(f"- Result: `{frontend['widget_suite_result']}`")
    lines.append('- Clean-room Advanced motion verified:')
    for item in frontend['advanced_motion_verified']:
        lines.append(f"  - {item}")
    lines.append('')
    lines.append('## Clean-room Runtime')
    lines.append(f"- Controls file: `{runtime['controls_file']}`")
    lines.append(f"- Runtime file: `{runtime['runtime_file']}`")
    lines.append('- Implemented settings groups:')
    for item in runtime['implemented_controls']:
        lines.append(f"  - `{item}`")
    lines.append('')
    lines.append('## Important QA URLs')
    for item in data['important_urls']:
        lines.append(f"- `{item}`")
    lines.append('')
    lines.append('## Release Status')
    lines.append(f"- `is_pro => true` matches: `{status['is_pro_true_matches']}`")
    lines.append(f"- Forbidden vendor terms in release ZIP: `{status['forbidden_vendor_terms_in_release_zip']}`")
    lines.append(f"- PHP lint in release ZIP: `{status['php_lint_release_zip']}`")
    lines.append(f"- JS syntax for runtime: `{status['js_syntax_release_runtime']}`")
    lines.append('')
    lines.append('## Next Recommended')
    for index, item in enumerate(data['next_recommended'], start=1):
        lines.append(f"{index}. {item}")
    lines.append('')

    MD_OUT.write_text('\n'.join(lines))


def main() -> None:
    data = load_source()
    write_json(data)
    write_markdown(data)
    print(JSON_OUT)
    print(MD_OUT)


if __name__ == '__main__':
    main()
