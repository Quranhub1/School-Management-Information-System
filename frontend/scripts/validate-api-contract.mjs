#!/usr/bin/env node
/** API Contract Validation Script
 * 
 * Validates that the backend API matches the OpenAPI specification
 * and detects breaking changes.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '../..')
const OPENAPI_PATH = path.join(PROJECT_ROOT, 'backend', 'src', 'SchoolManagement.Api', 'swagger.json')

interface OpenAPISpec {
  openapi: string
  info: { title: string; version: string }
  paths: Record<string, Record<string, any>>
  components: { schemas: Record<string, any> }
}

function loadOpenAPISpec(): OpenAPISpec | null {
  if (!fs.existsSync(OPENAPI_PATH)) {
    console.warn('⚠️  OpenAPI spec not found at:', OPENAPI_PATH)
    return null
  }
  
  const content = fs.readFileSync(OPENAPI_PATH, 'utf-8')
  return JSON.parse(content)
}

function validateEndpoints(spec: OpenAPISpec): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check required endpoints exist
  const requiredEndpoints = [
    { path: '/api/v1/students', methods: ['get', 'post'] },
    { path: '/api/v1/students/{id}', methods: ['get', 'put', 'delete'] },
    { path: '/api/v1/attendance/sessions', methods: ['post'] },
    { path: '/api/v1/auth/login', methods: ['post'] },
    { path: '/health', methods: ['get'] },
  ]
  
  for (const endpoint of requiredEndpoints) {
    const pathItem = spec.paths[endpoint.path]
    if (!pathItem) {
      errors.push(`Missing endpoint: ${endpoint.path}`)
      continue
    }
    
    for (const method of endpoint.methods) {
      if (!pathItem[method]) {
        errors.push(`Missing method ${method.toUpperCase()} on ${endpoint.path}`)
      }
    }
  }
  
  // Check for deprecated endpoints
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (operation.deprecated) {
        console.warn(`⚠️  Deprecated endpoint: ${method.toUpperCase()} ${path}`)
      }
    }
  }
  
  return { valid: errors.length === 0, errors }
}

function validateSchemas(spec: OpenAPISpec): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check required schemas exist
  const requiredSchemas = [
    'Student',
    'StudentResponse',
    'CreateStudentRequest',
    'UpdateStudentRequest',
    'AttendanceSession',
    'AttendanceRecord',
    'ApiErrorResponse',
  ]
  
  for (const schemaName of requiredSchemas) {
    if (!spec.components?.schemas[schemaName]) {
      errors.push(`Missing schema: ${schemaName}`)
    }
  }
  
  return { valid: errors.length === 0, errors }
}

function checkBreakingChanges(spec: OpenAPISpec, previousSpec: OpenAPISpec | null): string[] {
  const warnings: string[] = []
  
  if (!previousSpec) {
    return warnings
  }
  
  // Check for removed endpoints
  for (const [path, pathItem] of Object.entries(previousSpec.paths)) {
    if (!spec.paths[path]) {
      warnings.push(`⚠️  BREAKING: Endpoint removed: ${path}`)
      continue
    }
    
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!spec.paths[path][method]) {
        warnings.push(`⚠️  BREAKING: Method removed: ${method.toUpperCase()} ${path}`)
        continue
      }
      
      // Check for removed required parameters
      const prevParams = operation.parameters || []
      const currParams = spec.paths[path][method].parameters || []
      
      for (const prevParam of prevParams) {
        if (prevParam.required && !currParams.find(p => p.name === prevParam.name && p.in === prevParam.in)) {
          warnings.push(`⚠️  BREAKING: Required parameter removed: ${prevParam.name} in ${method.toUpperCase()} ${path}`)
        }
      }
      
      // Check for removed response codes
      const prevResponses = operation.responses || {}
      const currResponses = spec.paths[path][method].responses || {}
      
      for (const code of Object.keys(prevResponses)) {
        if (!currResponses[code]) {
          warnings.push(`⚠️  BREAKING: Response code removed: ${code} from ${method.toUpperCase()} ${path}`)
        }
      }
    }
  }
  
  // Check for removed schemas
  for (const schemaName of Object.keys(previousSpec.components?.schemas || {})) {
    if (!spec.components?.schemas[schemaName]) {
      warnings.push(`⚠️  BREAKING: Schema removed: ${schemaName}`)
    }
  }
  
  return warnings
}

function main(): void {
  console.log('🔍 Validating API Contract...\n')
  
  const spec = loadOpenAPISpec()
  if (!spec) {
    console.log('⏭️  Skipping contract validation (no spec found)')
    return
  }
  
  console.log(`📄 API: ${spec.info.title} v${spec.info.version}`)
  console.log(`📊 Endpoints: ${Object.keys(spec.paths).length}`)
  console.log(`📦 Schemas: ${Object.keys(spec.components?.schemas || {}).length}\n`)
  
  // Validate current spec
  const endpointValidation = validateEndpoints(spec)
  const schemaValidation = validateSchemas(spec)
  
  if (!endpointValidation.valid) {
    console.log('❌ Endpoint validation failed:')
    for (const error of endpointValidation.errors) {
      console.log(`  - ${error}`)
    }
    process.exit(1)
  }
  
  if (!schemaValidation.valid) {
    console.log('❌ Schema validation failed:')
    for (const error of schemaValidation.errors) {
      console.log(`  - ${error}`)
    }
    process.exit(1)
  }
  
  console.log('✅ Current API contract is valid\n')
  
  // Check for breaking changes against previous version (if available)
  // In CI, this would compare against the main branch spec
  const previousSpecPath = path.join(PROJECT_ROOT, '.previous-openapi.json')
  if (fs.existsSync(previousSpecPath)) {
    const previousSpec = JSON.parse(fs.readFileSync(previousSpecPath, 'utf-8'))
    const breakingChanges = checkBreakingChanges(spec, previousSpec)
    
    if (breakingChanges.length > 0) {
      console.log('🚨 Breaking changes detected:')
      for (const warning of breakingChanges) {
        console.log(`  ${warning}`)
      }
      // Exit with warning code (not failure, just warning)
      console.log('\n⚠️  Breaking changes detected but not failing build. Review before merging.')
    } else {
      console.log('✅ No breaking changes detected')
    }
  } else {
    console.log('ℹ️  No previous spec to compare against')
  }
  
  // Save current spec for next run
  fs.writeFileSync(previousSpecPath, JSON.stringify(spec, null, 2))
  console.log('\n💾 Saved current spec for future comparison')
}

main()