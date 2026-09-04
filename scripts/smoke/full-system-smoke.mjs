const apiBaseUrl = (process.env.API_BASE_URL ?? 'http://127.0.0.1:5000').replace(/\/$/, '')
const frontendUrl = (process.env.FRONTEND_URL ?? 'http://127.0.0.1:4173').replace(/\/$/, '')

async function request(url, options = {}) {
  const response = await fetch(url, options)
  const body = await response.text()
  return { response, body }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function main() {
  console.log(`Testing API: ${apiBaseUrl}`)
  console.log(`Testing frontend: ${frontendUrl}`)

  const health = await request(`${apiBaseUrl}/health`)
  assert(health.response.ok, `API health check failed: HTTP ${health.response.status}`)
  console.log('✓ API health endpoint is responding')

  const login = await request(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  })
  assert(login.response.ok, `Admin login failed: HTTP ${login.response.status}: ${login.body}`)

  let session
  try {
    session = JSON.parse(login.body)
  } catch {
    throw new Error('Admin login returned invalid JSON')
  }

  assert(typeof session.accessToken === 'string' && session.accessToken.length > 0, 'Login response did not contain an access token')
  assert(Array.isArray(session.roles), 'Login response did not contain roles')
  console.log(`✓ API authentication works (roles: ${session.roles.join(', ')})`)

  const authenticatedHealth = await request(`${apiBaseUrl}/health`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  })
  assert(authenticatedHealth.response.ok, `Authenticated API request failed: HTTP ${authenticatedHealth.response.status}`)
  console.log('✓ Authenticated API request succeeds')

  const frontend = await request(frontendUrl)
  assert(frontend.response.ok, `Frontend request failed: HTTP ${frontend.response.status}`)
  assert(frontend.body.includes('<div id="root"></div>'), 'Frontend HTML does not contain the React root element')
  assert(frontend.body.includes('<script'), 'Frontend HTML does not reference a JavaScript entry point')
  console.log('✓ Frontend is serving the built application shell')

  const scriptMatches = [...frontend.body.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)]
  assert(scriptMatches.length > 0, 'Frontend did not expose built JS/CSS assets')

  for (const match of scriptMatches) {
    const assetPath = match[1].startsWith('http') ? match[1] : `${frontendUrl}/${match[1].replace(/^\//, '')}`
    const asset = await request(assetPath)
    assert(asset.response.ok, `Frontend asset failed: ${assetPath} (HTTP ${asset.response.status})`)
  }
  console.log(`✓ Frontend assets are reachable (${scriptMatches.length} checked)`)

  console.log('FULL SYSTEM SMOKE TEST PASSED')
}

main().catch(error => {
  console.error(`FULL SYSTEM SMOKE TEST FAILED: ${error.message}`)
  process.exitCode = 1
})
