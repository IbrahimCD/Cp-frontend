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
    const node = { name: name.trim(), children: [], checked: false, open: true, isFolder };
    while (stack.length && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }
    stack[stack.length - 1].children.push(node);
    stack.push({ children: node.children, depth });
  });
  return root;
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
      node.checked = !node.checked;
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
        <Box display="flex" justifyContent="center" mb={2}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleParse}
            sx={{ minWidth: 180, fontWeight: 600 }}
          >
            Parse Tree
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {tree.length > 0 && (
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
        )}
      </Paper>
    </Container>
  );
} 