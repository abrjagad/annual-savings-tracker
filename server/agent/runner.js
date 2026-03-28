import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { agentTools } from "./tools.js";

const SYSTEM_PROMPT = `
You are a helpful, expert financial assistant connected to a user's personal finance tracker. 
You MUST use your custom tools to answer questions about user spending. 
Do NOT guess or estimate values yourself.
Always call the appropriate tool when needed, analyze the results returned by the tools, and provide a clear, finalized answer.

Guidelines:
- If a question asks for "top 5" or "biggest expenses", use the top_expenses tool.
- If a question asks about a specific category (e.g., "Groceries", "Food & Dining"), use the sum_by_category tool. Check the Valid Categories list implicitly before running it.
- If asking to compare two periods, use the compare_months tool.
- If a tool returns an error or empty data, inform the user gracefully instead of failing.
- Explain the findings clearly and concisely.

Always prioritize the tool output as the source of truth over any other potential knowledge.
`;

/**
 * Runs the AI agent loop with the given user prompt.
 * 
 * @param {string} userPrompt The user's question
 * @returns {Promise<{text: string, log: any[]}>}
 */
export async function runAgent(userPrompt) {
	try {
        console.log(`[Agent] Received query: "${userPrompt}"`);
        
        let result;
        try {
            result = await generateText({
                model: google("gemini-2.5-flash"),
                system: SYSTEM_PROMPT,
                prompt: userPrompt,
                tools: agentTools,
                maxSteps: 5,
            });

            if (!result.text && result.steps && result.steps.length > 0) {
                const hasToolResult = result.steps.some(s => s.toolResults && s.toolResults.length > 0);
                if (hasToolResult) {
                    throw new Error("Gemini returned empty text after tool execution. Possibly Quota Exceeded.");
                }
            }
        } catch (geminiError) {
            console.warn("[Agent] Gemini failed, falling back to Ollama:", geminiError.message);
            
            const { createOllama } = await import("ollama-ai-provider-v2");
            const ollama = createOllama();
            
            result = await generateText({
                model: ollama("gemma3:1b"),
                system: SYSTEM_PROMPT,
                prompt: userPrompt,
                tools: agentTools,
                maxSteps: 5,
            });
        }

        const log = result.steps.map((step, index) => {
            const toolCalls = step.toolCalls?.map(tc => ({
                toolName: tc.toolName,
                args: tc.args
            })) || [];

            const toolResults = step.toolResults?.map(tr => ({
                toolName: tr.toolName,
                result: tr.result
            })) || [];

            return {
                step: index + 1,
                text: step.text,
                toolCalls,
                toolResults
            };
        });

        console.log(`[Agent] Query complete.`);
        console.log(`[Agent] Final Response: ${result.text}`);
        console.log(`[Agent] Raw Result Steps:`, JSON.stringify(result.steps, null, 2));
        console.log(`[Agent] Steps Log:`, JSON.stringify(log, null, 2));

		return {
			text: result.text,
			log: log
		};
	} catch (error) {
		console.error("[Agent] Error running agent:", error);
		throw new Error("Failed to execute agent: " + error.message);
	}
}
