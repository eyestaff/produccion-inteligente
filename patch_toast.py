with open('frontend/src/ui/AppRoutes.tsx', 'r') as f:
    content = f.read()

if "ToastProvider" not in content:
    content = content.replace("import { LoginPage } from '../pages/Login';", "import { LoginPage } from '../pages/Login';\nimport { ToastProvider } from './ToastProvider';")
    content = content.replace("<Routes>", "<ToastProvider>\n    <Routes>")
    content = content.replace("</Routes>", "</Routes>\n    </ToastProvider>")
    with open('frontend/src/ui/AppRoutes.tsx', 'w') as f:
        f.write(content)
