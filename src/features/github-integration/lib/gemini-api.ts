import { DOCUMENTATION_QUESTIONS } from "../constants";

// Gemini API response types
interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  parts?: GeminiPart[];
  text?: string;
}

interface GeminiCandidate {
  content?: GeminiContent | string | GeminiContent[];
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  output?: { content?: unknown }[];
  text?: string;
  output_text?: string;
}

interface GeminiPayload {
  contents: {
    parts: { text: string }[];
  }[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

/**
 * Simple Gemini HTTP wrapper that calls the Gemini API directly.
 *
 * Environment variables expected:
 * - GEMINI_API_KEY: API key for authorization (required)
 *
 * This file purposefully avoids using the `@google/generative-ai` package and
 * instead sends HTTP requests so the project doesn't need that dependency.
 */

function extractTextFromResponse(json: GeminiResponse): string {
  // Try a few common shapes used by generative APIs. If none match, fall back
  // to a JSON.stringify of the response so callers still receive useful info.
  if (!json) return "";

  // Gemini API format: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
  if (Array.isArray(json.candidates) && json.candidates[0]?.content) {
    const content = json.candidates[0].content;
    if (typeof content === 'object' && content !== null && 'parts' in content) {
      const parts = content.parts;
      if (Array.isArray(parts)) {
        return parts.map((p) => p.text || "").join("");
      }
    }
  }

  // Legacy format: { candidates: [{ content: "..." }] }
  if (Array.isArray(json.candidates) && json.candidates[0]?.content) {
    const content = json.candidates[0].content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content.map((c) => (typeof c === 'object' && c !== null && 'text' in c ? c.text : String(c))).join("\n");
    }
  }

  // Examples: { output: [{ content: [{ text: "..." }] }] }
  if (Array.isArray(json.output) && json.output[0]?.content) {
    const parts: string[] = [];
    for (const chunk of json.output) {
      if (Array.isArray(chunk.content)) {
        for (const c of chunk.content) {
          if (typeof c.text === "string") parts.push(c.text);
          else if (typeof c === "string") parts.push(c);
        }
      } else if (typeof chunk === "string") {
        parts.push(chunk);
      }
    }
    if (parts.length) return parts.join("\n");
  }

  // Example: { output_text: "..." }
  if (typeof json.output_text === "string") return json.output_text;

  // Example: { text: "..." }
  if (typeof json.text === "string") return json.text;

  // Last resort: return stringified JSON
  try {
    return JSON.stringify(json);
  } catch {
    return String(json);
  }
}

export class GeminiAPI {
  private apiKey: string;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent";

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
  }

  public isConfigured(): boolean {
    return !!this.apiKey;
  }

  public ensureConfigured(): void {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY must be configured in the environment");
    }
  }

  private async callGemini(payload: GeminiPayload, retries = 2): Promise<string> {
    this.ensureConfigured();
    
    const url = `${this.baseUrl}?key=${this.apiKey}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        // Retry on 429/5xx
        if ((res.status === 429 || res.status >= 500) && retries > 0) {
          await new Promise((r) => setTimeout(r, 500));
          return this.callGemini(payload, retries - 1);
        }
        throw new Error(`Gemini API error ${res.status}: ${text}`);
      }

      // Attempt to parse JSON, otherwise return raw text
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        return extractTextFromResponse(json);
      }

      return await res.text();
    } catch (err) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 500));
        return this.callGemini(payload, retries - 1);
      }
      console.error("Gemini call failed:", err);
      throw err;
    }
  }

  private buildGenerationPayload(prompt: string, options?: { maxTokens?: number; temperature?: number }) {
    return {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: options?.temperature ?? 0.2,
        maxOutputTokens: options?.maxTokens ?? 1024,
      }
    };
  }

  async summarizeFile(filePath: string, content: string): Promise<string> {
    const prompt = `Analyze this code file and provide a concise summary (max 200 words):\n\nFile: ${filePath}\n\n\`\`\`\n${content.slice(0, 5000)}\n\`\`\`\n\nSummarize:\n- What this file does\n- Key components/functions\n- Main responsibilities`;

    const payload = this.buildGenerationPayload(prompt, { maxTokens: 400 });
    return this.callGemini(payload);
  }

  async generateDocumentation(
    repositoryInfo: { name: string; description?: string; language?: string },
    files: Array<{ path: string; content: string; summary?: string }>
  ): Promise<string> {
    // Create detailed file listings with actual code
    const fileContext = files
      .map((f, index) => {
        const preview = f.content.slice(0, 3000);
        const lines = preview.split('\n').length;
        return `
## File ${index + 1}: \`${f.path}\`
**Lines analyzed:** ${lines}
**Content preview:**
\`\`\`
${preview}
\`\`\`
`;
      })
      .join("\n");

    const prompt = `You are a senior technical documentation specialist. Analyze the provided codebase and generate comprehensive, production-grade technical documentation.

## Repository Information
- **Name:** ${repositoryInfo.name}
- **Description:** ${repositoryInfo.description || "Not provided"}
- **Primary Language:** ${repositoryInfo.language || "Multiple"}
- **Files Analyzed:** ${files.length}

## Source Code Analysis
${fileContext}

---

Generate a complete technical documentation in Markdown format. The documentation must be professional, thorough, and suitable for enterprise use. Target minimum length: 3000 words.

# Structure Requirements

## 1. Project Overview
Provide a comprehensive overview including:
- Project purpose and goals
- Target audience and use cases
- Key value propositions
- Current status and maturity level

## 2. Architecture and Design
### System Architecture
- Overall system design and architecture patterns
- Component breakdown and relationships
- Data flow and processing pipeline
- Integration points and external dependencies

### Directory Structure
Explain the project organization:
- Root-level directories and their purposes
- Module organization strategy
- Naming conventions
- Important configuration files

### Technology Stack
List all technologies with specific details:
- **Frontend:** Frameworks, libraries, UI components
- **Backend:** Runtime, frameworks, APIs
- **Database:** Type, ORM, migration strategy
- **DevOps:** Build tools, deployment, CI/CD
- **Testing:** Test frameworks and strategies

## 3. Core Features and Functionality
Document major features in detail:
- Feature descriptions with technical implementation notes
- User workflows and interaction patterns
- Business logic and rules
- Performance characteristics

## 4. Getting Started
### Prerequisites
- System requirements (OS, RAM, etc.)
- Required software and minimum versions
- Development tools needed
- Access credentials and API keys

### Installation Steps
Provide exact commands:
\`\`\`bash
# Clone repository
# Install dependencies
# Configure environment
# Initialize database
# Start development server
\`\`\`

### Environment Configuration
Detail all environment variables:
- Required vs optional variables
- Format and example values
- Security considerations
- Environment-specific settings

## 5. API Documentation
### Endpoints
Document key API routes:
- HTTP methods and paths
- Request parameters and body structure
- Response formats and status codes
- Authentication requirements
- Rate limits and pagination

### Code Examples
Provide realistic API usage examples:
\`\`\`typescript
// Example API calls with actual endpoints from the codebase
\`\`\`

## 6. Configuration and Setup
### Application Configuration
- Configuration file locations
- Available options and their effects
- Feature toggles
- Performance tuning parameters

### Database Configuration
- Schema design overview
- Migration procedures
- Seeding and fixtures
- Backup and restore

## 7. Development Guide
### Project Structure Deep Dive
Analyze key files and their responsibilities:
- Core application files
- Routing and middleware
- Business logic modules
- Utility and helper functions

### Component Architecture
For web applications:
- Component hierarchy
- State management patterns
- Props and data flow
- Hooks and lifecycle methods

### Coding Standards
- Code style and formatting
- Naming conventions
- File organization
- Import/export patterns

## 8. Testing and Quality Assurance
### Testing Strategy
- Unit testing approach
- Integration test coverage
- End-to-end testing
- Test data management

### Running Tests
\`\`\`bash
# Test execution commands
\`\`\`

## 9. Deployment and Operations
### Build Process
\`\`\`bash
# Production build commands
\`\`\`

### Deployment Procedure
- Pre-deployment checklist
- Deployment steps
- Environment-specific configurations
- Post-deployment validation

### Monitoring and Logging
- Log aggregation setup
- Key metrics to monitor
- Error tracking integration
- Performance monitoring

## 10. Security Considerations
### Authentication and Authorization
- Authentication mechanism
- Authorization strategy
- Session management
- Token handling and storage

### Security Best Practices
- Input validation and sanitization
- SQL injection prevention
- XSS and CSRF protection
- Secure communication (HTTPS/TLS)
- Secrets management

## 11. Performance Optimization
- Caching strategies
- Database query optimization
- Asset optimization
- Load balancing considerations
- Scalability patterns

## 12. Troubleshooting and FAQs
### Common Issues
List 5-10 frequent problems with solutions:
- Error messages and their meanings
- Configuration problems
- Dependency conflicts
- Runtime errors

### Frequently Asked Questions
Address common developer questions

## 13. Contributing Guidelines
### Development Workflow
- Branch strategy (Git flow)
- Commit message conventions
- Pull request process
- Code review guidelines

### Submitting Changes
- Feature request procedure
- Bug report template
- Documentation updates
- Testing requirements

## 14. Maintenance and Support
- Update and patch procedures
- Dependency management
- Breaking changes handling
- Support channels

## 15. Appendices
### Reference Links
- Official documentation
- Related projects
- Community resources
- External dependencies

### Glossary
Define technical terms and acronyms

### Version History
- Current version
- Recent changes
- Upgrade paths

---

## Documentation Guidelines
- Write in clear, professional technical language
- Use actual code examples from the analyzed files
- Reference specific files and line numbers where relevant
- Include command-line examples with realistic parameters
- Format code blocks with appropriate language tags
- Use descriptive section headers without emojis
- Maintain consistent terminology throughout
- Ensure all technical details are accurate and specific
- Target experienced developers who need to understand and maintain the code

Generate the complete technical documentation now:`;

    const payload = this.buildGenerationPayload(prompt, { maxTokens: 8000, temperature: 0.2 });
    return this.callGemini(payload);
  }

  async answerQuestion(
    question: string,
    codebaseContext: { files: Array<{ path: string; content: string; summary?: string }>; documentation?: string }
  ): Promise<string> {
    const fileContext = codebaseContext.files
      .slice(0, 10)
      .map((f) => `File: ${f.path}\n${f.summary || f.content.slice(0, 1000)}\n---`)
      .join("\n");

    const prompt = `You are an expert code analyst. Answer the following question about this codebase in a well-organized, structured format.

Question: ${question}

Codebase Context:
${fileContext}

${codebaseContext.documentation ? `\nExisting Documentation:\n${codebaseContext.documentation.slice(0, 2000)}` : ""}

Provide a comprehensive answer following this structure:

1. **Overview**: Brief high-level explanation of the answer

2. **File Locations**: List all relevant files and their purposes:
   - \`path/to/file.ts\` - What this file does
   - Use backticks for file paths

3. **Key Components/Functions**: Identify the main components involved:
   - Component/Function name and its role
   - Which file it's located in

4. **Code Examples**: Show relevant code snippets with proper syntax highlighting:
   \`\`\`typescript
   // Actual code from the codebase
   \`\`\`

5. **How It Works**: Step-by-step breakdown:
   - Step 1: What happens first
   - Step 2: Next action
   - Include line numbers or function names when relevant

6. **Related Files**: Other files that interact with this functionality

7. **Best Practices**: If applicable, mention any patterns or practices used

Format your response in clean Markdown with proper headings, code blocks, and bullet points. Be specific about file paths and function names.`;

    const payload = this.buildGenerationPayload(prompt, { maxTokens: 1500 });
    return this.callGemini(payload);
  }

  async summarizeCommit(commitDiff: string, commitMessage: string): Promise<string> {
    const prompt = `Summarize this git commit in a clear, concise way (max 150 words):\n\nCommit Message: ${commitMessage}\n\nDiff (truncated):\n\`\`\`diff\n${commitDiff.slice(0, 4000)}\n\`\`\`\n\nProvide:\n1. What changed (high-level)\n2. Why it matters\n3. Key files affected\n4. Impact on the codebase\n\nBe technical but clear. Focus on the \"what\" and \"why\".`;

    const payload = this.buildGenerationPayload(prompt, { maxTokens: 400 });
    return this.callGemini(payload);
  }

  async generateFAQ(files: Array<{ path: string; content: string }>, repositoryName: string): Promise<Record<string, string>> {
    const faq: Record<string, string> = {};
    const fileContext = files.slice(0, 15).map((f) => `${f.path}: ${f.content.slice(0, 800)}`).join("\n---\n");

    for (const question of DOCUMENTATION_QUESTIONS) {
      try {
        const prompt = `Project: ${repositoryName}\n\nCodebase Files:\n${fileContext}\n\nQuestion: ${question}\n\nProvide a detailed, informative answer (max 300 words):`;
        const payload = this.buildGenerationPayload(prompt, { maxTokens: 400 });
        faq[question] = await this.callGemini(payload);
        // small delay
        await new Promise((r) => setTimeout(r, 250));
      } catch (err) {
        console.error(`Error generating FAQ for question: ${question}`, err);
        faq[question] = "Unable to generate answer at this time.";
      }
    }

    return faq;
  }

  async analyzeCodeQuality(files: Array<{ path: string; content: string }>): Promise<string> {
    const codeSnippets = files.slice(0, 5).map((f) => `${f.path}:\n\`\`\`\n${f.content.slice(0, 2000)}\n\`\`\``).join("\n\n");

    const prompt = `Analyze the code quality of this project and provide actionable insights:\n\n${codeSnippets}\n\nProvide analysis on:\n1. Code organization and structure\n2. Potential improvements\n3. Security considerations\n4. Performance opportunities\n5. Best practices adherence\n\nKeep it constructive and specific.`;

    const payload = this.buildGenerationPayload(prompt, { maxTokens: 800 });
    return this.callGemini(payload);
  }
}

export const geminiAPI = new GeminiAPI();
