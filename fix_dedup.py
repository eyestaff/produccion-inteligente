with open('worker/db/repositories.ts', 'r') as f:
    lines = f.readlines()

out_lines = []
for i, line in enumerate(lines):
    if "const companyId = typeof ctx === 'number' ? ctx : ctx.companyId;" in line:
        # Check if the previous line or line before that was the same
        if i > 0 and "const companyId = typeof ctx === 'number' ? ctx : ctx.companyId;" in lines[i-1]:
            continue
        if i > 1 and "const companyId = typeof ctx === 'number' ? ctx : ctx.companyId;" in lines[i-2]:
            continue
        # Also check if we already have it in the last few appended lines
        if len(out_lines) > 0 and "const companyId =" in out_lines[-1]:
            continue
        if len(out_lines) > 1 and "const companyId =" in out_lines[-2]:
            continue
    out_lines.append(line)

with open('worker/db/repositories.ts', 'w') as f:
    f.writelines(out_lines)
