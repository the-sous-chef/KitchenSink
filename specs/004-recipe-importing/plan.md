# Technical Plan: Feature 004 — Recipe Importing

**Feature**: `004-recipe-importing`
**Status**: Draft

---

## 1. Architecture Overview

### Import Pipeline

```
User URL/Photo
    ↓
POST /v1/recipes/import (authenticated)
    ↓
┌─ URL Import Path ──────────────────────────────┐
│  1. Fetch HTML from URL                       │
│  2. Parse Schema.org/Recipe JSON-LD           │
│  3. Fallback: Microdata → RDFa → Heuristic HTML│
│  4. Validate + normalize recipe data            │
│  5. Deduplicate (source URL as unique key)     │
│  6. Create Recipe entity in 001                 │
│  7. Attribute + public visibility               │
└────────────────────────────────────────────────┘
┌─ File Import Path ──────────────────────────────┐
│  1. Parse JSON / YAML / Markdown               │
│  2. Validate schema + recipe fields             │
│  3. Create Recipe entity                       │
│  4. Private (no source URL to attribute)        │
└────────────────────────────────────────────────┘
┌─ Instagram Import Path ────────────────────────┐
│  1. oEmbed API to fetch post metadata          │
│  2. Extract caption + image URL                │
│  3. Use URL import path for recipe extraction  │
│  4. Attribute to Instagram post               │
└────────────────────────────────────────────────┘
```

### Source Attribution Model

- **Imported URL**: stored as `Recipe.sourceUrl`, displayed prominently, recipe is public
- **Instagram**: stored as `Recipe.sourceUrl` pointing to Instagram post
- **File import**: private (no attribution available)
- **Physical copy / OCR**: private (no public source)

---

## 2. Data Model

### Extension to 001 `recipes` Table

```typescript
// New fields on Recipe entity (004 extends 001)
interface ImportedRecipe extends Recipe {
    importSource: 'url' | 'instagram' | 'file' | 'ocr';
    sourceUrl?: string; // Canonical URL of original
    sourcePlatform?: 'nyt' | 'allrecipes' | 'instagram' | 'other';
    attributionHtml?: string; // Styled attribution block
    clonedFromId?: UUID; // If this was cloned from an import
    isAttributionLocked: boolean; // True for imported recipes
}
```

### Deduplication Key

```sql
-- Unique constraint on source URL prevents duplicate imports
ALTER TABLE recipes ADD CONSTRAINT recipes_source_url_unique UNIQUE (source_url)
  WHERE source_url IS NOT NULL;
```

### Paywall/Source Policy

```typescript
// Known paywalled sources — block import at URL validation
const PAYWALLED_DOMAINS = [
    'cooking.nytimes.com', // Requires subscription
    'bonappetit.com', // Requires subscription
    'epicurious.com', // Requires subscription
    // ... expand via config
];

interface ImportPolicy {
    allowPublic: boolean;
    requireAttribution: boolean;
    maxImportsPerMonth: number; // Free tier: 10, Premium: unlimited
}
```

---

## 3. API Contracts

### Endpoints

| Method | Path                           | Auth     | Description               |
| ------ | ------------------------------ | -------- | ------------------------- |
| POST   | `/v1/recipes/import/url`       | Required | Import from URL           |
| POST   | `/v1/recipes/import/file`      | Required | Import from JSON/YAML/MD  |
| POST   | `/v1/recipes/import/instagram` | Required | Import from Instagram URL |
| GET    | `/v1/recipes/import/sources`   | Required | Get supported sources     |
| POST   | `/v1/recipes/{id}/clone`       | Required | Clone an imported recipe  |

### Request/Response Shapes

```typescript
// POST /v1/recipes/import/url
Request:
{
  "url": "https://www.allrecipes.com/recipe/12345/chicken-teriyaki"
}

Response (202 Accepted — async):
{
  "importId": "imp_abc123",
  "status": "processing",
  "estimatedSeconds": 10
}

Response (200 OK — sync fallback for simple pages):
{
  "recipeId": "rec_xyz789",
  "status": "imported",
  "sourceAttribution": {
    "text": "AllRecipes",
    "url": "https://www.allrecipes.com/recipe/12345/chicken-teriyaki",
    "displayText": "Chicken Teriyaki — AllRecipes"
  }
}

Response (400 Bad Request — paywalled):
{
  "error": "Import blocked",
  "reason": "paywalled_source",
  "message": "This source requires a subscription. Clone to private is unavailable."
}
```

---

## 4. URL Import Implementation

### Extraction Stack

```typescript
// Primary: Schema.org Recipe JSON-LD
import { parse } from 'schema-org-js';

const schemaData = parse(html, 'application/ld+json');
const recipe = schemaData.find((item) => item['@type'] === 'Recipe');

// Fallback chain
const extractors = [
    SchemaOrgExtractor, // JSON-LD (Schema.org/Recipe)
    MicrodataExtractor, // HTML microdata
    RDFaExtractor, // RDFa attributes
    HeuristicHTMLExtractor, // Title, ingredients, instructions via NLP-lite
];
```

### Supported Schema.org Fields

```typescript
interface ExtractedRecipe {
    name: string;
    description?: string;
    image?: string | string[];
    author?: Person | Organization;
    publishDate?: string;
    prepTime?: string; // ISO 8601 duration
    cookTime?: string;
    totalTime?: string;
    servings?: string;
    ingredients: string[];
    instructions: { type: 'HowToStep' | 'HowToSection'; text: string }[];
    nutrition?: NutritionInformation;
    category?: string;
    cuisine?: string;
    keywords?: string;
}
```

---

## 5. File Import Implementation

### Supported Formats

```typescript
const SUPPORTED_FORMATS = {
    'application/json': 'recipe-schema.json',
    'application/x-yaml': 'recipe.yaml',
    'text/markdown': 'recipe.md', // YAML frontmatter + markdown body
};
```

### JSON Schema Validation

```typescript
// Recipe JSON Schema (subset of Schema.org/Recipe)
const RecipeSchema = z.object({
    name: z.string().min(1),
    ingredients: z.array(z.string()),
    instructions: z.array(z.string()).or(
        z.array(
            z.object({
                type: z.enum(['HowToStep', 'HowToSection']),
                text: z.string(),
            }),
        ),
    ),
    prepTime: z.string().optional(),
    cookTime: z.string().optional(),
    servings: z.string().optional(),
    image: z.string().url().optional(),
});
```

---

## 6. Resilience & External Services

### URL Fetching

- **Timeout**: 10s per request
- **User-Agent**: `SousChef/1.0 (+https://souschef.io/bot)` — identifies us to servers
- **Redirect handling**: Max 5 hops
- **Rate limiting**: 30 requests/minute per user (configurable)
- **Circuit breaker**: Open after 10 consecutive failures, half-open after 60s

### Source Validation

- **Pre-import check**: HEAD request to validate URL accessibility
- **Paywall detection**: Response code + `X-Robots-Tag` header check
- **Blocklist enforcement**: Compare domain against `PAYWALLED_DOMAINS` before fetching

---

## 7. Migration / Schema Changes

```sql
-- Migration for 004 recipe-importing
ALTER TABLE recipes ADD COLUMN import_source TEXT;
ALTER TABLE recipes ADD COLUMN source_url TEXT;
ALTER TABLE recipes ADD COLUMN source_platform TEXT;
ALTER TABLE recipes ADD COLUMN attribution_html TEXT;
ALTER TABLE recipes ADD COLUMN is_attribution_locked BOOLEAN DEFAULT false;
ALTER TABLE recipes ADD COLUMN cloned_from_id UUID REFERENCES recipes(id);

CREATE INDEX idx_recipes_source_url ON recipes(source_url) WHERE source_url IS NOT NULL;
CREATE INDEX idx_recipes_import_source ON recipes(import_source);
```

---

## 8. Open Questions

1. **OCR library**: AWS Textract vs Tesseract (self-hosted) vs Google Cloud Vision?
2. **Instagram OAuth**: Required for oEmbed API, or public oEmbed is sufficient?
3. **Legal review**: Which exact domains are confirmed paywalled? Need user confirmation before blocking.

---

## 9. Implementation Order

1. **POST /v1/recipes/import/url** — core URL import with JSON-LD extraction
2. **Schema.org extractor** — full field mapping
3. **Fallback extractors** — microdata, RDFa, heuristic
4. **Deduplication logic** — source URL uniqueness
5. **POST /v1/recipes/import/file** — JSON/YAML/MD support
6. **Paywall detection** — blocklist enforcement
7. **Instagram import** — oEmbed integration
8. **POST /v1/recipes/{id}/clone** — clone with attribution
9. **OCR import** (P3) — physical copy scanning
