import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  CircularProgress, 
  Link, 
  List, 
  ListItem, 
  ListItemText, 
  ToggleButton, 
  ToggleButtonGroup,
  Grow
} from '@mui/material';
import { jsPDF } from 'jspdf';

function App() {
  // Mode: 'normal' or 'track'
  const [mode, setMode] = useState('normal');

  // Normal mode states:
  const [normalFiles, setNormalFiles] = useState([]);
  const [normalDownloadUrl, setNormalDownloadUrl] = useState('');
  const [normalLoading, setNormalLoading] = useState(false);
  const [normalError, setNormalError] = useState('');
  const [normalTimer, setNormalTimer] = useState(0);
  const [pdfName, setPdfName] = useState(''); // for custom PDF file name

  // Timer effect for normal mode loading
  useEffect(() => {
    let interval = null;
    if (mode === 'normal' && normalLoading) {
      setNormalTimer(0);
      interval = setInterval(() => setNormalTimer(prev => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [normalLoading, mode]);

  // Toggle mode (if you also implement track mode, this will switch modes)
  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
      // Reset normal mode state when switching modes
      setNormalFiles([]);
      setNormalDownloadUrl('');
      setNormalError('');
      setPdfName('');
    }
  };

  // Normal mode: useDropzone for file/folder selection.
  const onNormalDrop = useCallback((acceptedFiles) => {
    setNormalFiles(acceptedFiles);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onNormalDrop,
    multiple: true,
  });

  // Handle upload for Normal mode.
  const handleNormalUpload = async (e) => {
    e.preventDefault();
    if (normalFiles.length === 0) {
      setNormalError('Please drop file(s) or folder(s) to upload.');
      return;
    }
    setNormalError('');
    setNormalLoading(true);
    setNormalDownloadUrl('');

    const formData = new FormData();
    normalFiles.forEach(file => {
      formData.append('fileUpload', file);
    });

    try {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errMsg = await response.json();
        setNormalError(errMsg.error || 'Upload failed');
      } else {
        const data = await response.json();
        setNormalDownloadUrl(data.downloadUrl);
      }
    } catch (err) {
      setNormalError('Error: ' + err.message);
    } finally {
      setNormalLoading(false);
    }
  };

  // Updated PDF download function that paginates all combined output.
  const handleDownloadPDF = async () => {
    if (!normalDownloadUrl) return;
    try {
      // Fetch the combined text file from the backend.
      const response = await fetch(`http://localhost:3001${normalDownloadUrl}`);
      const text = await response.text();

      // Create a PDF document with jsPDF.
      const doc = new jsPDF();
      const margin = 10;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const maxLineWidth = pageWidth - margin * 2;
      const lines = doc.splitTextToSize(text, maxLineWidth);

      let y = margin;
      const lineHeight = 10; // Adjust this value if needed
      // Loop through each line; add new page when necessary.
      lines.forEach((line) => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });

      // Determine final file name; append .pdf if missing.
      const fileName = pdfName ? pdfName : "output.pdf";
      const finalFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : fileName + '.pdf';
      doc.save(finalFileName);
    } catch (err) {
      alert("Error generating PDF: " + err.message);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Grow in timeout={1000}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h2" component="h1" sx={{ fontWeight: 'bold', color: '#3f51b5' }}>
            Striver Pasting Service
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#555', mt: 1 }}>
            Effortlessly combine and convert your code!
          </Typography>
        </Box>
      </Grow>

      <ToggleButtonGroup
        color="primary"
        value={mode}
        exclusive
        onChange={handleModeChange}
        sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}
      >
        <ToggleButton value="normal">Normal Upload</ToggleButton>
        {/* Future track mode toggle can go here */}
      </ToggleButtonGroup>

      {mode === 'normal' && (
        <>
          <Grow in timeout={1500}>
            <Typography variant="body1" gutterBottom align="center">
              Drag & drop files/folders here, or click to select.
            </Typography>
          </Grow>
          <Grow in timeout={2000}>
            <Box
              {...getRootProps()}
              sx={{
                border: '3px dashed #3f51b5',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                mb: 3,
                background: 'linear-gradient(135deg, #e3f2fd, #f3e5f5)',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                '&:hover': { backgroundColor: '#e8eaf6' }
              }}
            >
              <input {...getInputProps()} webkitdirectory="true" directory="true" multiple />
              {isDragActive ? (
                <Typography variant="h6" sx={{ color: '#3f51b5' }}>
                  Drop the files/folders here...
                </Typography>
              ) : (
                <Typography variant="h6" sx={{ color: '#3f51b5' }}>
                  Drag & drop files/folders here, or click to select.
                </Typography>
              )}
            </Box>
          </Grow>

          {normalFiles.length > 0 && (
            <Grow in timeout={2500}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6">Selected Files:</Typography>
                <List>
                  {normalFiles.map((file, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={file.name}
                        secondary={file.webkitRelativePath ? file.webkitRelativePath : 'No folder path'}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Grow>
          )}

          <Grow in timeout={3000}>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Button variant="contained" color="primary" onClick={handleNormalUpload} disabled={normalLoading}>
                {normalLoading ? 'Uploading...' : 'Upload and Process'}
              </Button>
            </Box>
          </Grow>

          {normalLoading && (
            <Grow in timeout={3500}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                <Typography>Processing... {normalTimer} s</Typography>
              </Box>
            </Grow>
          )}

          {normalError && (
            <Grow in timeout={3500}>
              <Typography color="error" align="center" gutterBottom>
                {normalError}
              </Typography>
            </Grow>
          )}

          {normalDownloadUrl && (
            <Grow in timeout={4000}>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="h6">Processing complete!</Typography>
                <Link href={`http://localhost:3001${normalDownloadUrl}`} target="_blank" rel="noopener" sx={{ display: 'block', mb: 2 }}>
                  Download Combined Output (Text)
                </Link>

                {/* PDF Download Option */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    Enter a name for the PDF:
                  </Typography>
                  <input 
                    type="text" 
                    placeholder="e.g., myoutput.pdf"
                    value={pdfName}
                    onChange={(e) => setPdfName(e.target.value)}
                    style={{ padding: '8px', width: '100%', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                  <Button variant="contained" color="secondary" onClick={handleDownloadPDF}>
                    Download as PDF
                  </Button>
                </Box>
              </Box>
            </Grow>
          )}
        </>
      )}

      {/* Track mode can be added similarly with its own transitions and styling */}
    </Container>
  );
}

export default App;
