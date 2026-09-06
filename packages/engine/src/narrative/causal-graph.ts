import { CausalGraph, CausalNode } from '@life/schema';

export interface CausalChainStep {
  atAge: number;
  title: string;
  choiceText: string;
  summary?: string | undefined;
}

export class CausalGraphTracker {
  private graph: CausalGraph;

  constructor(initialGraph: CausalGraph = { nodes: [], edges: [] }) {
    this.graph = {
      nodes: [...initialGraph.nodes],
      edges: [...initialGraph.edges],
    };
  }

  public getGraph(): CausalGraph {
    return this.graph;
  }

  public recordDecision(
    eventId: string,
    choiceId: string,
    atAge: number,
    title: string,
    choiceText: string,
    causedByNodeId?: string,
    tags: string[] = []
  ): string {
    const nodeId = `node_${atAge}_${eventId}_${choiceId}_${this.graph.nodes.length}`;
    const node: CausalNode = {
      id: nodeId,
      eventId,
      choiceId,
      atAge,
      title,
      choiceText,
      causedByNodeId,
      tags,
    };

    this.graph.nodes.push(node);

    if (causedByNodeId) {
      this.graph.edges.push({
        fromNodeId: causedByNodeId,
        toNodeId: nodeId,
        relationship: 'caused',
      });
    }

    return nodeId;
  }

  /**
   * "Why did this happen?" API from blueprint §93
   * Traces back through the causal graph to explain the life outcome.
   */
  public explain(outcomeTagOrEventId: string): CausalChainStep[] {
    // Find matching target node
    const targetNode = this.graph.nodes
      .slice()
      .reverse()
      .find(
        (n) =>
          n.eventId === outcomeTagOrEventId ||
          n.tags.includes(outcomeTagOrEventId) ||
          n.choiceId === outcomeTagOrEventId
      );

    if (!targetNode) return [];

    const chain: CausalChainStep[] = [];
    let current: CausalNode | undefined = targetNode;
    const visited = new Set<string>();

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      chain.unshift({
        atAge: current.atAge,
        title: current.title,
        choiceText: current.choiceText,
        summary: current.outcomeSummary,
      });

      if (current.causedByNodeId) {
        current = this.graph.nodes.find((n) => n.id === current?.causedByNodeId);
      } else {
        // Find ancestor connected via edge
        const edge = this.graph.edges.find((e) => e.toNodeId === current?.id);
        current = edge ? this.graph.nodes.find((n) => n.id === edge.fromNodeId) : undefined;
      }
    }

    return chain;
  }
}
