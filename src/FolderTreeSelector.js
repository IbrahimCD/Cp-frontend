import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Tooltip,
  Divider,
  Container,
  IconButton
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import RemoveDoneIcon from '@mui/icons-material/RemoveDone';

// Helper to parse a simple tree text into a nested structure
function parseTree(text) {
  const lines = text.split('\n').filter(Boolean);
  const root = [];
  const stack = [{ children: root, depth: -1 }];

  lines.forEach(line => {
    const match = line.match(/^(\s*)([├└│─ ]*)([^\s].*)$/);
    if (!match) return;
    const [, indent, , name] = match;
    const depth = indent.length + (line.includes('│') || line.includes('├') || line.includes('└') ? 1 : 0);
    const isFolder = name.endsWith('/') || !name.includes('.');
    const node = { name: name.trim(), children: [], checked: false, indeterminate: false, open: true, isFolder };
    while (stack.length && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }
    stack[stack.length - 1].children.push(node);
    stack.push({ children: node.children, depth });
  });
  return root;
}

// Recursively update check state for a node and its children
function setCheckState(node, checked) {
  node.checked = checked;
  node.indeterminate = false;
  if (node.children.length > 0) {
    node.children.forEach(child => setCheckState(child, checked));
  }
}

// Recursively update parent indeterminate/checked state
function updateParentState(tree, path) {
  if (path.length === 0) return;
  const parentPath = path.slice(0, -1);
  let parent = tree;
  for (let i = 0; i < parentPath.length; i++) {
    parent = parent[parentPath[i]].children;
  }
  const idx = path[path.length - 1];
  const node = parent[idx];
  // Now update up the tree
  let currentPath = parentPath;
  while (currentPath.length > 0) {
    let parentNode = tree;
    for (let i = 0; i < currentPath.length; i++) {
      parentNode = parentNode[currentPath[i]];
    }
    const allChecked = parentNode.children.every(child => child.checked);
    const noneChecked = parentNode.children.every(child => !child.checked && !child.indeterminate);
    parentNode.checked = allChecked;
    parentNode.indeterminate = !allChecked && !noneChecked;
    currentPath = currentPath.slice(0, -1);
  }
}

// Recursively collect selected files/folders
function collectSelected(nodes, path = '', arr = []) {
  nodes.forEach(node => {
    if (node.checked) {
      arr.push(path + node.name);
    }
    if (node.children.length > 0) {
      collectSelected(node.children, path + node.name + '/', arr);
    }
  });
  return arr;
}

function TreeNode({ node, onToggle, onExpand, path }) {
  return (
    <>
      <ListItem
        sx={{ pl: `${path.length * 2}px`, transition: 'background 0.2s' }}
        secondaryAction={
          node.children.length > 0 ? (
            <Tooltip title={node.open ? 'Collapse' : 'Expand'}>
              <IconButton edge="end" onClick={() => onExpand(path)}>
                {node.open ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
          ) : null
        }
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
          <Checkbox
            edge="start"
            checked={node.checked}
            indeterminate={node.indeterminate}
            tabIndex={-1}
            disableRipple
            onChange={() => onToggle(path)}
            inputProps={{ 'aria-label': node.name }}
          />
          {node.isFolder ? <FolderIcon color="primary" sx={{ ml: 1 }} /> : <InsertDriveFileIcon color="action" sx={{ ml: 1 }} />}
        </ListItemIcon>
        <ListItemText
          primary={node.name}
          primaryTypographyProps={{
            fontWeight: node.isFolder ? 600 : 400,
            color: node.isFolder ? 'primary.main' : 'text.primary',
            sx: { userSelect: 'text' }
          }}
        />
      </ListItem>
      {node.children.length > 0 && (
        <Collapse in={node.open} timeout="auto" unmountOnExit>
          <List disablePadding>
            {node.children.map((child, i) => (
              <TreeNode
                key={i}
                node={child}
                onToggle={onToggle}
                onExpand={onExpand}
                path={[...path, i]}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
}

export default function FolderTreeSelector() {
  const [input, setInput] = useState('');
  const [tree, setTree] = useState([]);
  const [error, setError] = useState('');

  const handleParse = () => {
    try {
      const parsed = parseTree(input);
      setTree(parsed);
      setError(parsed.length === 0 ? 'No valid tree structure found.' : '');
    } catch (e) {
      setError('Failed to parse tree. Please check your input.');
    }
  };

  const handleToggle = (path) => {
    setTree(prevTree => {
      const newTree = JSON.parse(JSON.stringify(prevTree));
      let node = newTree;
      for (let i = 0; i < path.length; i++) {
        node = node[path[i]];
      }
      const newChecked = !node.checked;
      setCheckState(node, newChecked);
      updateParentState(newTree, path);
      return newTree;
    });
  };

  const handleExpand = (path) => {
    setTree(prevTree => {
      const newTree = JSON.parse(JSON.stringify(prevTree));
      let node = newTree;
      for (let i = 0; i < path.length; i++) {
        node = node[path[i]];
      }
      node.open = !node.open;
      return newTree;
    });
  };

  const handleClear = () => {
    setInput('');
    setTree([]);
    setError('');
  };

  const handleSelectAll = () => {
    setTree(prevTree => {
      const newTree = JSON.parse(JSON.stringify(prevTree));
      newTree.forEach(node => setCheckState(node, true));
      return newTree;
    });
  };

  const handleDeselectAll = () => {
    setTree(prevTree => {
      const newTree = JSON.parse(JSON.stringify(prevTree));
      newTree.forEach(node => setCheckState(node, false));
      return newTree;
    });
  };

  const selected = collectSelected(tree);

  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom align="center">
          Folder Tree Selector
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" mb={2}>
          Paste your folder tree (e.g. from <b>tree</b> command), then tick/untick any files or folders.
        </Typography>
        <TextField
          label="Paste Folder Tree"
          multiline
          minRows={6}
          maxRows={12}
          fullWidth
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Example:\nsrc\n├── App.js\n├── index.js\n└── components\n    └── Button.js`}
          variant="outlined"
          sx={{ mb: 2 }}
          error={!!error}
          helperText={error}
        />
        <Box display="flex" justifyContent="center" gap={2} mb={2}>
          <Tooltip title="Parse the pasted tree"><span><Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleParse}
            sx={{ minWidth: 120, fontWeight: 600 }}
            disabled={!input.trim()}
          >
            Parse Tree
          </Button></span></Tooltip>
          <Tooltip title="Clear input and tree"><span><Button
            variant="outlined"
            color="error"
            size="large"
            onClick={handleClear}
            sx={{ minWidth: 120, fontWeight: 600 }}
            startIcon={<ClearIcon />}
            disabled={!input && tree.length === 0}
          >
            Clear
          </Button></span></Tooltip>
        </Box>
        {tree.length > 0 && (
          <>
            <Box display="flex" justifyContent="center" gap={2} mb={2}>
              <Tooltip title="Select all files and folders"><span><Button
                variant="outlined"
                color="success"
                size="small"
                onClick={handleSelectAll}
                startIcon={<DoneAllIcon />}
              >
                Select All
              </Button></span></Tooltip>
              <Tooltip title="Deselect all files and folders"><span><Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={handleDeselectAll}
                startIcon={<RemoveDoneIcon />}
              >
                Deselect All
              </Button></span></Tooltip>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Paper elevation={1} sx={{ p: 2, background: '#f9f9f9' }}>
              <List>
                {tree.map((node, i) => (
                  <TreeNode
                    key={i}
                    node={node}
                    onToggle={handleToggle}
                    onExpand={handleExpand}
                    path={[i]}
                  />
                ))}
              </List>
            </Paper>
            <Box mt={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Selected: {selected.length}
              </Typography>
              {selected.length > 0 && (
                <Box mt={1} sx={{ maxHeight: 120, overflow: 'auto', background: '#f5f5f5', borderRadius: 1, p: 1 }}>
                  {selected.map((item, idx) => (
                    <Typography key={idx} variant="body2" sx={{ wordBreak: 'break-all' }}>{item}</Typography>
                  ))}
                </Box>
              )}
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
} 