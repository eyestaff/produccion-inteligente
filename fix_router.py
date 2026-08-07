with open('worker/router.ts', 'r') as f:
    content = f.read()

if "handleRecipesRoute" not in content:
    content = content.replace("import { handleProductsRoute } from './routes/products.routes';", 
                              "import { handleProductsRoute } from './routes/products.routes';\nimport { handleRecipesRoute } from './routes/recipes.routes';")
    
if "await handleRecipesRoute" not in content:
    content = content.replace("  response = await handleProductsRoute(pathname, request, env, authContext);\n  if (response) return response;",
                              "  response = await handleProductsRoute(pathname, request, env, authContext);\n  if (response) return response;\n\n  response = await handleRecipesRoute(pathname, request, env, authContext);\n  if (response) return response;")

with open('worker/router.ts', 'w') as f:
    f.write(content)
