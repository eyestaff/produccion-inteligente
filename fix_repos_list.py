import re

with open('worker/db/repositories.ts', 'r') as f:
    content = f.read()

content = re.sub(r'export async function (list[A-Za-z0-9_]+)\(db: Database\)', r'export async function \1(db: Database, companyId: number)', content)

with open('worker/db/repositories.ts', 'w') as f:
    f.write(content)
