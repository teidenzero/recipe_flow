import { NodeKinds } from "../../constants/nodeKinds";

export function findStartNode(nodes) {
  return nodes.find((node) => node.type === NodeKinds.START) || null;
}

export function getNextNodeId(currentId, edges) {
  if (!currentId) return null;
  const outgoing = edges.filter((edge) => edge.source === currentId);
  if (!outgoing.length) return null;
  // Return first by insertion order for determinism
  return outgoing[0].target || null;
}

export function hasReachableInteractivePath(startNodeId, nodes, edges) {
  if (!startNodeId) return false;
  const visited = new Set();
  const queue = [startNodeId];
  while (queue.length) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    const node = nodes.find((n) => n.id === current);
    if (!node) continue;
    if (node.type === NodeKinds.INGREDIENT || node.type === NodeKinds.STEP) {
      return true;
    }
    const outgoing = edges.filter((edge) => edge.source === current);
    outgoing.forEach((edge) => queue.push(edge.target));
  }
  return false;
}
