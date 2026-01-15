/**
 * Workflow AI - Gemini API wrapper for workflow AI features
 * 
 * This module provides AI-powered workflow operations including:
 * - Answering questions about workflows
 * - Suggesting statuses and transitions
 * - Generating complete workflow templates
 * - Analyzing workflow issues
 */

import { 
  WorkflowAIContext, 
  StatusSuggestion, 
  TransitionSuggestion, 
  WorkflowSuggestion 
} from "../types/ai-context";

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
 * Extract text from Gemini API response
 */
function extractTextFromResponse(json: GeminiResponse): string {
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

  if (typeof json.output_text === "string") return json.output_text;
  if (typeof json.text === "string") return json.text;

  try {
    return JSON.stringify(json);
  } catch {
    return String(json);
  }
}

/**
 * WorkflowAI class for handling AI-powered workflow operations
 */
export class WorkflowAI {
  private apiKey: string;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

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
        if ((res.status === 429 || res.status >= 500) && retries > 0) {
          await new Promise((r) => setTimeout(r, 500));
          return this.callGemini(payload, retries - 1);
        }
        throw new Error(`Gemini API error ${res.status}: ${text}`);
      }

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

  private buildPayload(prompt: string, options?: { maxTokens?: number; temperature?: number }): GeminiPayload {
    return {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 2000,
      }
    };
  }

  /**
   * Answer a question about the workflow using provided context
   */
  async answerWorkflowQuestion(
    question: string,
    context: WorkflowAIContext
  ): Promise<string> {
    const statusList = context.statuses
      .map(s => `- ${s.name} (${s.key}): ${s.statusType}${s.isInitial ? ' [INITIAL]' : ''}${s.isFinal ? ' [FINAL]' : ''}`)
      .join('\n');

    const transitionList = context.transitions
      .map(t => `- ${t.fromStatus} → ${t.toStatus}${t.name ? ` (${t.name})` : ''}${t.requiresApproval ? ' [Requires Approval]' : ''}`)
      .join('\n');

    const issuesSummary = [];
    if (context.summary.orphanedStatuses > 0) issuesSummary.push(`${context.summary.orphanedStatuses} orphaned statuses`);
    if (context.summary.unreachableStatuses > 0) issuesSummary.push(`${context.summary.unreachableStatuses} unreachable statuses`);
    if (context.summary.deadEndStatuses > 0) issuesSummary.push(`${context.summary.deadEndStatuses} dead-end statuses`);

    const prompt = `You are a workflow expert AI assistant. Answer questions about this workflow configuration.

## Workflow: ${context.workflow.name}
${context.workflow.description || 'No description provided.'}

## Statuses (${context.summary.totalStatuses} total):
${statusList || 'No statuses defined.'}

## Transitions (${context.summary.totalTransitions} total):
${transitionList || 'No transitions defined.'}

## Summary:
- Initial statuses: ${context.summary.initialStatuses}
- Final statuses: ${context.summary.finalStatuses}
${issuesSummary.length > 0 ? `- Issues detected: ${issuesSummary.join(', ')}` : '- No issues detected'}

---

User Question: ${question}

Provide a helpful, concise answer. If the user asks to create something, provide the details needed. If analyzing issues, explain what they mean and how to fix them.`;

    const payload = this.buildPayload(prompt, { maxTokens: 1500 });
    return this.callGemini(payload);
  }

  /**
   * Generate a status suggestion based on user prompt
   */
  async suggestStatus(
    prompt: string,
    context: WorkflowAIContext
  ): Promise<StatusSuggestion | null> {
    const existingKeys = context.statuses.map(s => s.key);
    const existingNames = context.statuses.map(s => s.name.toLowerCase());

    const aiPrompt = `You are a workflow expert. Generate a status based on this request.

Current workflow: ${context.workflow.name}
Existing statuses: ${existingKeys.join(', ') || 'None'}

User request: ${prompt}

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "name": "Status Name",
  "key": "STATUS_KEY",
  "statusType": "OPEN" | "IN_PROGRESS" | "CLOSED",
  "color": "#hexcolor",
  "isInitial": false,
  "isFinal": false,
  "description": "Brief description"
}

Rules:
- key must be UPPERCASE_SNAKE_CASE
- key must be unique (not in: ${existingKeys.join(', ')})
- statusType must be one of: OPEN, IN_PROGRESS, CLOSED
- color should be a hex color appropriate for the status type
- isInitial should be true only for starting statuses
- isFinal should be true only for end statuses`;

    const payload = this.buildPayload(aiPrompt, { maxTokens: 500, temperature: 0.2 });
    const response = await this.callGemini(payload);

    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      
      const suggestion = JSON.parse(jsonMatch[0]) as StatusSuggestion;
      
      // Validate and sanitize
      if (!suggestion.name || !suggestion.key || !suggestion.statusType) return null;
      
      // Ensure key is unique
      if (existingKeys.includes(suggestion.key)) {
        suggestion.key = suggestion.key + '_NEW';
      }
      
      // Ensure name is unique
      if (existingNames.includes(suggestion.name.toLowerCase())) {
        suggestion.name = suggestion.name + ' (New)';
      }
      
      return suggestion;
    } catch (error) {
      console.error('Failed to parse status suggestion:', error);
      return null;
    }
  }

  /**
   * Generate a transition suggestion based on user prompt
   */
  async suggestTransition(
    prompt: string,
    context: WorkflowAIContext
  ): Promise<TransitionSuggestion | null> {
    const statusKeys = context.statuses.map(s => s.key);
    const existingTransitions = context.transitions.map(t => `${t.fromStatus}→${t.toStatus}`);

    const aiPrompt = `You are a workflow expert. Generate a transition based on this request.

Current workflow: ${context.workflow.name}
Available statuses: ${statusKeys.join(', ')}
Existing transitions: ${existingTransitions.join(', ') || 'None'}

User request: ${prompt}

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "fromStatusKey": "FROM_STATUS_KEY",
  "toStatusKey": "TO_STATUS_KEY",
  "name": "Optional transition name",
  "requiresApproval": false
}

Rules:
- fromStatusKey and toStatusKey MUST be from available statuses: ${statusKeys.join(', ')}
- Do not create a transition that already exists
- requiresApproval should be true for critical transitions`;

    const payload = this.buildPayload(aiPrompt, { maxTokens: 300, temperature: 0.2 });
    const response = await this.callGemini(payload);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      
      const suggestion = JSON.parse(jsonMatch[0]) as TransitionSuggestion;
      
      // Validate
      if (!suggestion.fromStatusKey || !suggestion.toStatusKey) return null;
      if (!statusKeys.includes(suggestion.fromStatusKey) || !statusKeys.includes(suggestion.toStatusKey)) return null;
      
      // Check if transition already exists
      const transitionKey = `${suggestion.fromStatusKey}→${suggestion.toStatusKey}`;
      if (existingTransitions.includes(transitionKey)) return null;
      
      return suggestion;
    } catch (error) {
      console.error('Failed to parse transition suggestion:', error);
      return null;
    }
  }

  /**
   * Generate a complete workflow template based on user description
   */
  async generateWorkflowTemplate(
    description: string
  ): Promise<WorkflowSuggestion | null> {
    const aiPrompt = `You are a workflow expert. Generate a complete workflow template based on this description.

User description: ${description}

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "name": "Workflow Name",
  "description": "Brief workflow description",
  "statuses": [
    {
      "name": "Status Name",
      "key": "STATUS_KEY",
      "statusType": "OPEN" | "IN_PROGRESS" | "CLOSED",
      "color": "#hexcolor",
      "isInitial": true/false,
      "isFinal": true/false,
      "description": "Status description"
    }
  ],
  "transitions": [
    {
      "fromStatusKey": "FROM_KEY",
      "toStatusKey": "TO_KEY",
      "name": "Optional name",
      "requiresApproval": false
    }
  ]
}

Requirements:
- Include at least one INITIAL status (isInitial: true)
- Include at least one FINAL status (isFinal: true)
- Create logical transitions between statuses
- Use appropriate colors for each status type
- OPEN statuses: gray/slate colors
- IN_PROGRESS statuses: blue/yellow colors
- CLOSED statuses: green/emerald colors`;

    const payload = this.buildPayload(aiPrompt, { maxTokens: 2000, temperature: 0.4 });
    const response = await this.callGemini(payload);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      
      const suggestion = JSON.parse(jsonMatch[0]) as WorkflowSuggestion;
      
      // Validate
      if (!suggestion.name || !suggestion.statuses || suggestion.statuses.length === 0) return null;
      
      return suggestion;
    } catch (error) {
      console.error('Failed to parse workflow template:', error);
      return null;
    }
  }

  /**
   * Analyze workflow and suggest improvements
   */
  async analyzeWorkflow(context: WorkflowAIContext): Promise<string> {
    const statusList = context.statuses
      .map(s => `- ${s.name} (${s.key}): ${s.statusType}${s.isInitial ? ' [INITIAL]' : ''}${s.isFinal ? ' [FINAL]' : ''}`)
      .join('\n');

    const transitionList = context.transitions
      .map(t => `- ${t.fromStatus} → ${t.toStatus}`)
      .join('\n');

    const prompt = `You are a workflow expert. Analyze this workflow and provide improvement suggestions.

## Workflow: ${context.workflow.name}
${context.workflow.description || ''}

## Statuses:
${statusList || 'No statuses defined.'}

## Transitions:
${transitionList || 'No transitions defined.'}

## Current Issues:
- Orphaned statuses (no connections): ${context.summary.orphanedStatuses}
- Unreachable statuses (no incoming): ${context.summary.unreachableStatuses}
- Dead-end statuses (no outgoing, not final): ${context.summary.deadEndStatuses}

Provide a structured analysis with:
1. **Workflow Health**: Overall assessment
2. **Issues Found**: Explain any problems detected
3. **Recommendations**: Specific improvements to make
4. **Missing Elements**: Suggest any statuses or transitions that might be needed

Be concise and actionable.`;

    const payload = this.buildPayload(prompt, { maxTokens: 1500 });
    return this.callGemini(payload);
  }
}

// Export singleton instance
export const workflowAI = new WorkflowAI();
