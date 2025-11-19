# Testing Setup

This project uses Vitest and Vue Test Utils for automated testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are organized in a separate `tests/` folder that mirrors the source code structure:

```
tests/
├── components/
│   ├── InputTextFieldComponent.test.js
│   ├── TextareaComponent.test.js
│   └── SidebarComponent.test.js
├── services/
│   └── aiService.test.js
└── stores/
    └── faction.test.js
```

## What's Tested

### Store Tests (`faction.test.js`)
- Default state initialization
- Reset functionality
- Loading faction data
- Exporting faction data
- Data integrity through export/load cycles

### Service Tests (`aiService.test.js`)
- API key detection and validation
- AI content generation
- Generation state management
- Error handling

### Component Tests
- **InputTextFieldComponent**: Props, events, identifiers, rendering
- **TextareaComponent**: Props, events, auto-resize, rendering
- **SidebarComponent**: 
  - Save/load functionality
  - Version history management
  - Export functionality
  - Data clearing with confirmation

## Test Coverage

Current test coverage: **55 passing tests** across:
- 6 store tests
- 12 service tests
- 37 component tests

## Configuration

Testing is configured in `vitest.config.js`:
- Environment: happy-dom (lightweight DOM implementation)
- Coverage provider: v8
- Single-threaded execution for stability
- Custom setup file (`vitest.setup.js`) to handle known happy-dom + Vue reactivity issues

### Known Console Output

Some stderr/stdout messages may appear during test execution - these are intentional:
- **"Error checking API key from localStorage"** - Part of error handling tests
- **"Error generating with AI"** - Tests AI error scenarios
- **"AI Prompt:"** - Debugging output from AI service tests

These messages indicate the tests are properly validating error cases and do not represent test failures.

## Dependencies

- `vitest` - Test runner
- `@vue/test-utils` - Vue component testing utilities
- `happy-dom` - DOM implementation for tests
- `@vitest/ui` - Interactive test UI
- `@vitest/coverage-v8` - Code coverage reporting
