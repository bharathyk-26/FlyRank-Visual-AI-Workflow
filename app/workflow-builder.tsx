 "use client";

import { useCallback, useMemo, useState } from "react";
import {
  addEdge,
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps
} from "@xyflow/react";

type DecisionNodeData = {
  label: string;
  prompt: string;
  result?: "YES" | "NO";
};

const initialNodes: Node<DecisionNodeData>[] = [
  {
    id: "decision-1",
    type: "decision",
    position: { x: 120, y: 180 },
    data: {
      label: "Check customer intent",
      prompt: "Does the message indicate a billing issue?"
    }
  },
  {
    id: "decision-2",
    type: "decision",
    position: { x: 500, y: 180 },
    data: {
      label: "Check urgency",
      prompt: "Is the issue urgent or blocking the customer?"
    }
  }
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "decision-1",
    target: "decision-2",
    markerEnd: { type: MarkerType.ArrowClosed }
  }
];

function DecisionNode({ data, selected }: NodeProps<Node<DecisionNodeData>>) {
  return (
    <div className={`node ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-title">{data.label}</div>
      <span className="node-type">AI DECISION · YES / NO</span>
      <div className="node-prompt">{data.prompt}</div>
      {data.result && (
        <div className={data.result === "YES" ? "yes" : "no"} style={{ marginTop: 9 }}>
          Result: {data.result}
        </div>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { decision: DecisionNode };

export default function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedId, setSelectedId] = useState("decision-1");
  const [testInput, setTestInput] = useState("I was charged twice for my subscription and cannot use my account.");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string>("");

  const selected = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? nodes[0],
    [nodes, selectedId]
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed }
          },
          eds
        )
      ),
    [setEdges]
  );

  const updateSelected = (field: keyof DecisionNodeData, value: string) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === selected.id
          ? { ...node, data: { ...node.data, [field]: value } }
          : node
      )
    );
  };

  const addDecisionNode = () => {
    const id = `decision-${Date.now()}`;
    setNodes((current) => [
      ...current,
      {
        id,
        type: "decision",
        position: { x: 220 + current.length * 30, y: 400 + (current.length % 3) * 80 },
        data: {
          label: `Decision ${current.length + 1}`,
          prompt: "Should this condition be accepted?"
        }
      }
    ]);
    setSelectedId(id);
  };

  const runWorkflow = async () => {
    setRunning(true);
    setResult("");
    try {
      const response = await fetch("/api/run-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: testInput,
          nodes: nodes.map((n) => ({ id: n.id, label: n.data.label, prompt: n.data.prompt })),
          edges
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Workflow failed");
      setResult(`${data.result} — ${data.reason}`);
      setNodes((current) =>
        current.map((n, index) =>
          index === 0 ? { ...n, data: { ...n.data, result: data.result } } : n
        )
      );
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Workflow failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="page">
      <header className="header">
        <div className="brand">FlyRank · Visual AI Workflow</div>
        <div className="badge">React Flow + Inngest + OpenAI</div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <h3>Workflow nodes</h3>
          <p className="muted">Drag-ready decision components. Each AI node returns YES or NO.</p>
          <div className="palette-card" onClick={addDecisionNode}>
            <strong>AI Decision</strong>
            <span className="muted">Click to add a decision node</span>
          </div>
          <div style={{ marginTop: 22 }}>
            <h3>Data flow</h3>
            <p className="muted">Input → Inngest workflow → OpenAI decision → YES/NO → result</p>
          </div>
        </aside>

        <section className="canvas">
          <div className="toolbar">
            <button onClick={runWorkflow} disabled={running}>
              {running ? "Running..." : "▶ Run workflow"}
            </button>
            <button className="secondary" onClick={addDecisionNode}>+ Decision</button>
          </div>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </section>

        <aside className="inspector">
          <h3>Decision inspector</h3>
          <p className="muted">Edit the selected AI decision step.</p>

          {selected && (
            <>
              <label className="form-label">Node name</label>
              <input
                className="input"
                value={selected.data.label}
                onChange={(e) => updateSelected("label", e.target.value)}
              />
              <label className="form-label">Decision prompt</label>
              <textarea
                className="textarea"
                value={selected.data.prompt}
                onChange={(e) => updateSelected("prompt", e.target.value)}
              />
            </>
          )}

          <label className="form-label">Test input</label>
          <textarea
            className="textarea"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
          />

          <button className="run" onClick={runWorkflow} disabled={running}>
            {running ? "Executing workflow..." : "Test AI decision"}
          </button>

          {result && <div className="result"><strong>Workflow result</strong><div style={{marginTop:7}}>{result}</div></div>}
        </aside>
      </div>
    </main>
  );
}