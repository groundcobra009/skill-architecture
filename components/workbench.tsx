"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type OnNodeDrag,
} from "@xyflow/react";
import {
  FilePlus2,
  Loader2,
  Save,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import type { Diagram, GraphNodeData, SkillFlow } from "../app/lib/types";
import { demoDiagram } from "../app/lib/demo-diagram";

const catClass: Record<string, string> = {
  external: "node-external",
  entry: "node-entry",
  detail: "node-detail",
  tool: "node-tool",
  parallel: "node-parallel",
  config: "node-config",
  output: "node-output",
};

const catLabel: Record<string, string> = {
  external: "外部",
  entry: "入口",
  detail: "詳細",
  tool: "ツール",
  parallel: "並列",
  config: "設定",
  output: "出力",
};

function toFlowNodes(diagram: Diagram, activeFlow: SkillFlow | null): Node[] {
  const highlighted = new Set(activeFlow?.nodes ?? []);
  return diagram.nodes.map((node) => ({
    id: node.id,
    position: { x: node.x, y: node.y },
    data: { label: node.label },
    className: `flow-node ${catClass[node.cat] ?? "node-detail"} ${
      activeFlow && !highlighted.has(node.id) ? "is-dim" : ""
    }`,
    style: { width: 168, minHeight: 58 },
  }));
}

function toFlowEdges(diagram: Diagram, activeFlow: SkillFlow | null): Edge[] {
  const highlighted = new Set(activeFlow?.conns ?? []);
  return diagram.connections.map((conn) => {
    const key = `${conn.from}→${conn.to}`;
    const isActive = !activeFlow || highlighted.has(key);
    return {
      id: key,
      source: conn.from,
      target: conn.to,
      label: conn.label,
      type: "smoothstep",
      animated: conn.type === "par" || highlighted.has(key),
      markerEnd: { type: MarkerType.ArrowClosed },
      className: `${conn.type === "dashed" ? "edge-dashed" : ""} ${isActive ? "" : "is-dim"}`,
      style: {
        stroke: highlighted.has(key) ? "#2563eb" : conn.type === "par" ? "#8b5cf6" : "#94a3b8",
        strokeWidth: highlighted.has(key) ? 2.8 : 1.8,
      },
    };
  });
}

function blankDiagram(): Diagram {
  return {
    title: "新しいスキル",
    sourceName: "local draft",
    summary: "スキル構造の下書き。",
    nodes: demoDiagram.nodes.map((node, index) => ({
      ...node,
      id: `draft_${index + 1}`,
      label: index === 0 ? "入力" : node.label,
    })),
    connections: [
      { from: "draft_1", to: "draft_2", type: "normal" },
      { from: "draft_2", to: "draft_3", type: "normal" },
    ],
    flows: [
      {
        id: "draft_flow",
        name: "メインフロー",
        desc: "下書きの処理経路。",
        nodes: ["draft_1", "draft_2", "draft_3"],
        conns: ["draft_1→draft_2", "draft_2→draft_3"],
        steps: [
          { n: 1, text: "入力を受け取る", detail: "対象資料を受け取る。", exec: "claude" },
          { n: 2, text: "構造化する", detail: "ノードと接続に整理する。", exec: "claude" },
        ],
      },
    ],
  };
}

export default function Workbench() {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSourceName, setAiSourceName] = useState("skill-architecture");
  const [aiContent, setAiContent] = useState("");
  const [status, setStatus] = useState("");

  const active = diagrams[activeIndex] ?? demoDiagram;
  const activeFlow = active.flows.find((flow) => flow.id === selectedFlowId) ?? null;
  const selectedNode = active.nodes.find((node) => node.id === selectedNodeId) ?? null;

  const nodes = useMemo(() => toFlowNodes(active, activeFlow), [active, activeFlow]);
  const edges = useMemo(() => toFlowEdges(active, activeFlow), [active, activeFlow]);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/diagrams", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setDiagrams(json.diagrams.length ? json.diagrams : [demoDiagram]);
      setSelectedFlowId(json.diagrams[0]?.flows[0]?.id ?? demoDiagram.flows[0].id);
    } catch (error) {
      setDiagrams([demoDiagram]);
      setSelectedFlowId(demoDiagram.flows[0].id);
      setStatus(error instanceof Error ? error.message : "データ取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateActive = (next: Diagram) => {
    setDiagrams((current) => current.map((diagram, index) => (index === activeIndex ? next : diagram)));
  };

  const onNodeDragStop: OnNodeDrag = (_, node) => {
    updateActive({
      ...active,
      nodes: active.nodes.map((item) =>
        item.id === node.id ? { ...item, x: Math.round(node.position.x), y: Math.round(node.position.y) } : item,
      ),
    });
  };

  const save = async () => {
    setSaving(true);
    setStatus("");
    const res = await fetch("/api/diagrams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: active._id, ...active }),
    });
    if (res.ok) {
      const json = await res.json();
      updateActive({ ...active, _id: json.id, updatedAt: Date.now() });
      setStatus("保存しました。");
    } else {
      setStatus("保存できませんでした。");
    }
    setSaving(false);
  };

  const generate = async () => {
    setSaving(true);
    setStatus("");
    const res = await fetch("/api/ai/diagram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceName: aiSourceName, content: aiContent }),
    });
    const json = await res.json();
    if (!res.ok) {
      setStatus(json.error || "AI 生成に失敗しました。");
      setSaving(false);
      return;
    }
    setDiagrams((current) => [json, ...current]);
    setActiveIndex(0);
    setSelectedFlowId(json.flows?.[0]?.id ?? null);
    setAiOpen(false);
    setSaving(false);
  };

  const addDraft = () => {
    setDiagrams((current) => [blankDiagram(), ...current]);
    setActiveIndex(0);
    setSelectedNodeId(null);
    setSelectedFlowId("draft_flow");
  };

  return (
    <section className="workspace">
      <aside className="left-rail">
        <div className="rail-actions">
          <button className="primary-button" onClick={addDraft}>
            <FilePlus2 size={16} />
            新規
          </button>
          <button className="ghost-button" onClick={() => setAiOpen((value) => !value)}>
            <WandSparkles size={16} />
            AI
          </button>
        </div>
        <div className="diagram-list">
          {diagrams.map((diagram, index) => (
            <button
              className={`diagram-tab ${index === activeIndex ? "active" : ""}`}
              key={`${diagram._id ?? diagram.title}-${index}`}
              onClick={() => {
                setActiveIndex(index);
                setSelectedFlowId(diagram.flows[0]?.id ?? null);
                setSelectedNodeId(null);
              }}
            >
              <strong>{diagram.title}</strong>
              <span>{diagram.sourceName}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="canvas-panel">
        <div className="editor-bar">
          <div className="title-edit">
            <input
              value={active.title}
              onChange={(event) => updateActive({ ...active, title: event.target.value })}
              aria-label="図のタイトル"
            />
            <input
              value={active.sourceName}
              onChange={(event) => updateActive({ ...active, sourceName: event.target.value })}
              aria-label="ソース名"
            />
          </div>
          <div className="legend-row">
            {Object.entries(catLabel).map(([key, label]) => (
              <span key={key} className={`legend-pill ${catClass[key]}`}>
                {label}
              </span>
            ))}
          </div>
          <button className="primary-button" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
            保存
          </button>
        </div>

        {aiOpen ? (
          <div className="ai-panel">
            <div>
              <input
                value={aiSourceName}
                onChange={(event) => setAiSourceName(event.target.value)}
                placeholder="ソース名"
              />
              <textarea
                value={aiContent}
                onChange={(event) => setAiContent(event.target.value)}
                placeholder="SKILL.md や README の内容を貼り付け"
              />
            </div>
            <button className="primary-button" onClick={generate} disabled={saving || aiContent.length < 80}>
              <Sparkles size={16} />
              生成
            </button>
          </div>
        ) : null}

        <div className="flow-shell">
          {loading ? (
            <div className="loading-state">
              <Loader2 className="spin" size={24} />
              読み込み中
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              minZoom={0.25}
              maxZoom={1.6}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onNodeDragStop={onNodeDragStop}
            >
              <Background color="#d7dee8" gap={22} />
              <Controls />
              <MiniMap pannable zoomable nodeStrokeWidth={3} />
            </ReactFlow>
          )}
        </div>
        {status ? <p className="status-line">{status}</p> : null}
      </div>

      <aside className="right-rail">
        <section className="side-section">
          <h2>フロー</h2>
          <div className="flow-list">
            {active.flows.map((flow) => (
              <button
                key={flow.id}
                className={`flow-button ${flow.id === selectedFlowId ? "active" : ""}`}
                onClick={() => setSelectedFlowId(flow.id)}
              >
                <strong>{flow.name}</strong>
                <span>{flow.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="side-section grow">
          <h2>{selectedNode ? "ノード" : activeFlow ? "ステップ" : "詳細"}</h2>
          {selectedNode ? (
            <NodeDetail node={selectedNode} />
          ) : activeFlow ? (
            <FlowSteps flow={activeFlow} />
          ) : (
            <p className="muted-text">{active.summary}</p>
          )}
        </section>
      </aside>
    </section>
  );
}

function NodeDetail({ node }: { node: GraphNodeData }) {
  return (
    <div className="detail-stack">
      <span className={`detail-cat ${catClass[node.cat] ?? "node-detail"}`}>{catLabel[node.cat] ?? node.cat}</span>
      <h3>{node.label}</h3>
      <p className="role-text">{node.role}</p>
      <p>{node.desc}</p>
    </div>
  );
}

function FlowSteps({ flow }: { flow: SkillFlow }) {
  return (
    <ol className="step-list">
      {flow.steps.map((step) => (
        <li key={`${flow.id}-${step.n}`}>
          <span>{step.n}</span>
          <div>
            <strong>{step.text}</strong>
            <p>{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
