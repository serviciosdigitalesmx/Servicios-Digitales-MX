import re
path = 'apps/frontend-web/src/app/(public)/register/page.tsx'
with open(path, 'r') as f: content = f.read()

# Reemplazamos el bloque de RPC por la llamada al API
old_rpc = r"const { data: rpcData, error: rpcError } = await supabase\.rpc\('initialize_new_setup', \{.*\}\);"
new_api = """const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          tenantName: formData.tenantName,
          planId: selectedPlan
        })
      });
      const rpcData = await res.json();
      const rpcError = res.ok ? null : { message: rpcData.message || 'Error en registro' };"""

content = re.sub(old_rpc, new_api, content, flags=re.DOTALL)
with open(path, 'w') as f: f.write(content)
