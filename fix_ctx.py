import re

with open('worker/db/repositories.ts', 'r') as f:
    content = f.read()

# Remove the previously added `const companyId = ...` if any
content = re.sub(r"\s*const companyId = typeof ctx === 'number'\? ctx : ctx.companyId;\n", "", content)

# Regex to match function definition ending with `{`
# It might span multiple lines
pattern = re.compile(r'(export async function [A-Za-z0-9_]+\(.*?\)\s*\{)', re.DOTALL)

def replacer(match):
    func_decl = match.group(1)
    if 'ctx: RequestContext | number' in func_decl:
        return func_decl + "\n  const companyId = typeof ctx === 'number' ? ctx : ctx.companyId;"
    return func_decl

content = pattern.sub(replacer, content)

with open('worker/db/repositories.ts', 'w') as f:
    f.write(content)
