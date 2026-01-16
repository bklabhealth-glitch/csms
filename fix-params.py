import re
from pathlib import Path

# List of files to fix
files_to_fix = [
    "app/api/items/[id]/route.ts",
    "app/api/suppliers/[id]/route.ts",
    "app/api/stock-in/[id]/route.ts",
    "app/api/stock-out/[id]/route.ts",
    "app/api/stock-out/[id]/approve/route.ts",
]

def fix_file(file_path):
    """Fix params type and add await params in a Next.js API route file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match function signatures with params
    # Match: export async function VERB(\n  request: NextRequest,\n  { params }: { params: { id: string } }\n) {
    pattern = r'(export async function \w+\(\s*request: NextRequest,\s*)\{ params \}: \{ params: \{ id: string \} \}(\s*\)\s*\{)'

    # Replace with Promise type
    replacement = r'\1{ params }: { params: Promise<{ id: string }> }\2'
    content = re.sub(pattern, replacement, content)

    # Now add await params after the opening brace of each function
    # We need to find each function and add the await after auth check

    # Split into functions and process each
    lines = content.split('\n')
    result_lines = []
    in_function = False
    added_await = False

    for i, line in enumerate(lines):
        result_lines.append(line)

        # Check if we're entering a function that uses params
        if re.match(r'export async function \w+\(', line):
            in_function = True
            added_await = False

        # Add await params after the session check
        if in_function and not added_await:
            # Look for the pattern after session check
            if 'const session = await getServerSession' in line:
                # Find the closing of the auth check (next 5 lines)
                j = i + 1
                while j < len(lines) and j < i + 6:
                    if '}' in lines[j] and 'session' not in lines[j]:
                        # Insert await params after this line
                        result_lines.append('')
                        result_lines.append('    // Await params (Next.js 15 requirement)')
                        result_lines.append('    const { id } = await params;')
                        added_await = True
                        in_function = False
                        break
                    j += 1

    # Now replace all params.id with just id
    final_content = '\n'.join(result_lines)
    final_content = re.sub(r'params\.id\b', 'id', final_content)

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(final_content)

    print(f"Fixed: {file_path}")

# Fix each file
for file_path in files_to_fix:
    full_path = Path("d:/Stock/csms") / file_path
    if full_path.exists():
        fix_file(str(full_path))
    else:
        print(f"Not found: {full_path}")

print("\nDone! All files have been fixed.")
