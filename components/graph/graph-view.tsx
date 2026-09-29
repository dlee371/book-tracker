"use client";

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from "d3-force";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MinusIcon, PlusIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  Graph,
  GraphEdge,
  GraphNode,
  GraphNodeKind,
} from "@/lib/services/graph";

type Point = { x: number; y: number };
type Transform = { x: number; y: number; k: number };

const IDENTITY: Transform = { x: 0, y: 0, k: 1 };
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4;
const CLICK_TOLERANCE = 4; // px of movement before a press counts as a drag

// Runs the force simulation to completion up front (no animation), so the
// graph appears settled. d3-force is deterministic for a given node order,
// so the server and the browser compute the same positions.
function computeLayout(graph: Graph): Map<string, Point> {
  type SimNode = SimulationNodeDatum & { id: string };
  const simNodes: SimNode[] = graph.nodes.map((node) => ({ id: node.id }));
  const simLinks = graph.edges.map((edge) => ({ ...edge }));

  forceSimulation(simNodes)
    // Connected nodes attract; idea-to-idea links are a bit longer so typed
    // connections stay readable.
    .force(
      "link",
      forceLink<SimNode, (typeof simLinks)[number]>(simLinks)
        .id((node) => node.id)
        .distance((link) => (link.kind === "source" || link.kind === "tag" ? 70 : 110)),
    )
    .force("charge", forceManyBody().strength(-260)) // all nodes repel
    .force("collide", forceCollide(30)) // no overlapping
    .force("x", forceX(0).strength(0.04)) // gentle pull to the middle
    .force("y", forceY(0).strength(0.04))
    .stop()
    .tick(300);

  return new Map(simNodes.map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]));
}

export function GraphView({ graph }: { graph: Graph }) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);

  const initialLayout = useMemo(() => computeLayout(graph), [graph]);
  const [positions, setPositions] = useState(initialLayout);
  const [transform, setTransform] = useState<Transform>(IDENTITY);
  const [activeId, setActiveId] = useState<string | null>(null);

  // The visible area: the initial layout's extent plus room for labels.
  const viewBox = useMemo(() => {
    const points = [...initialLayout.values()];
    if (points.length === 0) return "-100 -100 200 200";
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const pad = 80;
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    return `${minX} ${minY} ${Math.max(...xs) + pad - minX} ${Math.max(...ys) + pad - minY}`;
  }, [initialLayout]);

  // Which nodes to keep bright while one is hovered/focused.
  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const { source, target } of graph.edges) {
      if (!map.has(source)) map.set(source, new Set());
      if (!map.has(target)) map.set(target, new Set());
      map.get(source)!.add(target);
      map.get(target)!.add(source);
    }
    return map;
  }, [graph.edges]);

  const isLit = (id: string) =>
    !activeId || id === activeId || !!neighbors.get(activeId)?.has(id);

  // Screen coordinates -> SVG viewBox coordinates.
  function toViewBox(clientX: number, clientY: number): Point {
    const svg = svgRef.current!;
    const point = new DOMPoint(clientX, clientY).matrixTransform(
      svg.getScreenCTM()!.inverse(),
    );
    return { x: point.x, y: point.y };
  }

  function zoomAt(center: Point, factor: number) {
    setTransform((t) => {
      const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, t.k * factor));
      // Keep the point under the cursor in place while scaling.
      return {
        k,
        x: center.x - ((center.x - t.x) * k) / t.k,
        y: center.y - ((center.y - t.y) * k) / t.k,
      };
    });
  }

  // Wheel zoom. Attached natively because React's wheel listener is passive,
  // and preventDefault (to stop the page scrolling) needs a non-passive one.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(toViewBox(event.clientX, event.clientY), Math.exp(-event.deltaY * 0.0015));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  // Pointer handling: pressing a node drags it (or opens it, if it barely
  // moved); pressing the background pans.
  const gesture = useRef<{
    nodeId: string | null;
    start: Point; // screen px, for the click tolerance
    last: Point; // viewBox coords, for deltas
    moved: boolean;
  } | null>(null);

  function onPointerDown(event: React.PointerEvent, nodeId: string | null) {
    event.stopPropagation();
    svgRef.current!.setPointerCapture(event.pointerId);
    gesture.current = {
      nodeId,
      start: { x: event.clientX, y: event.clientY },
      last: toViewBox(event.clientX, event.clientY),
      moved: false,
    };
  }

  function onPointerMove(event: React.PointerEvent) {
    const g = gesture.current;
    if (!g) return;
    if (Math.hypot(event.clientX - g.start.x, event.clientY - g.start.y) > CLICK_TOLERANCE) {
      g.moved = true;
    }
    const now = toViewBox(event.clientX, event.clientY);
    const dx = now.x - g.last.x;
    const dy = now.y - g.last.y;
    g.last = now;
    if (!g.moved) return;

    if (g.nodeId) {
      const id = g.nodeId;
      setPositions((prev) => {
        const next = new Map(prev);
        const p = prev.get(id)!;
        next.set(id, { x: p.x + dx / transform.k, y: p.y + dy / transform.k });
        return next;
      });
    } else {
      setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
    }
  }

  function onPointerUp() {
    const g = gesture.current;
    gesture.current = null;
    if (g?.nodeId && !g.moved) {
      const node = graph.nodes.find((n) => n.id === g.nodeId);
      if (node) router.push(node.href);
    }
  }

  function zoomButton(factor: number) {
    const [x, y, w, h] = viewBox.split(" ").map(Number);
    zoomAt({ x: x + w / 2, y: y + h / 2 }, factor);
  }

  return (
    <div className="grid gap-3">
      <Legend />
      <div className="relative overflow-hidden rounded-xl border bg-background">
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="h-[65vh] w-full cursor-grab touch-none select-none active:cursor-grabbing"
          onPointerDown={(e) => onPointerDown(e, null)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (gesture.current = null)}
          role="group"
          aria-label="Knowledge graph. Use Tab to move between items and Enter to open one."
        >
          <defs>
            <marker
              id="graph-arrow"
              viewBox="0 0 10 10"
              refX={22} // stop the arrowhead at the target's edge, not center
              refY={5}
              markerWidth={7}
              markerHeight={7}
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-foreground/70" />
            </marker>
          </defs>
          <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
            {graph.edges.map((edge, i) => (
              <Edge
                key={i}
                edge={edge}
                from={positions.get(edge.source)!}
                to={positions.get(edge.target)!}
                lit={!activeId || edge.source === activeId || edge.target === activeId}
              />
            ))}
            {graph.nodes.map((node) => (
              <Node
                key={node.id}
                node={node}
                at={positions.get(node.id)!}
                lit={isLit(node.id)}
                onPointerDown={(e) => onPointerDown(e, node.id)}
                onActivate={() => router.push(node.href)}
                onHover={(on) => setActiveId(on ? node.id : null)}
              />
            ))}
          </g>
        </svg>
        <div className="absolute right-2 bottom-2 flex gap-1">
          <Button size="icon-sm" variant="outline" aria-label="Zoom in" onClick={() => zoomButton(1.3)}>
            <PlusIcon />
          </Button>
          <Button size="icon-sm" variant="outline" aria-label="Zoom out" onClick={() => zoomButton(1 / 1.3)}>
            <MinusIcon />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="Reset view"
            onClick={() => {
              setTransform(IDENTITY);
              setPositions(initialLayout);
            }}
          >
            <RotateCcwIcon />
          </Button>
        </div>
      </div>
      <ListView graph={graph} />
    </div>
  );
}

const KIND_FILL: Record<GraphNodeKind, string> = {
  idea: "fill-node-idea",
  book: "fill-node-book",
  tag: "fill-node-tag",
};

function Shape({ kind, x = 0, y = 0 }: { kind: GraphNodeKind; x?: number; y?: number }) {
  // Shape as well as color, so node types are never told apart by color
  // alone. The background-colored ring keeps marks legible over lines.
  const common = `${KIND_FILL[kind]} stroke-background`;
  if (kind === "idea") return <circle cx={x} cy={y} r={9} className={common} strokeWidth={2} />;
  if (kind === "book")
    return <rect x={x - 9} y={y - 12} width={18} height={24} rx={3} className={common} strokeWidth={2} />;
  return (
    <rect
      x={x - 6}
      y={y - 6}
      width={12}
      height={12}
      transform={`rotate(45 ${x} ${y})`}
      className={common}
      strokeWidth={2}
    />
  );
}

function truncate(text: string, max = 28) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function Node({
  node,
  at,
  lit,
  onPointerDown,
  onActivate,
  onHover,
}: {
  node: GraphNode;
  at: Point;
  lit: boolean;
  onPointerDown: (event: React.PointerEvent) => void;
  onActivate: () => void;
  onHover: (on: boolean) => void;
}) {
  return (
    <g
      transform={`translate(${at.x} ${at.y})`}
      className="cursor-pointer outline-none transition-opacity"
      opacity={lit ? 1 : 0.15}
      tabIndex={0}
      role="link"
      aria-label={`${node.kind}: ${node.label}`}
      onPointerDown={onPointerDown}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onActivate();
      }}
    >
      <title>{node.label}</title>
      {/* Invisible hit area, larger than the mark, so it's easy to grab. */}
      <circle r={16} className="fill-transparent" />
      <Shape kind={node.kind} />
      <text
        y={node.kind === "book" ? 26 : 22}
        textAnchor="middle"
        className="fill-foreground stroke-background text-[11px] [paint-order:stroke]"
        strokeWidth={3}
      >
        {truncate(node.label)}
      </text>
    </g>
  );
}

function Edge({
  edge,
  from,
  to,
  lit,
}: {
  edge: GraphEdge;
  from: Point;
  to: Point;
  lit: boolean;
}) {
  const typed = edge.kind !== "source" && edge.kind !== "tag";
  const directional = edge.kind === "SUPPORTS" || edge.kind === "EXTENDS";
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      className={typed ? "stroke-foreground/60" : "stroke-muted-foreground/30"}
      strokeWidth={typed ? 2 : 1}
      strokeDasharray={edge.kind === "CONTRADICTS" ? "6 4" : undefined}
      markerEnd={directional ? "url(#graph-arrow)" : undefined}
      opacity={lit ? 1 : 0.15}
    />
  );
}

function Legend() {
  const node = (kind: GraphNodeKind, label: string) => (
    <span className="flex items-center gap-1.5">
      <svg width="16" height="16" viewBox="-12 -12 24 24" aria-hidden>
        <Shape kind={kind} />
      </svg>
      {label}
    </span>
  );
  const line = (label: string, props: React.SVGProps<SVGLineElement>) => (
    <span className="flex items-center gap-1.5">
      <svg width="28" height="10" aria-hidden>
        <line x1="2" y1="5" x2="26" y2="5" {...props} />
      </svg>
      {label}
    </span>
  );
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
      {node("idea", "Idea")}
      {node("book", "Book")}
      {node("tag", "Tag")}
      {line("Supports / builds on (→)", { className: "stroke-foreground/60", strokeWidth: 2 })}
      {line("Contradicts", { className: "stroke-foreground/60", strokeWidth: 2, strokeDasharray: "6 4" })}
      {line("Related", { className: "stroke-foreground/60", strokeWidth: 2 })}
      {line("Source / tag", { className: "stroke-muted-foreground/40", strokeWidth: 1 })}
    </div>
  );
}

// The same information without the picture: every node, grouped by type.
function ListView({ graph }: { graph: Graph }) {
  const groups: { kind: GraphNodeKind; title: string }[] = [
    { kind: "idea", title: "Ideas" },
    { kind: "book", title: "Books" },
    { kind: "tag", title: "Tags" },
  ];
  return (
    <details className="text-sm">
      <summary className="w-fit cursor-pointer text-xs text-muted-foreground">
        Show as list
      </summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {groups.map(({ kind, title }) => {
          const nodes = graph.nodes.filter((n) => n.kind === kind);
          if (nodes.length === 0) return null;
          return (
            <div key={kind} className="grid content-start gap-1">
              <h3 className="font-medium">{title}</h3>
              {nodes.map((n) => (
                <Link key={n.id} href={n.href} className="underline-offset-4 hover:underline">
                  {n.label}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </details>
  );
}
