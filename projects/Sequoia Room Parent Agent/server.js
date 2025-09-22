const { z } = require('zod');

// Environment variables or constants
const N8N_BASE = process.env.N8N_BASE || 'your-n8n-base-url';
const N8N_KEY = process.env.N8N_KEY || 'your-n8n-api-key';

// Simple server mock for demonstration - replace with your actual server implementation
class SimpleServer {
  constructor() {
    this.tools = [];
  }
  
  tool(name, config) {
    this.tools.push({ name, config });
    console.log(`Registered tool: ${name}`);
  }
  
  start() {
    console.log(`Server starting with ${this.tools.length} tools registered`);
    console.log('Tools:', this.tools.map(t => t.name));
  }
}

const server = new SimpleServer();

// 2) Get workflow by ID
server.tool("Call_WF_get_workflow_", {
  description: "Get workflow details from n8n by ID.",
  inputSchema: z.object({
    workflowId: z.string().min(1)
  }),
  handler: async ({ workflowId }) => {
    const res = await fetch(`${N8N_BASE}/rest/workflows/${encodeURIComponent(workflowId)}`, {
      headers: { "X-N8N-API-KEY": N8N_KEY }
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`n8n GET /rest/workflows/${workflowId} -> ${res.status} ${res.statusText} ${body}`);
    }
    const data = await res.json();
    // guard against accidental empty return
    if (!data) throw new Error("Empty JSON from n8n");
    return { content: [{ type: "json", json: data }] };
  },
});

// 3) Diff preview (example skeleton)
server.tool("Call_WF_diff_preview_", {
  description: "Preview applying a workflow patch (no write).",
  inputSchema: z.object({
    workflowId: z.string().min(1),
    patch: z.any() // your diff format
  }),
  handler: async ({ workflowId, patch }) => {
    // ... compute a diff locally; do NOT call n8n yet, just return preview
    return { content: [{ type: "json", json: { ok: true, workflowId, preview: patch } }] };
  },
});

// 4) Apply workflow (safe)
server.tool("Call_WF_apply_workflow_safe_", {
  description: "Apply workflow patch using PATCH to n8n.",
  inputSchema: z.object({
    workflowId: z.string().min(1),
    patch: z.any()
  }),
  handler: async ({ workflowId, patch }) => {
    const res = await fetch(`${N8N_BASE}/rest/workflows/${encodeURIComponent(workflowId)}`, {
      method: "PATCH",
      headers: {
        "X-N8N-API-KEY": N8N_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(patch)
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`n8n PATCH /rest/workflows/${workflowId} -> ${res.status} ${res.statusText} ${body}`);
    }
    const updated = await res.json();
    return { content: [{ type: "json", json: { ok: true, updated } }] };
  },
});

server.start();