# Release Workflow: Publishing to NPM & GitHub

This document outlines the ideal flow for publishing packages to npm and creating GitHub releases.

## Package Overview

This is a monorepo with three publishable packages:

| Package | NPM Name | Description |
|---------|----------|-------------|
| Root | `vite-plugin-asset-manager` | Main Vite plugin (depends on core) |
| `packages/core` | `@vite-asset-manager/core` | Framework-agnostic core functionality |
| `packages/nuxt` | `@vite-asset-manager/nuxt` | Nuxt 3/4 module (depends on core) |

### Dependency Graph

```
vite-plugin-asset-manager
    └── @vite-asset-manager/core

@vite-asset-manager/nuxt
    └── @vite-asset-manager/core
```

**Important**: The `workspace:*` protocol in package.json is automatically converted to the actual version number when publishing.

## Prerequisites

- [ ] All changes committed and pushed to `main` branch
- [ ] All tests passing (`pnpm run test`)
- [ ] No linting errors (`pnpm run lint`)
- [ ] Clean working directory (`git status`)
- [ ] NPM authentication configured (`npm whoami`)
- [ ] GitHub CLI authenticated (`gh auth status`)

---

## Monorepo Package Publishing

### First-Time Setup for New Packages

Before publishing `@vite-asset-manager/core` or `@vite-asset-manager/nuxt` for the first time:

```bash
# Verify you're logged in to npm
npm whoami

# Verify you have access to publish scoped packages
# (You may need to create the @vite-asset-manager organization on npm first)
```

**Note**: Scoped packages (`@vite-asset-manager/*`) require either:
- An npm organization named `vite-asset-manager`, OR
- Publishing as a paid npm user with scoped package access

### Publishing Order

Due to the dependency chain, packages MUST be published in this order:

1. **`@vite-asset-manager/core`** - No dependencies on other workspace packages
2. **`@vite-asset-manager/nuxt`** - Depends on core
3. **`vite-plugin-asset-manager`** - Depends on core

### Publishing @vite-asset-manager/core

```bash
# Navigate to core package
cd packages/core

# Build the package
pnpm run build

# Verify build output
ls -la dist/

# Dry run to see what will be published
npm pack --dry-run

# Bump version (choose patch/minor/major as needed)
npm version patch

# Publish to npm
pnpm publish --access public

# Verify publication
npm view @vite-asset-manager/core

# Return to root
cd ../..
```

### Publishing @vite-asset-manager/nuxt

```bash
# Navigate to nuxt package
cd packages/nuxt

# Prepare and build the module
pnpm run dev:prepare
pnpm run build

# Verify build output
ls -la dist/

# Dry run to see what will be published
npm pack --dry-run

# Bump version (choose patch/minor/major as needed)
npm version patch

# Publish to npm
pnpm publish --access public

# Verify publication
npm view @vite-asset-manager/nuxt

# Return to root
cd ../..
```

### Publishing Main Plugin (vite-plugin-asset-manager)

```bash
# Build all (UI, floating icon, plugin)
pnpm run build

# Verify build output
ls -la dist/

# Dry run
npm pack --dry-run

# Bump version
npm version patch -m "chore: release v%s"

# Publish
pnpm publish --access public

# Verify
npm view vite-plugin-asset-manager
```

### Coordinated Release (All Packages)

When releasing breaking changes or synchronized updates across all packages:

```bash
# 1. Build all packages (core → nuxt → main plugin + copies client to core)
pnpm run build:all

# 2. Run tests
pnpm run test

# 3. Publish in order
cd packages/core
npm version minor        # e.g., 0.1.0
pnpm publish --access public
cd ../nuxt
npm version minor        # e.g., 0.1.0 (keep versions in sync)
pnpm publish --access public
cd ../..
npm version minor        # e.g., 0.1.0
pnpm publish --access public

# 4. Push all tags
git push origin main --tags

# 5. Create GitHub release with auto-generated changelog
gh release create v0.1.0 --title "v0.1.0" --generate-notes --notes-start-tag v0.0.6 --latest
```

### Version Synchronization Strategy

**Recommended**: Keep all three packages at the same version number for simplicity:

| Package | Version |
|---------|---------|
| @vite-asset-manager/core | 0.1.0 |
| @vite-asset-manager/nuxt | 0.1.0 |
| vite-plugin-asset-manager | 0.1.0 |

**Alternative**: Independent versioning (more complex but allows granular releases):

| Package | Version |
|---------|---------|
| @vite-asset-manager/core | 1.2.3 |
| @vite-asset-manager/nuxt | 0.5.1 |
| vite-plugin-asset-manager | 0.0.8 |

### Workspace Protocol Resolution

**IMPORTANT**: You MUST use `pnpm publish` (not `npm publish`) for packages that have `workspace:*` dependencies. Only pnpm resolves `workspace:*` to actual version numbers during publish. Using `npm publish` will publish the literal `workspace:*` string, breaking installation for consumers.

When publishing, pnpm automatically converts `workspace:*` to the actual version:

```json
// Before publish (in package.json)
"dependencies": {
  "@vite-asset-manager/core": "workspace:*"
}

// After publish (in published package)
"dependencies": {
  "@vite-asset-manager/core": "^0.1.0"
}
```

### Package-Specific Build Commands

| Package | Build Command | Output |
|---------|---------------|--------|
| core | `pnpm run build` | `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts` |
| nuxt | `pnpm run build` | `dist/module.mjs`, `dist/module.d.mts`, `dist/runtime/` |
| main | `pnpm run build` | `dist/index.js`, `dist/index.cjs`, `dist/client/` |

---

## Release Flow

### 1. Pre-Release Checks

```bash
# Ensure you're on the main branch
git checkout main
git pull origin main

# Run full test suite
pnpm run test

# Run linting
pnpm run lint

# Verify build succeeds
pnpm run build

# Test in playground to ensure everything works
cd playgrounds/react
pnpm run dev
# Manually verify the asset manager works correctly
cd ../..
```

### 2. Version Bump

For a **patch version** (e.g., 0.0.4 → 0.0.5):

```bash
# Bump version in package.json and create git tag
npm version patch -m "chore: release v%s"

# This automatically:
# - Updates package.json version
# - Creates a git commit with message "chore: release v0.0.5"
# - Creates a git tag (v0.0.5)
```

**Alternative version types:**
- `npm version minor` - For new features (0.0.5 → 0.1.0)
- `npm version major` - For breaking changes (0.0.5 → 1.0.0)
- `npm version prepatch` - For pre-release patches (0.0.5 → 0.0.6-0)

### 3. Generate Changelog

Update `CHANGELOG.md` with the changes in this release:

```bash
# Get commits since last tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline --pretty=format:"- %s (%h)"

# Or use conventional-changelog (if installed)
npx conventional-changelog -p angular -i CHANGELOG.md -s
```

**Manual CHANGELOG.md structure:**

```markdown
## [0.0.5] - 2026-01-31

### Features
- feat: implement comprehensive responsive design for all device sizes (#10)
- feat: add mobile drawer navigation and bottom sheet preview panel

### Bug Fixes
- fix: preview panel centering issue on mobile devices

### Documentation
- docs: sync documentation with responsive implementation
- docs: add comprehensive responsive design documentation

### Internal
- chore: optimize mobile touch targets for WCAG 2.1 AAA compliance
```

Commit the changelog:

```bash
git add CHANGELOG.md
git commit -m "docs: update changelog for v0.0.5"
```

### 4. Push to GitHub

```bash
# Push commits
git push origin main

# Push tags
git push origin --tags
```

### 5. Publish to NPM

```bash
# Verify package contents before publishing
npm pack --dry-run

# Publish to npm (public package)
pnpm publish --access public

# Verify publication
npm view vite-plugin-asset-manager version
```

**Important:** The `package.json` should have:
```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

### 6. Create GitHub Release

#### Option A: Using GitHub CLI (Recommended)

**Quick One-Liner (Tag + Push + Release):**

```bash
# Tag, push, and create release with auto-generated notes in one command
git tag v0.0.5 && git push origin v0.0.5 && gh release create v0.0.5 --title "v0.0.5" --generate-notes --notes-start-tag v0.0.4 --latest
```

**Detailed Commands:**

```bash
# Get the latest tag
TAG=$(git describe --tags --abbrev=0)

# Create release with auto-generated notes comparing to previous version
gh release create $TAG \
  --title "v0.0.5" \
  --generate-notes \
  --notes-start-tag v0.0.4 \
  --latest

# Or with custom notes from file
gh release create $TAG \
  --title "v0.0.5" \
  --notes-file RELEASE_NOTES.md \
  --latest

# Or with inline notes
gh release create $TAG \
  --title "v0.0.5" \
  --notes "$(cat <<'EOF'
## What's New

### 🎨 Responsive Design
Complete mobile-first responsive implementation supporting all device sizes from 320px to 4K+.

### ✨ Features
- Mobile drawer navigation pattern
- Bottom sheet preview panel for mobile
- Touch-friendly 44×44px tap targets (WCAG 2.1 AAA)
- Responsive breakpoints and utilities

### 🐛 Bug Fixes
- Fixed preview panel centering issue on mobile devices

### 📚 Documentation
- Added comprehensive responsive design documentation
- Updated all documentation files to reflect current implementation

## 🚀 Installation

\`\`\`bash
npm install vite-plugin-asset-manager
\`\`\`

## 📦 Full Changelog

**Full Changelog**: https://github.com/ejirocodes/vite-plugin-asset-manager/compare/v0.0.4...v0.0.5
EOF
)"
```

#### Option B: Using GitHub Web UI

1. Navigate to: `https://github.com/ejirocodes/vite-plugin-asset-manager/releases/new`
2. Select the tag: `v0.0.5`
3. Set release title: `v0.0.5`
4. Fill in release notes (see template below)
5. Check "Set as the latest release"
6. Click "Publish release"

### 7. Post-Release Tasks

```bash
# Verify npm package
npm view vite-plugin-asset-manager

# Verify GitHub release
gh release view v0.0.5

# Test installation in a fresh project
mkdir test-install
cd test-install
npm init -y
npm install vite-plugin-asset-manager
cd ..
rm -rf test-install

# Announce release (optional)
# - Tweet about the release
# - Post in Discord/Slack communities
# - Update project README badges if needed
```

### 8. Update Dependents (if applicable)

If you maintain example projects or other repositories that use this plugin:

```bash
# Update the plugin version
npm install vite-plugin-asset-manager@latest

# Test and commit
git add package.json package-lock.json
git commit -m "chore: update vite-plugin-asset-manager to v0.0.5"
git push
```

## Release Notes Template

```markdown
## What's New in v0.0.5

### 🎨 [Feature Category]
Brief description of the main feature or improvement.

### ✨ Features
- List of new features
- Each feature on its own line
- Use checkboxes if listing planned features

### 🐛 Bug Fixes
- List of bugs fixed
- Include issue numbers if applicable (#123)

### 📚 Documentation
- Documentation improvements
- New guides or updated instructions

### ⚡ Performance
- Performance improvements
- Optimization details

### 🔧 Internal
- Refactoring or internal changes
- Developer experience improvements

## 🚀 Installation

\`\`\`bash
npm install vite-plugin-asset-manager
# or
pnpm add vite-plugin-asset-manager
# or
yarn add vite-plugin-asset-manager
\`\`\`

## 📦 What's Changed

<!-- Auto-generated commit list -->
**Full Changelog**: https://github.com/ejirocodes/vite-plugin-asset-manager/compare/v0.0.4...v0.0.5

## 🙏 Contributors

Thanks to all contributors who made this release possible!

<!-- GitHub will auto-generate this if you use their UI -->
```

## Automation Options

### Using GitHub Actions

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm run test

      - name: Build
        run: pnpm run build

      - name: Publish to NPM
        run: pnpm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
```

### Using Release Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "release:patch": "npm version patch && git push --follow-tags",
    "release:minor": "npm version minor && git push --follow-tags",
    "release:major": "npm version major && git push --follow-tags",
    "prepublishOnly": "pnpm run test && pnpm run lint && pnpm run build"
  }
}
```

Then simply run:

```bash
pnpm run release:patch
```

## Rollback Procedure

If you need to unpublish or rollback a release:

```bash
# Unpublish from npm (only works within 72 hours)
npm unpublish vite-plugin-asset-manager@0.0.5

# Delete git tag
git tag -d v0.0.5
git push origin :refs/tags/v0.0.5

# Delete GitHub release
gh release delete v0.0.5 --yes

# Revert version in package.json
git revert HEAD
git push origin main
```

## Best Practices

1. **Always test before releasing** - Run the full test suite and manually test in playgrounds
2. **Follow semantic versioning** - Patch for fixes, minor for features, major for breaking changes
3. **Write clear release notes** - Help users understand what changed and why it matters
4. **Tag consistently** - Use `v` prefix for tags (v0.0.5, not 0.0.5)
5. **Keep CHANGELOG updated** - Maintain a human-readable changelog
6. **Test the published package** - Install from npm in a fresh project to verify
7. **Announce releases** - Share with the community to drive adoption
8. **Monitor for issues** - Watch for bug reports after release

## Checklist

Use this checklist for each release:

- [ ] All tests passing
- [ ] No linting errors
- [ ] Clean git status
- [ ] Version bumped (`npm version patch`)
- [ ] CHANGELOG.md updated
- [ ] Changes committed
- [ ] Pushed to GitHub (commits + tags)
- [ ] Published to npm
- [ ] GitHub release created
- [ ] Release notes complete
- [ ] Package verified on npm
- [ ] Installation tested
- [ ] Community notified (optional)

## Useful Commands

```bash
# Check current version
npm version

# View all tags
git tag -l

# View latest tag
git describe --tags --abbrev=0

# View commits since last tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# Check npm package info
npm view vite-plugin-asset-manager

# Check who you're logged in as
npm whoami

# View GitHub releases
gh release list

# View specific release
gh release view v0.0.5
```

---

## VSCode Extension Release (Asset Lens)

The Asset Lens extension (`packages/vscode`) is released independently via the VSCode Marketplace.

### Prerequisites

1. **VSCE Personal Access Token**: Generate at https://dev.azure.com → User Settings → Personal Access Tokens
   - Scope: `Marketplace (Publish)`
   - Add as GitHub secret: `VSCE_PAT` in repository settings

2. **Publisher account**: Create a publisher at https://marketplace.visualstudio.com/manage

### Publishing via GitHub Actions (Recommended)

Use the `workflow_dispatch` trigger in `.github/workflows/vscode-release.yml`:

```
GitHub Actions → VSCode Extension Release → Run workflow → Enter version (e.g. 0.1.0)
```

This will:
1. Build the extension (`packages/vscode/dist/`)
2. Bump the version in `packages/vscode/package.json`
3. Package as `.vsix`
4. Publish to VSCode Marketplace
5. Create a GitHub Release tagged `vscode-v{version}`

### Publishing Manually

```bash
# Build
pnpm run build:vscode

# Bump version
cd packages/vscode
npm version patch --no-git-tag-version

# Package
pnpm run package        # creates asset-lens-{version}.vsix

# Publish (requires VSCE_PAT env var)
VSCE_PAT=<token> pnpm run publish
```

---

## Resources

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Releases Guide](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- [Conventional Commits](https://www.conventionalcommits.org/)
