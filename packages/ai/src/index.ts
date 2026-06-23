/* =========================================================================
 * Career-Ops India — AI Provider Adapter Layer
 * Unified interface for all supported AI providers
 * ========================================================================= */

export type AITaskType =
  | 'job_evaluation'
  | 'resume_tailoring'
  | 'cover_letter'
  | 'interview_prep'
  | 'skill_gap'
  | 'career_switch'
  | 'job_summary'
  | 'ocr_parsing'
  | 'embeddings'
  | 'report_generation';

export interface AIProviderConfig {
  id: string;
  name: string;
  type: 'openai' | 'gemini' | 'anthropic' | 'openrouter' | 'groq' | 'ollama' | 'lmstudio' | 'custom';
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  fallbackModel?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retries?: number;
  streaming?: boolean;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  text: string;
  model: string;
  provider: string;
  tokensUsed?: number;
  finishReason?: string;
}

/** Base URL defaults for known providers. */
const PROVIDER_DEFAULTS: Record<string, { baseUrl: string; defaultModel: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: 'gemini-2.5-flash' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', defaultModel: 'claude-sonnet-4-20250514' },
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o-mini' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile' },
  ollama: { baseUrl: 'http://localhost:11434/v1', defaultModel: 'llama3.2' },
  lmstudio: { baseUrl: 'http://localhost:1234/v1', defaultModel: 'local-model' },
};

/** Call an AI provider with the OpenAI-compatible chat completions API. */
export async function callAI(
  config: AIProviderConfig,
  messages: AIMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<AIResponse> {
  const defaults = PROVIDER_DEFAULTS[config.type] ?? {};
  const baseUrl = config.baseUrl || defaults.baseUrl || '';
  const model = config.defaultModel || defaults.defaultModel || '';
  const temperature = options?.temperature ?? config.temperature ?? 0.7;
  const maxTokens = options?.maxTokens ?? config.maxTokens ?? 4096;
  const timeout = config.timeout ?? 30000;

  // Anthropic uses a different API format
  if (config.type === 'anthropic') {
    return callAnthropic(config, messages, { temperature, maxTokens, timeout });
  }

  // Gemini native API
  if (config.type === 'gemini' && !config.baseUrl?.includes('/v1/')) {
    return callGemini(config, messages, { temperature, maxTokens, timeout });
  }

  // OpenAI-compatible API (works for: openai, openrouter, groq, ollama, lmstudio, custom)
  const url = `${baseUrl}/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  if (config.type === 'openrouter') {
    headers['HTTP-Referer'] = 'https://career-ops-india.local';
    headers['X-Title'] = 'Career-Ops India';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI provider ${config.name} returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return {
      text: data.choices?.[0]?.message?.content ?? '',
      model: data.model ?? model,
      provider: config.name,
      tokensUsed: data.usage?.total_tokens,
      finishReason: data.choices?.[0]?.finish_reason,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`AI provider ${config.name} request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

/** Call Anthropic Messages API. */
async function callAnthropic(
  config: AIProviderConfig,
  messages: AIMessage[],
  options: { temperature: number; maxTokens: number; timeout: number }
): Promise<AIResponse> {
  const baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
  const model = config.defaultModel || 'claude-sonnet-4-20250514';

  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const userMessages = messages.filter(m => m.role !== 'system');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout);

  try {
    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: systemMessage,
        messages: userMessages.map(m => ({ role: m.role, content: m.content })),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return {
      text: data.content?.[0]?.text ?? '',
      model: data.model ?? model,
      provider: config.name,
      tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      finishReason: data.stop_reason,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') throw new Error(`Anthropic request timed out`);
    throw error;
  }
}

/** Call Google Gemini API. */
async function callGemini(
  config: AIProviderConfig,
  messages: AIMessage[],
  options: { temperature: number; maxTokens: number; timeout: number }
): Promise<AIResponse> {
  const model = config.defaultModel || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find(m => m.role === 'system')?.content;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout);

  try {
    const body: any = {
      contents,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      },
    };
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return {
      text,
      model,
      provider: config.name,
      tokensUsed: data.usageMetadata?.totalTokenCount,
      finishReason: data.candidates?.[0]?.finishReason,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') throw new Error(`Gemini request timed out`);
    throw error;
  }
}

/** Test connection to an AI provider. */
export async function testConnection(config: AIProviderConfig): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const start = Date.now();
  try {
    const response = await callAI(config, [
      { role: 'user', content: 'Respond with exactly: "Connection successful"' },
    ], { maxTokens: 20 });

    const latencyMs = Date.now() - start;
    return {
      success: true,
      message: `Connected to ${config.name} (${config.type}) — model: ${response.model}, latency: ${latencyMs}ms`,
      latencyMs,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to connect to ${config.name}: ${error.message}`,
    };
  }
}

export { PROVIDER_DEFAULTS };
