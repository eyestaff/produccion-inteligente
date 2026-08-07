with open('worker/router.ts', 'r') as f:
    content = f.read()

if "handleInventoryRoute" not in content:
    content = content.replace("import { handleRecipesRoute } from './routes/recipes.routes';", 
                              "import { handleRecipesRoute } from './routes/recipes.routes';\nimport { handleInventoryRoute } from './routes/inventory.routes';")

if "await handleInventoryRoute" not in content:
    content = content.replace("  response = await handleRecipesRoute(pathname, request, env, authContext);\n  if (response) return response;",
                              "  response = await handleRecipesRoute(pathname, request, env, authContext);\n  if (response) return response;\n\n  response = await handleInventoryRoute(pathname, request, env, authContext);\n  if (response) return response;")

with open('worker/router.ts', 'w') as f:
    f.write(content)
