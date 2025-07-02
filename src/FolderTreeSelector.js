import React, { useState } from 'react';

// Helper to parse a simple tree text into a nested structure
function parseTree(text) {
  const lines = text.split('\n').filter(Boolean);
  const root = [];
  const stack = [{children: root, depth: -1}];

  lines.forEach(line => {
    const match = line.match(/^(\s*)([├└│─ ]*)([^\s].*)$/);
    if (!match) return;
    const [, indent, , name] = match;
    const depth = indent.length + (line.includes('│') || line.includes('├') || line.includes('└') ? 1 : 0);
    const node = { name: name.trim(), children: [], checked: false };
    while (stack.length && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }
    stack[stack.length - 1].children.push(node);
    stack.push({children: node.children, depth});
  });
  return root;
}

function renderTree(nodes, onToggle, path = []) {
  return (
    <ul style={{ listStyle: 'none', paddingLeft: 20 }}>
      {nodes.map((node, i) => {
        const nodePath = [...path, i];
        return (
          <li key={nodePath.join('-')}>
            <input
              type="checkbox"
              checked={node.checked}
              onChange={() => onToggle(nodePath)}
            />
            {node.name}
            {node.children.length > 0 && renderTree(node.children, onToggle, nodePath)}
          </li>
        );
      })}
    </ul>
  );
}

export default function FolderTreeSelector() {
  const [input, setInput] = useState('');
  const [tree, setTree] = useState([]);

  const handleParse = () => {
    setTree(parseTree(input));
  };

  const handleToggle = (path) => {
    setTree(prevTree => {
      const newTree = JSON.parse(JSON.stringify(prevTree));
      let node = newTree;
      for (let i = 0; i < path.length; i++) {
        node = node[path[i]];
      }
      node.checked = !node.checked;
      return newTree;
    });
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2>Paste Folder Tree</h2>
      <textarea
        rows={8}
        style={{ width: '100%' }}
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={`Paste your folder tree here (e.g. from 'tree' command)...`}
      />
      <button onClick={handleParse} style={{ margin: '10px 0' }}>Parse</button>
      <div>
        {tree.length > 0 && renderTree(tree, handleToggle)}
      </div>
    </div>
  );
} 