with open('worker/router.ts', 'r') as f:
    content = f.read()

if "handleProductionRoute" not in content:
    content = content.replace("import { handleInventoryRoute } from './routes/inventory.routes';", 
                              "import { handleInventoryRoute } from './routes/inventory.routes';\nimport { handleProductionRoute } from './routes/production.routes';")

if "await handleProductionRoute" not in content:
    content = content.replace("  response = await handleInventoryRoute(pathname, request, env, authContext);\n  if (response) return response;",
                              "  response = await handleInventoryRoute(pathname, request, env, authContext);\n  if (response) return response;\n\n  response = await handleProductionRoute(pathname, request, env, authContext);\n  if (response) return response;")

with open('worker/router.ts', 'w') as f:
    f.write(content)
